"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export function CompleteSessionDialog({ session, open, onClose, onChanged }) {
  const router = useRouter();
  const toast = useToast();
  const [minutes, setMinutes] = useState("45");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let defaultMinutes = session.plannedMinutes;
    if (session.startedAt) {
      defaultMinutes = Math.min(
        600,
        Math.max(1, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000))
      );
    }
    setMinutes(String(defaultMinutes));
  }, [open, session.id, session.startedAt, session.plannedMinutes]);

  const submit = async (e) => {
    e.preventDefault();
    const value = Math.min(1440, Math.max(0, Number(minutes) || 0));
    setBusy(true);
    try {
      await api(`/api/sessions/${session.id}/complete`, { method: "POST", body: { actualMinutes: value } });
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Complete session"
      description={`${session.topicName} · ${session.subjectName}`}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="complete-minutes">Actual study minutes</Label>
          <Input
            id="complete-minutes"
            type="number"
            min={0}
            max={1440}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            aria-describedby="complete-minutes-desc"
            required
          />
          <p id="complete-minutes-desc" className="text-xs text-zinc-400">
            This is recorded as your actual study time.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : null}
            Mark complete
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
