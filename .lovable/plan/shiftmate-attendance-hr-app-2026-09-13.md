# Shiftmate — attendance & HR app

A full staff attendance and HR app with real sign-in, a real database, and three role-based experiences: Employee, HR/Manager, Admin. Three looks to choose from: Beige, Light, Dark.

## What people can do

**Employee**
- Clock in and clock out from a home card showing today's status, worked hours, and late/early flags
- See a monthly shift calendar with assigned shifts, worked days, absences and leave
- Request leave (type, dates, reason) and track status
- Ask for an attendance correction when a punch is wrong or missing
- View and download monthly salary slips showing pay and deductions

**HR / Manager**
- Team dashboard: who's in, who's late, who's absent today
- Approve or reject leave requests with a note
- Approve or reject attendance corrections; every decision is recorded in an audit trail
- Assign and edit shifts on a team calendar
- Generate salary slips for the month

**Admin**
- Everything HR can do, plus manage staff (add people, set role, department, hourly/monthly pay)
- Configure rules: work hours, grace period for lateness, deduction rates
- Full audit log across the app

## Clock in/out rules
- One open session per day; can't clock in twice or clock out without clocking in
- Compares against the assigned shift to mark Late, Early leave, Overtime, Absent
- Optional note required when outside shift window

## Salary slips
Pay is calculated from attendance only, with deductions for:
- Unpaid leave days
- Late arrivals (beyond the grace period)
- Early departures
- Missing/incomplete punches
Each slip lists the dates and minutes behind every deduction, plus net pay.

## Themes
A theme switcher in the top bar with Beige (warm paper), Light, and Dark. Choice is remembered per person.

## Demo data
Seeded sample company: ~12 staff across 3 departments, a month of shifts and attendance records, pending leave and correction requests, and generated salary slips — so every screen looks real immediately. Demo sign-in details will be shown on the sign-in page.

## Technical notes
- Lovable Cloud (Postgres + auth) enabled; email/password sign-in.
- Tables: `profiles`, `user_roles` (separate table, `has_role()` security-definer function), `departments`, `shifts`, `attendance_records`, `leave_requests`, `attendance_corrections`, `salary_slips`, `salary_slip_lines`, `audit_log`, `org_settings`. RLS on all: employees see own rows, HR/Admin see all via `has_role`.
- All writes (clock in/out, approvals, slip generation) go through `createServerFn` with `requireSupabaseAuth` so validation and role checks are server-side; approvals write audit rows in the same transaction path.
- Routes: public `/` landing + `/auth`; protected `/dashboard`, `/calendar`, `/leave`, `/corrections`, `/payslips`, `/team`, `/admin`, each with its own head metadata.
- Theme tokens (beige/light/dark) defined in `src/styles.css` via `@theme inline` + a `data-theme` variant; no hardcoded colors in components.
- Seed data ships as literal INSERTs in the migration.

## Build order
1. Enable Cloud, schema + RLS + seed migration
2. Auth, roles, theming, app shell
3. Employee: clock in/out, calendar, leave, corrections
4. HR/Manager: approvals, audit trail, shift assignment
5. Admin: staff, settings, audit log
6. Salary slips and deduction breakdown
