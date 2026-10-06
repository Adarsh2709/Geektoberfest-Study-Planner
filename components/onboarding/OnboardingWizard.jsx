"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, LogOut } from "lucide-react";
import { api } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { WelcomeStep } from "./WelcomeStep";
import { SubjectStep } from "./SubjectStep";
import { SyllabusStep } from "./SyllabusStep";
import { AvailabilityStep } from "./AvailabilityStep";
import { SummaryStep } from "./SummaryStep";

const STEP_LABELS = ["Welcome", "Subjects", "Syllabus", "Availability", "Summary"];

export function OnboardingWizard({ userName }) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [subjects, setSubjects] = useState(null);
  const [topics, setTopics] = useState([]);
  const [availability, setAvailability] = useState(null);

  const reload = async () => {
    try {
      const [s, t] = await Promise.all([api("/api/subjects"), api("/api/topics")]);
      setSubjects(s.subjects);
      setTopics(t.topics);
    } catch (err) {
      toast({ title: "Could not load your data", description: err.message, variant: "error" });
      setSubjects([]);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.replace("/login");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-lg font-semibold">
          <span className="rounded-lg bg-indigo-600 p-1.5">
            <GraduationCap className="h-5 w-5 text-white" />
          </span>
          StudyFlow
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut /> Sign out
        </Button>
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-700">
            Step {step + 1} of 5 · {STEP_LABELS[step]}
          </span>
          <span className="text-zinc-400">Hi {userName.split(" ")[0]} 👋</span>
        </div>
        <Progress value={((step + 1) / 5) * 100} />
      </div>

      <Card>
        <CardContent className="p-6 md:p-8">
          {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
          {step === 1 && subjects && (
            <SubjectStep subjects={subjects} onRefresh={reload} onNext={() => setStep(2)} onBack={() => setStep(0)} />
          )}
          {step === 2 && subjects && (
            <SyllabusStep
              subjects={subjects}
              topics={topics}
              onRefresh={reload}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <AvailabilityStep
              onNext={(saved) => {
                setAvailability(saved);
                setStep(4);
              }}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <SummaryStep
              subjects={subjects || []}
              topics={topics}
              availability={availability}
              onBack={() => setStep(3)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
