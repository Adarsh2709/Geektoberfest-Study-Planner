"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { api, cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Planner", href: "/planner", icon: CalendarDays },
  { label: "Today's Study", href: "/today", icon: ListChecks },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Progress", href: "/progress", icon: BarChart3 },
];

function NavLinks({ onNavigate }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 px-3 py-2">
      <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        Overview
      </p>
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-500" />
            )}
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ user, onNavigate }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <div className="flex items-center gap-2.5 px-6 py-6 text-lg font-semibold">
        <span className="rounded-lg bg-indigo-600 p-1.5">
          <GraduationCap className="h-5 w-5 text-white" />
        </span>
        StudyFlow
      </div>

      <NavLinks onNavigate={onNavigate} />

      <div className="space-y-1 px-3 pb-6">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Account
        </p>
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            usePathnameSafe("/settings")
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            title="Log out"
            aria-label="Log out"
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function usePathnameSafe(prefix) {
  const pathname = usePathname();
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export function AppShell({ user, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 md:block">
        <SidebarContent user={user} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2 font-semibold">
          <span className="rounded-lg bg-indigo-600 p-1">
            <GraduationCap className="h-4 w-4 text-white" />
          </span>
          StudyFlow
        </div>
        <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 animate-sf-fade bg-zinc-950/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 animate-sf-in">
            <SidebarContent user={user} onNavigate={() => setDrawerOpen(false)} />
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute right-4 top-3 rounded-md bg-white/10 p-2 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <main className="md:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
