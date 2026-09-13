import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AttendanceStatus, RequestStatus } from "@/lib/api";
import { STATUS_LABEL } from "@/lib/api";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

const ATTENDANCE_TONE: Record<AttendanceStatus, string> = {
  present: "bg-success/15 text-success",
  late: "bg-warning/20 text-warning",
  early_leave: "bg-warning/20 text-warning",
  absent: "bg-destructive/15 text-destructive",
  on_leave: "bg-info/15 text-info",
  incomplete: "bg-muted text-muted-foreground",
};

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        ATTENDANCE_TONE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

const REQUEST_TONE: Record<RequestStatus, string> = {
  pending: "bg-warning/20 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        REQUEST_TONE[status],
      )}
    >
      {status}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass = {
    default: "text-foreground",
    good: "text-success",
    warn: "text-warning",
    bad: "text-destructive",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={cn("mt-2 font-display text-2xl font-bold", toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}
