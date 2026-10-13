"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Calendar, Loader2 } from "lucide-react";
import { api, todayKey } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export function RescheduleDialog({ session, open, onClose, onChanged }) {
  const router = useRouter();
  const toast = useToast();
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate(session.date || todayKey());
    setError("");
  }, [open, session.id, session.date]);

  const submit = async (e) => {
    e.preventDefault();
    if (!date) return;
    setBusy(true);
    setError("");
    try {
      const res = await api(`/api/sessions/${session.id}/reschedule`, {
        method: "POST",
        body: { date },
      });

      if (res.warning) {
        toast({
          title: "Session Rescheduled with Warning ⚠️",
          description: res.warning,
          variant: "warning",
        });
      } else {
        toast({
          title: "Session Rescheduled 📅",
          description: `${session.topicName} moved to ${date}.`,
          variant: "success",
        });
      }

      router.refresh();
      if (onChanged) onChanged();
      onClose();
    } catch (err) {
      setError(err.message);
      toast({ title: "Could not reschedule session", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Reschedule study session"
      description={`${session.topicName} · ${session.subjectName}`}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="reschedule-date">Select New Date</Label>
          <Input
            id="reschedule-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setError("");
            }}
            aria-describedby="reschedule-date-desc"
            required
          />
          <p id="reschedule-date-desc" className="text-xs text-zinc-400">
            Choose a date before the subject exam deadline.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !date}>
            {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Calendar className="mr-1.5 h-3.5 w-3.5" />}
            Confirm Reschedule
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
