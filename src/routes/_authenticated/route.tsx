import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  Timer,
  Users,
  Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { meQuery } from "@/lib/api";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppLayout,
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm text-destructive" role="alert">
      {error.message}
    </div>
  ),
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, access: "all" },
  { to: "/calendar", label: "Shifts", icon: CalendarDays, access: "all" },
  { to: "/leave", label: "Leave", icon: ClipboardCheck, access: "all" },
  { to: "/corrections", label: "Corrections", icon: Wrench, access: "all" },
  { to: "/payslips", label: "Salary slips", icon: Receipt, access: "all" },
  { to: "/team", label: "Team", icon: Users, access: "staff" },
  { to: "/admin", label: "Admin", icon: Settings, access: "admin" },
] as const;

function AppLayout() {
  const { data: me, isLoading } = useQuery(meQuery);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const roleLabel = me?.isAdmin ? "Admin" : me?.isStaff ? "HR / Manager" : "Employee";
  const items = NAV.filter(
    (n) =>
      n.access === "all" ||
      (n.access === "staff" && me?.isStaff) ||
      (n.access === "admin" && me?.isAdmin),
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-5 lg:px-6">
        <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-60 shrink-0 flex-col rounded-3xl border border-sidebar-border bg-sidebar p-4 lg:flex">
          <Link to="/dashboard" className="mb-6 flex items-center gap-2 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <Timer className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold text-sidebar-foreground">Shiftmate</span>
          </Link>
          <nav className="flex flex-1 flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className: "!bg-sidebar-primary !text-sidebar-primary-foreground",
                }}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="rounded-2xl bg-sidebar-accent p-3">
            <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">
              {isLoading ? "Loading…" : (me?.profile.full_name ?? "Signed in")}
            </p>
            <p className="text-xs text-sidebar-accent-foreground/70">{roleLabel}</p>
            <button
              onClick={signOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border px-3 py-1.5 text-xs font-medium text-sidebar-accent-foreground transition-colors hover:bg-sidebar"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-5 flex items-center justify-between gap-3">
            <div className="lg:hidden">
              <span className="font-display text-lg font-bold">Shiftmate</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <ThemeSwitcher />
              <button
                onClick={signOut}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium lg:hidden"
              >
                Sign out
              </button>
            </div>
          </header>

          <nav className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium",
                )}
                activeProps={{ className: "!bg-primary !text-primary-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
