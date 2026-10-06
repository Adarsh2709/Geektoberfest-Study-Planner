"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarCheck, Loader2 } from "lucide-react";
import { api, daysBetween, todayKey } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function SummaryStep({ subjects, topics, availability, onBack }) {
  const router = useRouter();
  const toast = useToast();
  const [generating, setGenerating] = useState(false);

  const daysLeft = subjects.reduce(
    (max, s) => Math.max(max, daysBetween(todayKey(), s.examDate)),
    0
  );
  const weeklyMinutes = availability?.weeklyMinutes ?? 0;
  const hours = Math.round(weeklyMinutes / 60);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await api("/api/planner/generate", { method: "POST" });
      toast({
        title: "Your study plan is ready 🎉",
        description: `${res.sessionsCreated} sessions scheduled.`,
        variant: "success",
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      toast({ title: "Could not generate plan", description: err.message, variant: "error" });
      setGenerating(false);
    }
  };

  const stats = [
    { label: "Subjects", value: subjects.length },
    { label: "Topics", value: topics.length },
    { label: "Days", value: daysLeft },
    { label: "Hours available", value: `${hours}h` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">You&apos;re ready to go</h2>
        <p className="mt-1 text-sm text-zinc-500">Here&apos;s what StudyFlow will plan around.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-200 p-4 text-center">
            <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between border-t border-zinc-100 pt-4">
        <Button variant="ghost" onClick={onBack} disabled={generating}>
          <ArrowLeft /> Back
        </Button>
        <Button size="lg" onClick={generate} disabled={generating}>
          {generating ? <Loader2 className="animate-spin" /> : <CalendarCheck />}
          Generate My Study Plan
        </Button>
      </div>
    </div>
  );
}
