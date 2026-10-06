"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { WEEK_ORDER, WEEKDAY_NAMES, api } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export function AvailabilityStep({ onNext, onBack }) {
  const toast = useToast();
  const [preferred, setPreferred] = useState("evening");
  const [dailyDefault, setDailyDefault] = useState("120");
  const [minutes, setMinutes] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api("/api/settings");
        const prefs = data.user?.preferences || {};
        setPreferred(prefs.preferredStudyTime || "evening");
        setDailyDefault(String(prefs.dailyStudyMinutes ?? 120));
        const initial = {};
        for (const day of WEEK_ORDER) {
          const raw = (prefs.weeklyAvailability || {})[String(day)];
          initial[String(day)] = raw != null ? String(raw) : String(prefs.dailyStudyMinutes ?? 120);
        }
        if (!cancelled) setMinutes(initial);
      } catch {
        /* defaults are fine */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const weeklyAvailability = {};
      for (const day of WEEK_ORDER) {
        const v = Number(minutes[String(day)]);
        weeklyAvailability[String(day)] = Number.isFinite(v) ? Math.min(1440, Math.max(0, Math.round(v))) : 0;
      }
      const daily = Math.min(1440, Math.max(0, Number(dailyDefault) || 120));
      await api("/api/settings", {
        method: "PUT",
        body: { preferredStudyTime: preferred, dailyStudyMinutes: daily, weeklyAvailability },
      });
      const sum = Object.values(weeklyAvailability).reduce((n, v) => n + v, 0);
      onNext({ weeklyMinutes: sum, preferredStudyTime: preferred, dailyStudyMinutes: daily });
    } catch (err) {
      toast({ title: "Could not save availability", description: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">How much time do you have?</h2>
        <p className="mt-1 text-sm text-zinc-500">
          StudyFlow will never schedule more than this per day.
        </p>
      </div>

      <div className="space-y-3">
        <Label>Study minutes per day</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {WEEK_ORDER.map((day) => (
            <div key={day} className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2.5">
              <span className="flex-1 text-sm text-zinc-600">{WEEKDAY_NAMES[day]}</span>
              <Input
                type="number"
                min={0}
                max={1440}
                step={15}
                value={minutes[String(day)] ?? ""}
                onChange={(e) => setMinutes((m) => ({ ...m, [String(day)]: e.target.value }))}
                className="h-8 w-24"
                aria-label={`${WEEKDAY_NAMES[day]} minutes`}
                required
              />
              <span className="text-xs text-zinc-400">min</span>
            </div>
          ))}
        </div>
        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="onb-daily">Default daily minutes (fallback)</Label>
          <Input
            id="onb-daily"
            type="number"
            min={0}
            max={1440}
            value={dailyDefault}
            onChange={(e) => setDailyDefault(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Preferred study time</Label>
        <div className="flex flex-wrap gap-2">
          {["morning", "afternoon", "evening", "night"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPreferred(t)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                preferred === t
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between border-t border-zinc-100 pt-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : null}
          Next <ArrowRight />
        </Button>
      </div>
    </form>
  );
}
