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
  const [running, setRunning] = useState(session.timerState !== "paused");
  const [confirming, setConfirming] = useState(false);
  const [minutes, setMinutes] = useState("45");
  const [busy, setBusy] = useState(false);
  const { elapsed, setElapsed } = useElapsedSeconds({ active: open && running });

  // Initialize elapsed from active intervals (survives reloads and pauses).
  useEffect(() => {
    if (!open) return;
    const isPaused = session.timerState === "paused";
    setRunning(!isPaused);

    let base = session.elapsedActiveSeconds || 0;
    if (!isPaused && session.lastStartedAt) {
      base += Math.max(0, Math.floor((Date.now() - new Date(session.lastStartedAt).getTime()) / 1000));
    } else if (!session.lastStartedAt && !session.elapsedActiveSeconds && session.startedAt) {
      base = Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000));
    }

    setElapsed(base);
    setConfirming(false);
    setMinutes(String(Math.min(600, Math.max(1, Math.round(base / 60)))));
  }, [open, session.id, session.startedAt, session.lastStartedAt, session.elapsedActiveSeconds, session.timerState, setElapsed]);

  // Handle multiple tabs safely via window storage events
  useEffect(() => {
    if (!open) return;
    const handleStorage = (e) => {
      if (e.key === `studyflow_timer_${session.id}` && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.action === "pause") {
            setRunning(false);
            if (data.elapsed != null) setElapsed(data.elapsed);
          } else if (data.action === "resume") {
            setRunning(true);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [open, session.id, setElapsed]);

  const togglePause = async () => {
    if (busy) return;
    const action = running ? "pause" : "resume";
    setBusy(true);
    try {
      const res = await api(`/api/sessions/${session.id}/${action}`, { method: "POST" });
      setRunning(!running);
      if (action === "pause" && res?.elapsedActiveSeconds != null) {
        setElapsed(res.elapsedActiveSeconds);
        setMinutes(String(Math.min(600, Math.max(1, Math.round(res.elapsedActiveSeconds / 60)))));
      }
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(
          `studyflow_timer_${session.id}`,
          JSON.stringify({ action, elapsed: res?.elapsedActiveSeconds ?? elapsed, timestamp: Date.now() })
        );
      }
      if (onChanged) onChanged();
    } catch (err) {
      toast({ title: `Could not ${action} timer`, description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  };

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
          <Button variant="outline" onClick={togglePause} disabled={busy}>
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
          className="inline-flex min-h-[36px] items-center justify-center rounded-md px-3 py-2 text-xs text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Skip this session instead
        </button>
      </div>
    </Dialog>
  );
}
