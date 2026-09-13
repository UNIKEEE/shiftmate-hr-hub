DROP POLICY "insert own attendance" ON public.attendance_records;
DROP POLICY "update own attendance" ON public.attendance_records;
CREATE POLICY "staff write attendance" ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY "staff update attendance" ON public.attendance_records FOR UPDATE TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY "decide leave" ON public.leave_requests;
CREATE POLICY "staff decide leave" ON public.leave_requests FOR UPDATE TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.clock_in(_note text DEFAULT NULL)
RETURNS public.attendance_records LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _pid uuid; s public.org_settings%ROWTYPE; sh public.shifts%ROWTYPE;
  _start time; _late int; _rec public.attendance_records%ROWTYPE;
BEGIN
  SELECT id INTO _pid FROM public.profiles WHERE user_id = auth.uid();
  IF _pid IS NULL THEN RAISE EXCEPTION 'No staff profile for this account'; END IF;
  SELECT * INTO _rec FROM public.attendance_records WHERE profile_id = _pid AND work_date = current_date;
  IF _rec.id IS NOT NULL AND _rec.clock_in IS NOT NULL THEN
    RAISE EXCEPTION 'You have already clocked in today';
  END IF;
  SELECT * INTO s FROM public.org_settings WHERE id;
  SELECT * INTO sh FROM public.shifts WHERE profile_id = _pid AND shift_date = current_date;
  _start := COALESCE(sh.start_time, s.work_start);
  _late := GREATEST(0, floor(EXTRACT(epoch FROM ((now() AT TIME ZONE 'UTC')::time - _start)) / 60)::int);

  INSERT INTO public.attendance_records (profile_id, work_date, clock_in, status, late_minutes, note)
  VALUES (_pid, current_date, now(),
          CASE WHEN _late > s.grace_minutes THEN 'late'::public.attendance_status
               ELSE 'incomplete'::public.attendance_status END,
          _late, _note)
  ON CONFLICT (profile_id, work_date) DO UPDATE
    SET clock_in = EXCLUDED.clock_in, late_minutes = EXCLUDED.late_minutes,
        status = EXCLUDED.status, note = COALESCE(EXCLUDED.note, public.attendance_records.note),
        updated_at = now()
  RETURNING * INTO _rec;
  RETURN _rec;
END;
$$;
REVOKE ALL ON FUNCTION public.clock_in(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clock_in(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.clock_out(_note text DEFAULT NULL)
RETURNS public.attendance_records LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _pid uuid; s public.org_settings%ROWTYPE; sh public.shifts%ROWTYPE;
  _end time; _early int; _rec public.attendance_records%ROWTYPE; _worked int;
BEGIN
  SELECT id INTO _pid FROM public.profiles WHERE user_id = auth.uid();
  IF _pid IS NULL THEN RAISE EXCEPTION 'No staff profile for this account'; END IF;
  SELECT * INTO _rec FROM public.attendance_records WHERE profile_id = _pid AND work_date = current_date;
  IF _rec.id IS NULL OR _rec.clock_in IS NULL THEN RAISE EXCEPTION 'You have not clocked in today'; END IF;
  IF _rec.clock_out IS NOT NULL THEN RAISE EXCEPTION 'You have already clocked out today'; END IF;

  SELECT * INTO s FROM public.org_settings WHERE id;
  SELECT * INTO sh FROM public.shifts WHERE profile_id = _pid AND shift_date = current_date;
  _end := COALESCE(sh.end_time, s.work_end);
  _early := GREATEST(0, floor(EXTRACT(epoch FROM (_end - (now() AT TIME ZONE 'UTC')::time)) / 60)::int);
  _worked := GREATEST(0, floor(EXTRACT(epoch FROM (now() - _rec.clock_in)) / 60)::int);

  UPDATE public.attendance_records
  SET clock_out = now(), early_leave_minutes = _early, worked_minutes = _worked,
      note = COALESCE(_note, note), updated_at = now(),
      status = CASE
        WHEN late_minutes > s.grace_minutes THEN 'late'::public.attendance_status
        WHEN _early > 0 THEN 'early_leave'::public.attendance_status
        ELSE 'present'::public.attendance_status END
  WHERE id = _rec.id
  RETURNING * INTO _rec;
  RETURN _rec;
END;
$$;
REVOKE ALL ON FUNCTION public.clock_out(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clock_out(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.apply_correction(_correction_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE c public.attendance_corrections%ROWTYPE; s public.org_settings%ROWTYPE;
  sh public.shifts%ROWTYPE; _late int := 0; _early int := 0; _worked int := 0;
BEGIN
  SELECT * INTO c FROM public.attendance_corrections WHERE id = _correction_id;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Correction not found'; END IF;
  SELECT * INTO s FROM public.org_settings WHERE id;
  SELECT * INTO sh FROM public.shifts WHERE profile_id = c.profile_id AND shift_date = c.work_date;

  IF c.requested_clock_in IS NOT NULL THEN
    _late := GREATEST(0, floor(EXTRACT(epoch FROM ((c.requested_clock_in AT TIME ZONE 'UTC')::time
             - COALESCE(sh.start_time, s.work_start))) / 60)::int);
  END IF;
  IF c.requested_clock_out IS NOT NULL THEN
    _early := GREATEST(0, floor(EXTRACT(epoch FROM (COALESCE(sh.end_time, s.work_end)
              - (c.requested_clock_out AT TIME ZONE 'UTC')::time)) / 60)::int);
    _worked := GREATEST(0, floor(EXTRACT(epoch FROM (c.requested_clock_out - c.requested_clock_in)) / 60)::int);
  END IF;

  INSERT INTO public.attendance_records
    (profile_id, work_date, clock_in, clock_out, status, late_minutes, early_leave_minutes, worked_minutes, note)
  VALUES (c.profile_id, c.work_date, c.requested_clock_in, c.requested_clock_out,
    CASE WHEN c.requested_clock_out IS NULL THEN 'incomplete'::public.attendance_status
         WHEN _late > s.grace_minutes THEN 'late'::public.attendance_status
         WHEN _early > 0 THEN 'early_leave'::public.attendance_status
         ELSE 'present'::public.attendance_status END,
    _late, _early, _worked, 'Adjusted via approved correction')
  ON CONFLICT (profile_id, work_date) DO UPDATE
    SET clock_in = EXCLUDED.clock_in, clock_out = EXCLUDED.clock_out, status = EXCLUDED.status,
        late_minutes = EXCLUDED.late_minutes, early_leave_minutes = EXCLUDED.early_leave_minutes,
        worked_minutes = EXCLUDED.worked_minutes, note = EXCLUDED.note, updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.apply_correction(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_correction(uuid) TO authenticated;