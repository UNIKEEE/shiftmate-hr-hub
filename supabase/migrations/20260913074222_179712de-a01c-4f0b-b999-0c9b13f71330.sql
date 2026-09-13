-- enums
CREATE TYPE public.app_role AS ENUM ('admin','hr','employee');
CREATE TYPE public.request_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.attendance_status AS ENUM ('present','late','early_leave','absent','on_leave','incomplete');
CREATE TYPE public.leave_type AS ENUM ('annual','sick','unpaid','casual');

-- departments
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  job_title text NOT NULL DEFAULT 'Employee',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  monthly_salary numeric(12,2) NOT NULL DEFAULT 0,
  joined_on date NOT NULL DEFAULT current_date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.profile_id
    WHERE p.user_id = _user_id AND ur.role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'admin') OR public.has_role(_user_id,'hr')
$$;

-- org settings
CREATE TABLE public.org_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  company_name text NOT NULL DEFAULT 'Shiftmate Inc.',
  work_start time NOT NULL DEFAULT '09:00',
  work_end time NOT NULL DEFAULT '17:00',
  grace_minutes int NOT NULL DEFAULT 10,
  late_deduction_per_hour numeric(10,2) NOT NULL DEFAULT 12.00,
  early_leave_deduction_per_hour numeric(10,2) NOT NULL DEFAULT 12.00,
  absent_deduction_per_day numeric(10,2) NOT NULL DEFAULT 120.00,
  missing_punch_penalty numeric(10,2) NOT NULL DEFAULT 25.00,
  currency text NOT NULL DEFAULT 'USD',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.org_settings TO authenticated;
GRANT ALL ON public.org_settings TO service_role;
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.org_settings (id) VALUES (true);

-- shifts
CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_date date NOT NULL,
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '17:00',
  label text NOT NULL DEFAULT 'Day shift',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, shift_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shifts TO authenticated;
GRANT ALL ON public.shifts TO service_role;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- attendance
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  clock_in timestamptz,
  clock_out timestamptz,
  status public.attendance_status NOT NULL DEFAULT 'present',
  late_minutes int NOT NULL DEFAULT 0,
  early_leave_minutes int NOT NULL DEFAULT 0,
  worked_minutes int NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, work_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- leave requests
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type public.leave_type NOT NULL DEFAULT 'annual',
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  decided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- attendance corrections
CREATE TABLE public.attendance_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  requested_clock_in timestamptz,
  requested_clock_out timestamptz,
  reason text NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  decided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_corrections TO authenticated;
GRANT ALL ON public.attendance_corrections TO service_role;
ALTER TABLE public.attendance_corrections ENABLE ROW LEVEL SECURITY;

-- salary slips
CREATE TABLE public.salary_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_month date NOT NULL,
  base_pay numeric(12,2) NOT NULL DEFAULT 0,
  total_deductions numeric(12,2) NOT NULL DEFAULT 0,
  net_pay numeric(12,2) NOT NULL DEFAULT 0,
  days_present int NOT NULL DEFAULT 0,
  days_absent int NOT NULL DEFAULT 0,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, period_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_slips TO authenticated;
GRANT ALL ON public.salary_slips TO service_role;
ALTER TABLE public.salary_slips ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.salary_slip_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_id uuid NOT NULL REFERENCES public.salary_slips(id) ON DELETE CASCADE,
  kind text NOT NULL,
  description text NOT NULL,
  ref_date date,
  minutes int NOT NULL DEFAULT 0,
  amount numeric(12,2) NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_slip_lines TO authenticated;
GRANT ALL ON public.salary_slip_lines TO service_role;
ALTER TABLE public.salary_slip_lines ENABLE ROW LEVEL SECURITY;

-- audit log
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- policies
CREATE POLICY "read departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage departments" ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete profiles" ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "read roles" ON public.user_roles FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id() OR public.is_staff(auth.uid()));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "read settings" ON public.org_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins update settings" ON public.org_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "read shifts" ON public.shifts FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id() OR public.is_staff(auth.uid()));
CREATE POLICY "staff manage shifts" ON public.shifts FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "read attendance" ON public.attendance_records FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id() OR public.is_staff(auth.uid()));
CREATE POLICY "insert own attendance" ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.current_profile_id() OR public.is_staff(auth.uid()));
CREATE POLICY "update own attendance" ON public.attendance_records FOR UPDATE TO authenticated
  USING (profile_id = public.current_profile_id() OR public.is_staff(auth.uid()))
  WITH CHECK (profile_id = public.current_profile_id() OR public.is_staff(auth.uid()));
CREATE POLICY "staff delete attendance" ON public.attendance_records FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "read leave" ON public.leave_requests FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id() OR public.is_staff(auth.uid()));
CREATE POLICY "create own leave" ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "decide leave" ON public.leave_requests FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()) OR (profile_id = public.current_profile_id() AND status = 'pending'))
  WITH CHECK (public.is_staff(auth.uid()) OR profile_id = public.current_profile_id());
CREATE POLICY "delete own pending leave" ON public.leave_requests FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()) OR (profile_id = public.current_profile_id() AND status = 'pending'));

CREATE POLICY "read corrections" ON public.attendance_corrections FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id() OR public.is_staff(auth.uid()));
CREATE POLICY "create own correction" ON public.attendance_corrections FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "decide corrections" ON public.attendance_corrections FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "delete own pending correction" ON public.attendance_corrections FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()) OR (profile_id = public.current_profile_id() AND status = 'pending'));

CREATE POLICY "read slips" ON public.salary_slips FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id() OR public.is_staff(auth.uid()));
CREATE POLICY "staff manage slips" ON public.salary_slips FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "read slip lines" ON public.salary_slip_lines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.salary_slips s WHERE s.id = slip_id
    AND (s.profile_id = public.current_profile_id() OR public.is_staff(auth.uid()))));
CREATE POLICY "staff manage slip lines" ON public.salary_slip_lines FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "read audit" ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR subject_profile_id = public.current_profile_id());
CREATE POLICY "write audit" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_profile_id = public.current_profile_id());

-- signup bootstrap: first user becomes admin, everyone else an employee
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
  RETURN _pid;
END;
$$;