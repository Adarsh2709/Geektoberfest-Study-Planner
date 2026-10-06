"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import {
  addDays,
  api,
  cn,
  dayKey,
  formatMinutes,
  formatShortDate,
  parseDayKey,
  startOfWeek,
  todayKey,
  weekdayOfKey,
  WEEKDAY_NAMES,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { SessionCard } from "@/components/sessions/SessionCard";

export function PlannerView({ initialWeekKey, initialSessions, subjects, availability }) {
  const toast = useToast();
  const router = useRouter();

  const [weekKey, setWeekKey] = useState(initialWeekKey);
  const [sessions, setSessions] = useState(initialSessions);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("week");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [recalculating, setRecalculating] = useState(false);
  const loadedKey = useRef(initialWeekKey);

  const fetchWeek = async (key) => {
    setLoading(true);
    try {
      const to = dayKey(addDays(parseDayKey(key), 6));
      const data = await api(`/api/sessions?from=${key}&to=${to}`);
      setSessions(data.sessions);
      loadedKey.current = key;
    } catch (err) {
      toast({ title: "Could not load sessions", description: err.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (weekKey !== loadedKey.current) {
      fetchWeek(weekKey);
    }
  }, [weekKey]);

  // Keep local state in sync when the server refetches the current week (router.refresh()).
  useEffect(() => {
    if (loadedKey.current === initialWeekKey) {
      setSessions(initialSessions);
    }
  }, [initialSessions, initialWeekKey]);

  const capacityFor = (key) => {
    const weekly = availability?.weeklyAvailability || {};
    const raw = weekly[String(weekdayOfKey(key))];
    if (typeof raw === "number" && raw >= 0) return raw;
    return availability?.dailyStudyMinutes ?? 120;
  };

  const days = Array.from({ length: 7 }, (_, i) => dayKey(addDays(parseDayKey(weekKey), i)));
  const endKey = days[6];

  const filtered = sessions.filter(
    (s) =>
      (subjectFilter === "all" || s.subjectId === subjectFilter) &&
      (view === "today" ? s.date === todayKey() : true)
  );
  const visibleDays = view === "today" ? days.filter((d) => d === todayKey()) : days;

  const goToday = () => {
    const current = dayKey(startOfWeek(new Date()));
    setView("today");
    if (weekKey !== current) setWeekKey(current);
  };

  const recalculate = async () => {
    setRecalculating(true);
    try {
      const res = await api("/api/planner/recalculate", { method: "POST" });
      toast({
        title: "✓ Your study plan has been adjusted.",
        description: res.adjusted
          ? `${formatMinutes(res.missedMinutes)} of unfinished work was redistributed across the next ${res.daysAffected} day(s).`
          : "No unfinished work found — your plan is up to date.",
        variant: "success",
      });
      await fetchWeek(weekKey);
      router.refresh();
    } catch (err) {
      toast({ title: "Recalculation failed", description: err.message, variant: "error" });
    } finally {
      setRecalculating(false);
    }
  };

  const renderDayHeader = (key, showMinutes = true) => {
    const isToday = key === todayKey();
    const dayMinutes = filtered.filter((s) => s.date === key).reduce((n, s) => n + s.plannedMinutes, 0);
    const cap = capacityFor(key);
    return (
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-sm font-semibold", isToday ? "text-indigo-600" : "text-zinc-800")}>
            {WEEKDAY_NAMES[weekdayOfKey(key)]}
          </span>
          <span className="text-xs text-zinc-400">{formatShortDate(key)}</span>
          {isToday && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-indigo-600">
              Today
            </span>
          )}
        </div>
        {showMinutes && (
          <span className={cn("text-xs", dayMinutes > cap ? "text-red-500" : "text-zinc-400")}>
            {formatMinutes(dayMinutes)} / {formatMinutes(cap)}
          </span>
        )}
      </div>
    );
  };

  const renderDayCards = (key) => {
    const daySessions = filtered.filter((s) => s.date === key);
    if (daySessions.length === 0) {
      return <p className="rounded-lg border border-dashed border-zinc-200 p-3 text-xs text-zinc-400">Free day</p>;
    }
    return (
      <div className="space-y-2">
        {daySessions.map((s) => (
          <SessionCard key={s.id} session={s} compact onChanged={() => fetchWeek(weekKey)} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Weekly Planner</h1>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous week"
              onClick={() => setWeekKey(dayKey(addDays(parseDayKey(weekKey), -7)))}
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-40 text-center text-sm text-zinc-500">
              {formatShortDate(weekKey)} – {formatShortDate(endKey)}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next week"
              onClick={() => setWeekKey(dayKey(addDays(parseDayKey(weekKey), 7)))}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>
            <CalendarDays /> Today
          </Button>
          <div className="flex rounded-lg border border-zinc-300 bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setView("week")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                view === "week" ? "bg-indigo-600 text-white" : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setView("today")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                view === "today" ? "bg-indigo-600 text-white" : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              Today
            </button>
          </div>
          <Button size="sm" onClick={recalculate} disabled={recalculating}>
            {recalculating ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Recalculate Plan
          </Button>
        </div>
      </div>

      {/* Subject filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSubjectFilter("all")}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            subjectFilter === "all"
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
          )}
        >
          All
        </button>
        {subjects.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSubjectFilter(s.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              subjectFilter === s.id
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-7">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <p className="font-medium text-zinc-700">No sessions this week</p>
          <p className="mt-1 text-sm text-zinc-500">
            {subjects.length === 0
              ? "Add subjects and generate a plan to fill your calendar."
              : "Try another week, or recalculate your plan."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop calendar grid */}
          <div className="hidden gap-3 md:grid md:grid-cols-7">
            {visibleDays.map((key) => (
              <div
                key={key}
                className={cn(
                  "min-h-64 rounded-xl border p-2.5",
                  key === todayKey() ? "border-indigo-300 bg-indigo-50/40" : "border-zinc-200 bg-zinc-50/60"
                )}
              >
                {renderDayHeader(key)}
                {renderDayCards(key)}
              </div>
            ))}
          </div>

          {/* Mobile: daily list */}
          <div className="space-y-5 md:hidden">
            {visibleDays.map((key) => (
              <div key={key}>
                {renderDayHeader(key)}
                {renderDayCards(key)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
