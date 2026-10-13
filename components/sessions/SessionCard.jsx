"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle2, Loader2, MinusCircle, Play } from "lucide-react";
import { api, cn, formatMinutes } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { TimerDialog } from "./TimerDialog";
import { CompleteSessionDialog } from "./CompleteSessionDialog";
import { RescheduleDialog } from "./RescheduleDialog";

const STATUS_ICON = {
  planned: <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-zinc-300" />,
  in_progress: <Play className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" />,
  completed: <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />,
  skipped: <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />,
};

export function SessionCard({ session, compact = false, onChanged }) {
  const router = useRouter();
  const toast = useToast();
  const [timerOpen, setTimerOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    router.refresh();
    if (onChanged) onChanged();
  };

  const start = async () => {
    setBusy(true);
    try {
      await api(`/api/sessions/${session.id}/start`, { method: "POST" });
      setTimerOpen(true);
      refresh();
    } catch (err) {
      toast({ title: "Could not start session", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    setBusy(true);
    try {
      await api(`/api/sessions/${session.id}/skip`, { method: "POST" });
      toast({ title: "Session skipped", description: `${session.topicName} was marked as skipped.` });
      refresh();
    } catch (err) {
      toast({ title: "Could not skip session", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const done = session.status === "completed";
  const skipped = session.status === "skipped";

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-shadow hover:shadow-md",
        compact ? "p-0" : "",
        (done || skipped) && "opacity-70"
      )}
    >
      <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: session.subjectColor }} />
      <CardContent className={cn("flex flex-wrap items-center justify-between gap-2", compact ? "p-3 pl-4" : "p-4 pl-5")}>
        <div className="flex min-w-0 items-start gap-2.5">
          {STATUS_ICON[session.status]}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className={cn("truncate font-medium", done && "text-zinc-500 line-through")}>
                {session.topicName}
              </p>
              {!compact && <Badge variant="secondary">{session.plannedMinutes} min</Badge>}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: session.subjectColor }} />
              <span className="truncate">{session.subjectName}</span>
              {compact && <span>· {session.plannedMinutes}m</span>}
              {done && session.actualMinutes > 0 && (
                <span className="text-emerald-600">· studied {formatMinutes(session.actualMinutes)}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {session.status === "planned" && (
            <>
              <Button size="sm" onClick={start} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Play />}
                Start
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRescheduleOpen(true)}
                disabled={busy}
                title="Reschedule session"
              >
                <Calendar className="h-3.5 w-3.5" />
                {!compact && "Reschedule"}
              </Button>
              {!compact && (
                <Button size="sm" variant="ghost" onClick={skip} disabled={busy}>
                  Skip
                </Button>
              )}
            </>
          )}
          {session.status === "in_progress" && (
            <>
              <Button size="sm" onClick={() => setTimerOpen(true)} disabled={busy}>
                <Play /> {compact ? "" : "Continue"}
              </Button>
              {!compact && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setCompleteOpen(true)} disabled={busy}>
                    Complete
                  </Button>
                  <Button size="sm" variant="ghost" onClick={skip} disabled={busy}>
                    Skip
                  </Button>
                </>
              )}
            </>
          )}
          {done && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Completed
            </span>
          )}
          {skipped && (
            <span className="flex items-center gap-1 text-xs font-medium text-zinc-400">
              <MinusCircle className="h-3.5 w-3.5" /> Skipped
            </span>
          )}
        </div>
      </CardContent>

      <TimerDialog session={session} open={timerOpen} onClose={() => setTimerOpen(false)} onChanged={refresh} />
      <CompleteSessionDialog
        session={session}
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onChanged={refresh}
      />
      <RescheduleDialog
        session={session}
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        onChanged={refresh}
      />
    </Card>
  );
}
