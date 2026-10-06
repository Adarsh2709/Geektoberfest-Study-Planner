"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Pause, Play } from "lucide-react";
import { api, formatClock } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useElapsedSeconds } from "@/hooks/useTimer";

export function TimerDialog({ session, open, onClose, onChanged }) {
  const router = useRouter();
  const toast = useToast();
  const [running, setRunning] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [minutes, setMinutes] = useState("45");
  const [busy, setBusy] = useState(false);
  const { elapsed, setElapsed } = useElapsedSeconds({ active: open && running });

  // Initialize elapsed from the server-side startedAt on open (survives reloads).
  useEffect(() => {
    if (!open) return;
    const base = session.startedAt
      ? Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000))
      : 0;
    setElapsed(base);
    setRunning(true);
    setConfirming(false);
    setMinutes(String(Math.min(600, Math.max(1, Math.round(base / 60)))));
  }, [open, session.id, session.startedAt, setElapsed]);

  const complete = async () => {
    const value = Math.min(1440, Math.max(0, Number(minutes) || 0));
    setBusy(true);
    try {
      await api(`/api/sessions/${session.id}/complete`, {
        method: "POST",
        body: { actualMinutes: value },
      });
      toast({
        title: "Session completed 🎉",
        description: `${session.topicName} — ${value > 0 ? `${value} min` : "no time"} logged.`,
        variant: "success",
      });
      router.refresh();
      if (onChanged) onChanged();
      onClose();
    } catch (err) {
      toast({ title: "Could not complete session", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    setBusy(true);
    try {
      await api(`/api/sessions/${session.id}/skip`, { method: "POST" });
      toast({ title: "Session skipped", description: session.topicName });
      router.refresh();
      if (onChanged) onChanged();
      onClose();
    } catch (err) {
      toast({ title: "Could not skip session", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={session.topicName}
      description={`${session.subjectName} · ${session.plannedMinutes} min planned`}
    >
      <div className="flex flex-col items-center gap-6 py-2">
        <div className="text-5xl font-semibold tabular-nums tracking-tight">{formatClock(elapsed)}</div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRunning((r) => !r)}>
            {running ? <Pause /> : <Play />}
            {running ? "Pause" : "Resume"}
          </Button>
          <Button variant="success" onClick={() => setConfirming(true)}>
            <CheckCircle2 /> Complete
          </Button>
        </div>

        {confirming && (
          <div className="w-full max-w-xs space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="timer-minutes">Actual study minutes</Label>
              <Input
                id="timer-minutes"
                type="number"
                min={0}
                max={1440}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button variant="success" size="sm" onClick={complete} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : null}
                Mark complete
              </Button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={skip}
          disabled={busy}
          className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline"
        >
          Skip this session instead
        </button>
      </div>
    </Dialog>
  );
}
