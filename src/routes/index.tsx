import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, ClipboardCheck, FileSpreadsheet, ShieldCheck, Timer } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shiftmate — Attendance, Shifts & Payroll for Teams" },
      {
        name: "description",
        content:
          "Shiftmate handles clock in/out, shift calendars, leave approvals, attendance corrections and salary slips with full deduction breakdowns.",
      },
      { property: "og:title", content: "Shiftmate — Attendance, Shifts & Payroll for Teams" },
      {
        property: "og:description",
        content:
          "Clock in/out, shift calendars, leave approvals, attendance corrections and salary slips in one workspace.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Timer,
    title: "Clock in, clock out",
    body: "Validated punches that compare against the assigned shift and flag late arrivals or early exits automatically.",
  },
  {
    icon: CalendarClock,
    title: "Shift calendars",
    body: "A month at a glance for everyone: assigned shifts, worked days, absences and approved leave.",
  },
  {
    icon: ClipboardCheck,
    title: "Leave & corrections",
    body: "Employees request, managers decide, and every decision lands in a permanent audit trail.",
  },
  {
    icon: FileSpreadsheet,
    title: "Salary slips",
    body: "Each slip lists the exact dates and minutes behind every attendance deduction, down to net pay.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Timer className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold">Shiftmate</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <Link
            to="/auth"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pt-12 pb-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Role-based workspace for employees, HR and admins
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl leading-[1.05] font-bold text-foreground sm:text-6xl">
            Attendance that actually adds up on payday.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Shiftmate ties every punch, shift and approved leave day to the salary slip — so the
            deductions your team sees are the ones they can check line by line.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Create your workspace
            </Link>
            <Link
              to="/auth"
              className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              I already have an account
            </Link>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <article key={f.title} className="rounded-2xl border border-border bg-card p-5">
                <f.icon className="h-6 w-6 text-primary" />
                <h2 className="mt-4 text-base font-semibold text-card-foreground">{f.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
          Shiftmate — attendance, shifts and payroll in one place.
        </div>
      </footer>
    </div>
  );
}
