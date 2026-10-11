import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { getSessionsDetailed } from "@/lib/queries";
import { cn, formatDate, formatMinutes, todayKey } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SessionCard } from "@/components/sessions/SessionCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Today's Study" };

export default async function TodayPage() {
  const user = await getAuthUser();
  const timeZone = user?.preferences?.timeZone || "UTC";
  const key = todayKey(timeZone);
  const sessions = await getSessionsDetailed(String(user._id), { from: key, to: key });

  const planned = sessions.reduce((n, s) => n + s.plannedMinutes, 0);
  const completed = sessions
    .filter((s) => s.status === "completed")
    .reduce((n, s) => n + (s.actualMinutes || 0), 0);
  const percent = planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today&apos;s Study</h1>
        <p className="mt-1 text-sm text-zinc-500">{formatDate(key)}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600">
            <span className="text-2xl font-semibold text-zinc-900">{formatMinutes(completed)}</span>
            <span className="mx-1.5 text-zinc-400">of</span>
            {formatMinutes(planned)} planned
          </p>
          <div className="w-full sm:w-64">
            <Progress value={percent} />
            <p className="mt-1 text-right text-xs text-zinc-500">{percent}%</p>
          </div>
        </CardContent>
      </Card>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <p className="font-medium text-zinc-700">No study sessions today 🎉</p>
          <p className="mt-1 text-sm text-zinc-500">You&apos;re all caught up.</p>
          <Link href="/planner" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>
            View planner
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}
