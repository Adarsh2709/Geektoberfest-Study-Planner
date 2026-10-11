"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, SkipForward, Target } from "lucide-react";
import { addDays, dayKey, formatDate, formatMinutes, formatShortDate, startOfDay, todayKey } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/StatCard";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "skipped", label: "Skipped" },
  { value: "in_progress", label: "In progress" },
  { value: "planned", label: "Planned" },
];
const STATUS_VARIANT = { completed: "success", skipped: "destructive", in_progress: "warning", planned: "secondary" };
const STATUS_LABEL = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));

const axisProps = {
  tickLine: false,
  axisLine: { stroke: "#e4e4e7" },
  tick: { fontSize: 12, fill: "#71717a" },
};

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-zinc-500">
          {p.name}: {formatMinutes(p.value)}
        </p>
      ))}
    </div>
  );
}

export function StudyHistory({ subjects, topics }) {
  const [filters, setFilters] = useState(() => ({
    from: dayKey(addDays(startOfDay(new Date()), -29)),
    to: todayKey(),
    subjectId: "",
    topicId: "",
    status: "",
  }));
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const subjectTopics = useMemo(
    () => topics.filter((t) => !filters.subjectId || t.subjectId === filters.subjectId),
    [topics, filters.subjectId]
  );

  function update(patch) {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }

  const rangeError =
    !filters.from || !filters.to
      ? "Pick both a start and an end date."
      : filters.from > filters.to
        ? "Start date must be on or before the end date."
        : "";

  useEffect(() => {
    if (rangeError) return;
    const controller = new AbortController();
    const qs = new URLSearchParams({ from: filters.from, to: filters.to, page: String(page), limit: "10" });
    for (const k of ["subjectId", "topicId", "status"]) if (filters[k]) qs.set(k, filters[k]);

    setLoading(true);
    setError("");
    fetch(`/api/progress/history?${qs}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`);
        setData(body);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters, page, rangeError]);

  const shownError = rangeError || error;
  const summary = data?.summary;
  const hasRecords = summary && summary.totalSessions > 0;
  const trendPoints = (data?.trend.points || []).map((p) => ({ ...p, name: formatShortDate(p.label) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Study History</CardTitle>
        <CardDescription>Look back at past sessions and compare planned time with what you actually studied</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="history-from">From</Label>
            <Input id="history-from" type="date" value={filters.from} onChange={(e) => update({ from: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="history-to">To</Label>
            <Input id="history-to" type="date" value={filters.to} onChange={(e) => update({ to: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="history-subject">Subject</Label>
            <Select
              id="history-subject"
              value={filters.subjectId}
              onChange={(e) => update({ subjectId: e.target.value, topicId: "" })}
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="history-topic">Topic</Label>
            <Select id="history-topic" value={filters.topicId} onChange={(e) => update({ topicId: e.target.value })}>
              <option value="">All topics</option>
              {subjectTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="history-status">Status</Label>
            <Select id="history-status" value={filters.status} onChange={(e) => update({ status: e.target.value })}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {shownError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {shownError}
          </p>
        )}

        {!rangeError && loading && !data && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {!rangeError && data && !error && (
          <div className={loading ? "space-y-6 opacity-60 transition-opacity" : "space-y-6"}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Target} label="Planned" value={formatMinutes(summary.plannedMinutes)} />
              <StatCard icon={Clock} label="Actually Studied" value={formatMinutes(summary.actualMinutes)} />
              <StatCard icon={CheckCircle2} label="Completed Sessions" value={summary.completedCount} />
              <StatCard icon={SkipForward} label="Skipped Sessions" value={summary.skippedCount} />
            </div>

            {!hasRecords ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
                No study sessions match these filters. Try a wider date range or clear the subject, topic or status filter.
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-medium text-zinc-700">
                    Planned vs actual, per {data.trend.granularity === "week" ? "week" : "day"}
                  </h3>
                  <div className="mt-2 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendPoints} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                        <XAxis dataKey="name" {...axisProps} minTickGap={16} />
                        <YAxis {...axisProps} width={48} tickFormatter={(v) => formatMinutes(v)} />
                        <Tooltip content={<TrendTooltip />} cursor={{ fill: "#fafafa" }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="planned" name="Planned" fill="#d4d4d8" radius={[4, 4, 0, 0]} maxBarSize={20} />
                        <Bar dataKey="actual" name="Actual" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs text-zinc-500">
                      <tr className="border-b border-zinc-200">
                        <th className="py-2 pr-4 font-medium">Date</th>
                        <th className="py-2 pr-4 font-medium">Subject / Topic</th>
                        <th className="py-2 pr-4 font-medium">Planned</th>
                        <th className="py-2 pr-4 font-medium">Actual</th>
                        <th className="py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sessions.map((s) => (
                        <tr key={s.id} className="border-b border-zinc-100 last:border-0">
                          <td className="whitespace-nowrap py-2.5 pr-4 text-zinc-600">{formatDate(s.date)}</td>
                          <td className="py-2.5 pr-4">
                            <span className="flex items-center gap-2 font-medium">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.subjectColor }} />
                              {s.subjectName}
                            </span>
                            <span className="text-xs text-zinc-500">{s.topicName}</span>
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4">{formatMinutes(s.plannedMinutes)}</td>
                          <td className="whitespace-nowrap py-2.5 pr-4">{formatMinutes(s.actualMinutes)}</td>
                          <td className="py-2.5">
                            <Badge variant={STATUS_VARIANT[s.status] || "secondary"}>{STATUS_LABEL[s.status] || s.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>
                    {data.pagination.total} session{data.pagination.total === 1 ? "" : "s"} · Page {data.pagination.page} of{" "}
                    {data.pagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading || page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft /> Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading || page >= data.pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next <ChevronRight />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
