"use client";

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
import { CheckCircle2, Clock, Flame, TrendingUp } from "lucide-react";
import { formatMinutes } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/StatCard";
import { StudyHistory } from "@/components/progress/StudyHistory";

function MinutesTooltip({ active, payload, label }) {
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

const axisProps = {
  tickLine: false,
  axisLine: { stroke: "#e4e4e7" },
  tick: { fontSize: 12, fill: "#71717a" },
};

export function ProgressCharts({ data, topics = [] }) {
  const { daily, weekly, subjects, stats } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <p className="mt-1 text-sm text-zinc-500">How your studying is actually going.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Completion Rate" value={`${stats.completionRate}%`} />
        <StatCard icon={Flame} label="Current Streak" value={`${stats.streak} day${stats.streak === 1 ? "" : "s"}`} />
        <StatCard icon={Clock} label="Total Study Time" value={formatMinutes(stats.totalStudyMinutes)} />
        <StatCard icon={CheckCircle2} label="Completed Sessions" value={stats.completedCount} />
      </div>

      {stats.totalStudyMinutes === 0 && stats.completedCount === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
          No study activity yet — complete your first session and your analytics will appear here.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Study Hours</CardTitle>
            <CardDescription>Total completed study time per week (last 6 weeks)</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="week" {...axisProps} />
                <YAxis {...axisProps} width={48} tickFormatter={(v) => `${Math.round(v / 60)}h`} />
                <Tooltip content={<MinutesTooltip />} cursor={{ fill: "#fafafa" }} />
                <Bar dataKey="minutes" name="Studied" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planned vs Completed</CardTitle>
            <CardDescription>Planned vs actually studied minutes (last 7 days)</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="day" {...axisProps} />
                <YAxis {...axisProps} width={48} tickFormatter={(v) => `${Math.round(v / 60)}h`} />
                <Tooltip content={<MinutesTooltip />} cursor={{ fill: "#fafafa" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="planned" name="Planned" fill="#d4d4d8" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subject Progress</CardTitle>
          <CardDescription>Topic completion per subject</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subjects.length === 0 ? (
            <p className="text-sm text-zinc-500">No subjects yet.</p>
          ) : (
            subjects.map((s) => (
              <div key={s.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {s.completedTopics}/{s.topics} topics · {s.progress}%
                  </span>
                </div>
                <Progress value={s.progress} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <StudyHistory subjects={subjects} topics={topics} />
    </div>
  );
}
