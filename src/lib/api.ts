import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "hr" | "employee";
export type RequestStatus = "pending" | "approved" | "rejected";
export type AttendanceStatus =
  | "present"
  | "late"
  | "early_leave"
  | "absent"
  | "on_leave"
  | "incomplete";

export type Profile = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  job_title: string;
  department_id: string | null;
  monthly_salary: number;
  joined_on: string;
  is_active: boolean;
};

export type Me = { profile: Profile; roles: Role[]; isStaff: boolean; isAdmin: boolean };

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function fetchMe(): Promise<Me | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  let profile = unwrap(
    await supabase.from("profiles").select("*").eq("user_id", auth.user.id).maybeSingle(),
  ) as Profile | null;

  if (!profile) {
    const meta = auth.user.user_metadata as { full_name?: string } | null;
    const { error } = await supabase.rpc("bootstrap_current_user", {
      _full_name: meta?.full_name ?? "",
      _email: auth.user.email ?? "",
    });
    if (error) throw new Error(error.message);
    profile = unwrap(
      await supabase.from("profiles").select("*").eq("user_id", auth.user.id).maybeSingle(),
    ) as Profile | null;
  }
  if (!profile) return null;

  const roleRows = unwrap(
    await supabase.from("user_roles").select("role").eq("profile_id", profile.id),
  ) as { role: Role }[];
  const roles = roleRows.map((r) => r.role);
  return {
    profile,
    roles,
    isStaff: roles.includes("admin") || roles.includes("hr"),
    isAdmin: roles.includes("admin"),
  };
}

export const meQuery = queryOptions({ queryKey: ["me"], queryFn: fetchMe, staleTime: 60_000 });

export const settingsQuery = queryOptions({
  queryKey: ["org-settings"],
  queryFn: async () => unwrap(await supabase.from("org_settings").select("*").maybeSingle()),
});

export const departmentsQuery = queryOptions({
  queryKey: ["departments"],
  queryFn: async () => unwrap(await supabase.from("departments").select("*").order("name")),
});

export const teamQuery = queryOptions({
  queryKey: ["team"],
  queryFn: async () =>
    unwrap(
      await supabase
        .from("profiles")
        .select("*, departments(name), user_roles(role)")
        .order("full_name"),
    ),
});

export function attendanceQuery(profileId: string, from: string, to: string) {
  return queryOptions({
    queryKey: ["attendance", profileId, from, to],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("attendance_records")
          .select("*")
          .eq("profile_id", profileId)
          .gte("work_date", from)
          .lte("work_date", to)
          .order("work_date"),
      ),
  });
}

export function shiftsQuery(profileId: string, from: string, to: string) {
  return queryOptions({
    queryKey: ["shifts", profileId, from, to],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("shifts")
          .select("*")
          .eq("profile_id", profileId)
          .gte("shift_date", from)
          .lte("shift_date", to)
          .order("shift_date"),
      ),
  });
}

export const todayQuery = (profileId: string) =>
  queryOptions({
    queryKey: ["today", profileId],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("attendance_records")
          .select("*")
          .eq("profile_id", profileId)
          .eq("work_date", new Date().toISOString().slice(0, 10))
          .maybeSingle(),
      ),
  });

export const todayShiftQuery = (profileId: string) =>
  queryOptions({
    queryKey: ["today-shift", profileId],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("shifts")
          .select("*")
          .eq("profile_id", profileId)
          .eq("shift_date", new Date().toISOString().slice(0, 10))
          .maybeSingle(),
      ),
  });

export const leaveQuery = (scope: "mine" | "all", profileId: string) =>
  queryOptions({
    queryKey: ["leave", scope, profileId],
    queryFn: async () => {
      let q = supabase
        .from("leave_requests")
        .select("*, profiles!leave_requests_profile_id_fkey(full_name, job_title)")
        .order("created_at", { ascending: false });
      if (scope === "mine") q = q.eq("profile_id", profileId);
      return unwrap(await q);
    },
  });

export const correctionsQuery = (scope: "mine" | "all", profileId: string) =>
  queryOptions({
    queryKey: ["corrections", scope, profileId],
    queryFn: async () => {
      let q = supabase
        .from("attendance_corrections")
        .select("*, profiles!attendance_corrections_profile_id_fkey(full_name, job_title)")
        .order("created_at", { ascending: false });
      if (scope === "mine") q = q.eq("profile_id", profileId);
      return unwrap(await q);
    },
  });

export const slipsQuery = (scope: "mine" | "all", profileId: string) =>
  queryOptions({
    queryKey: ["slips", scope, profileId],
    queryFn: async () => {
      let q = supabase
        .from("salary_slips")
        .select(
          "*, profiles!salary_slips_profile_id_fkey(full_name, job_title), salary_slip_lines(*)",
        )
        .order("period_month", { ascending: false });
      if (scope === "mine") q = q.eq("profile_id", profileId);
      return unwrap(await q);
    },
  });

export const auditQuery = queryOptions({
  queryKey: ["audit"],
  queryFn: async () =>
    unwrap(
      await supabase
        .from("audit_log")
        .select(
          "*, actor:profiles!audit_log_actor_profile_id_fkey(full_name), subject:profiles!audit_log_subject_profile_id_fkey(full_name)",
        )
        .order("created_at", { ascending: false })
        .limit(100),
    ),
});

export const todayTeamQuery = queryOptions({
  queryKey: ["today-team"],
  queryFn: async () =>
    unwrap(
      await supabase
        .from("attendance_records")
        .select("*, profiles!attendance_records_profile_id_fkey(full_name, job_title)")
        .eq("work_date", new Date().toISOString().slice(0, 10)),
    ),
});

export async function logAudit(input: {
  actorProfileId: string;
  subjectProfileId: string | null;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, unknown>;
}) {
  await supabase.from("audit_log").insert({
    actor_profile_id: input.actorProfileId,
    subject_profile_id: input.subjectProfileId,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId,
    details: (input.details ?? {}) as never,
  });
}

export function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value ?? 0);
}

export function minutesLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function timeLabel(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  early_leave: "Left early",
  absent: "Absent",
  on_leave: "On leave",
  incomplete: "Incomplete",
};
