import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Flame,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { buildRecommendationContext, getDashboardData } from "@/lib/dashboard";
import { getRecommendationSafe } from "@/lib/ai";
import { cn, formatDate, formatMinutes, getGreeting } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SessionCard } from "@/components/sessions/SessionCard";
import { StatCard } from "@/components/dashboard/StatCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getAuthUser();
  const data = await getDashboardData(String(user._id));
  const recommendation = await getRecommendationSafe(buildRecommendationContext(data));
  const { stats, todayProgress, nextExam, atRisk } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {getGreeting()}, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Here&apos;s your study progress.</p>
      </div>

      {data.adjustment.adjusted && data.adjustment.missedMinutes > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Plan adjusted</p>
            <p>
              {formatMinutes(data.adjustment.missedMinutes)} of unfinished work was redistributed
              across the next {data.adjustment.daysAffected} day
              {data.adjustment.daysAffected === 1 ? "" : "s"}.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Clock} label="Total Study Time" value={formatMinutes(stats.totalStudyMinutes)} />
        <StatCard icon={TrendingUp} label="Completion Rate" value={`${stats.completionRate}%`} />
        <StatCard icon={CheckCircle2} label="Completed Sessions" value={stats.completedCount} />
        <StatCard icon={Flame} label="Current Streak" value={`${stats.streak} day${stats.streak === 1 ? "" : "s"}`} />
      </div>

      {/* Next exam / today / recommendation */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Next Exam</CardDescription>
          </CardHeader>
          <CardContent>
            {nextExam ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: nextExam.color }} />
                    <p className="font-semibold">{nextExam.name}</p>
                  </div>
                  <Badge variant={nextExam.daysLeft <= 7 ? "destructive" : "warning"}>
                    {nextExam.daysLeft} day{nextExam.daysLeft === 1 ? "" : "s"} left
                  </Badge>
                </div>
                <p className="mt-1.5 text-sm text-zinc-500">Exam on {formatDate(nextExam.examDate)}</p>
                <div className="mt-4">
                  <Progress value={nextExam.progress} />
                  <p className="mt-1.5 text-xs text-zinc-500">
                    {nextExam.progress}% of topics · {nextExam.completedTopics}/{nextExam.topics}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-500">No upcoming exams. Add exam dates to your subjects.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Today&apos;s Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight">
              {todayProgress.completedCount}
              <span className="text-base font-normal text-zinc-400"> / {todayProgress.total} sessions</span>
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {formatMinutes(todayProgress.completedMinutes)} / {formatMinutes(todayProgress.plannedMinutes)} planned
            </p>
            <div className="mt-4">
              <Progress value={todayProgress.percent} />
            </div>
            <Link
              href="/today"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
            >
              Go to today&apos;s study <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Recommendation
              </span>
              <Badge variant={recommendation.source === "ai" ? "default" : "secondary"}>
                {recommendation.source === "ai" ? "AI" : "Rule-based"}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-zinc-600">{recommendation.text}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's sessions + at risk */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Today&apos;s Sessions</CardTitle>
            <Badge variant="secondary">
              {todayProgress.completedCount}/{todayProgress.total}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.todaySessions.length === 0 ? (
              <div className="py-10 text-center">
                <p className="font-medium text-zinc-700">No study sessions today 🎉</p>
                <p className="mt-1 text-sm text-zinc-500">You&apos;re all caught up.</p>
                <Link
                  href="/planner"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
                >
                  View planner
                </Link>
              </div>
            ) : (
              data.todaySessions.map((s) => <SessionCard key={s.id} session={s} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> At-Risk Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {atRisk.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">
                No at-risk subjects — you&apos;re on track. 🎯
              </p>
            ) : (
              atRisk.map((s) => (
                <div key={s.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                    {s.daysLeft >= 0 && (
                      <span className="text-xs text-zinc-400">{s.daysLeft}d left</span>
                    )}
                  </div>
                  <Progress value={s.progress} />
                  <p className="text-xs text-zinc-500">{s.reason}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
