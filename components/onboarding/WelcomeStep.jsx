"use client";

import { ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WelcomeStep({ onNext }) {
  return (
    <div className="py-10 text-center">
      <span className="mx-auto flex w-fit rounded-2xl bg-indigo-50 p-4">
        <GraduationCap className="h-8 w-8 text-indigo-600" />
      </span>
      <h2 className="mt-6 text-3xl font-semibold tracking-tight">Welcome to StudyFlow</h2>
      <p className="mt-3 text-zinc-500">Let&apos;s build a study plan around your exams.</p>
      <Button size="lg" className="mt-8" onClick={onNext}>
        Get Started <ArrowRight />
      </Button>
    </div>
  );
}
