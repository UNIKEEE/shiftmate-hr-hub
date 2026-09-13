CREATE OR REPLACE FUNCTION public.generate_demo_history(_profile_id uuid, _from date, _to date)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  d date;
  r numeric;
  late_min int;
  early_min int;
  st public.attendance_status;
  ci timestamptz;
  co timestamptz;
BEGIN
  FOR d IN SELECT generate_series(_from, _to, interval '1 day')::date LOOP
    CONTINUE WHEN extract(isodow from d) > 5;
    INSERT INTO public.shifts (profile_id, shift_date, start_time, end_time, label)
    VALUES (_profile_id, d, '09:00', '17:00', 'Day shift')
    ON CONFLICT (profile_id, shift_date) DO NOTHING;

    r := random();
    late_min := 0; early_min := 0; ci := NULL; co := NULL;
    IF r < 0.05 THEN
      st := 'absent';
    ELSIF r < 0.11 THEN
      st := 'on_leave';
    ELSIF r < 0.14 THEN
      st := 'incomplete';
      ci := (d + time '09:05') AT TIME ZONE 'UTC';
    ELSE
      IF random() < 0.28 THEN late_min := 5 + floor(random()*40)::int; END IF;
      IF random() < 0.16 THEN early_min := 5 + floor(random()*35)::int; END IF;
      ci := (d + time '09:00' + make_interval(mins => late_min)) AT TIME ZONE 'UTC';
      co := (d + time '17:00' - make_interval(mins => early_min)) AT TIME ZONE 'UTC';
      st := CASE WHEN late_min > 10 THEN 'late' WHEN early_min > 0 THEN 'early_leave' ELSE 'present' END;
    END IF;

    INSERT INTO public.attendance_records
      (profile_id, work_date, clock_in, clock_out, status, late_minutes, early_leave_minutes, worked_minutes)
    VALUES (_profile_id, d, ci, co, st, late_min, early_min,
      CASE WHEN co IS NULL THEN 0 ELSE 480 - late_min - early_min END)
    ON CONFLICT (profile_id, work_date) DO NOTHING;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_demo_history(uuid, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_demo_history(uuid, date, date) TO authenticated;

CREATE OR REPLACE FUNCTION public.generate_salary_slip(_profile_id uuid, _month date)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  s public.org_settings%ROWTYPE;
  p public.profiles%ROWTYPE;
  m_start date := date_trunc('month', _month)::date;
  m_end date := (date_trunc('month', _month) + interval '1 month - 1 day')::date;
  slip_id uuid;
  rec record;
  amt numeric(12,2);
  total numeric(12,2) := 0;
  present_days int := 0;
  absent_days int := 0;
BEGIN
  SELECT * INTO s FROM public.org_settings WHERE id;
  SELECT * INTO p FROM public.profiles WHERE id = _profile_id;
  IF p.id IS NULL THEN RAISE EXCEPTION 'profile not found'; END IF;

  DELETE FROM public.salary_slips WHERE profile_id = _profile_id AND period_month = m_start;
  INSERT INTO public.salary_slips (profile_id, period_month, base_pay, total_deductions, net_pay)
  VALUES (_profile_id, m_start, p.monthly_salary, 0, p.monthly_salary)
  RETURNING id INTO slip_id;

  INSERT INTO public.salary_slip_lines (slip_id, kind, description, amount)
  VALUES (slip_id, 'earning', 'Base monthly salary', p.monthly_salary);

  FOR rec IN
    SELECT * FROM public.attendance_records
    WHERE profile_id = _profile_id AND work_date BETWEEN m_start AND m_end
    ORDER BY work_date
  LOOP
    IF rec.status = 'absent' THEN
      absent_days := absent_days + 1;
      amt := s.absent_deduction_per_day;
      total := total + amt;
      INSERT INTO public.salary_slip_lines (slip_id, kind, description, ref_date, minutes, amount)
      VALUES (slip_id, 'absence', 'Absent - full day deduction', rec.work_date, 480, amt);
    ELSIF rec.status = 'incomplete' OR (rec.clock_in IS NOT NULL AND rec.clock_out IS NULL) THEN
      amt := s.missing_punch_penalty;
      total := total + amt;
      INSERT INTO public.salary_slip_lines (slip_id, kind, description, ref_date, minutes, amount)
      VALUES (slip_id, 'missing_punch', 'Missing clock-out', rec.work_date, 0, amt);
    ELSE
      IF rec.status <> 'on_leave' THEN present_days := present_days + 1; END IF;
      IF rec.late_minutes > s.grace_minutes THEN
        amt := round((rec.late_minutes - s.grace_minutes)::numeric / 60 * s.late_deduction_per_hour, 2);
        total := total + amt;
        INSERT INTO public.salary_slip_lines (slip_id, kind, description, ref_date, minutes, amount)
        VALUES (slip_id, 'late', 'Late arrival beyond grace period', rec.work_date,
                rec.late_minutes - s.grace_minutes, amt);
      END IF;
      IF rec.early_leave_minutes > 0 THEN
        amt := round(rec.early_leave_minutes::numeric / 60 * s.early_leave_deduction_per_hour, 2);
        total := total + amt;
        INSERT INTO public.salary_slip_lines (slip_id, kind, description, ref_date, minutes, amount)
        VALUES (slip_id, 'early_leave', 'Left before shift end', rec.work_date, rec.early_leave_minutes, amt);
      END IF;
    END IF;
  END LOOP;

  FOR rec IN
    SELECT lr.start_date, lr.end_date FROM public.leave_requests lr
    WHERE lr.profile_id = _profile_id AND lr.status = 'approved' AND lr.leave_type = 'unpaid'
      AND lr.start_date <= m_end AND lr.end_date >= m_start
  LOOP
    amt := s.absent_deduction_per_day *
           (LEAST(rec.end_date, m_end) - GREATEST(rec.start_date, m_start) + 1);
    total := total + amt;
    INSERT INTO public.salary_slip_lines (slip_id, kind, description, ref_date, minutes, amount)
    VALUES (slip_id, 'unpaid_leave', 'Approved unpaid leave', GREATEST(rec.start_date, m_start), 0, amt);
  END LOOP;

  UPDATE public.salary_slips
  SET total_deductions = total,
      net_pay = GREATEST(p.monthly_salary - total, 0),
      days_present = present_days,
      days_absent = absent_days
  WHERE id = slip_id;

  RETURN slip_id;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_salary_slip(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_salary_slip(uuid, date) TO authenticated;

CREATE OR REPLACE FUNCTION public.bootstrap_current_user(_full_name text, _email text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _pid uuid;
  _role public.app_role;
  _dept uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO _pid FROM public.profiles WHERE user_id = auth.uid();
  IF _pid IS NOT NULL THEN RETURN _pid; END IF;

  SELECT id INTO _dept FROM public.departments ORDER BY name LIMIT 1;
  INSERT INTO public.profiles (user_id, full_name, email, department_id, monthly_salary, job_title)
  VALUES (auth.uid(), COALESCE(NULLIF(_full_name,''), split_part(_email,'@',1)), _email, _dept, 4800, 'Team Member')
  RETURNING id INTO _pid;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    _role := 'employee';
  ELSE
    _role := 'admin';
  END IF;
  INSERT INTO public.user_roles (profile_id, role) VALUES (_pid, _role);

  PERFORM public.generate_demo_history(_pid, (current_date - interval '45 days')::date, current_date - 1);
  PERFORM public.generate_salary_slip(_pid, (date_trunc('month', current_date) - interval '1 month')::date);

  INSERT INTO public.leave_requests (profile_id, leave_type, start_date, end_date, reason, status)
  VALUES (_pid, 'annual', current_date + 12, current_date + 14, 'Family trip', 'pending');

  RETURN _pid;
END;
$$;
REVOKE ALL ON FUNCTION public.bootstrap_current_user(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_current_user(text, text) TO authenticated;