"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TopicsManager } from "@/components/subjects/TopicsManager";

export function SyllabusStep({ subjects, topics, onRefresh, onNext, onBack }) {
  const [selectedId, setSelectedId] = useState(subjects[0]?.id || null);
  const selected = subjects.find((s) => s.id === selectedId) || subjects[0];
  const selectedTopics = topics.filter((t) => t.subjectId === selected?.id);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Build your syllabus</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Generate topics with AI, or add them manually. Everything is editable.
        </p>
      </div>

      {subjects.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => {
            const count = topics.filter((t) => t.subjectId === s.id).length;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  s.id === selected?.id
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
                <span className={cn("text-[10px]", s.id === selected?.id ? "text-indigo-200" : "text-zinc-400")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected && <TopicsManager subject={selected} topics={selectedTopics} onChanged={onRefresh} showCompletedToggle={false} />}

      <div className="flex justify-between border-t border-zinc-100 pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <Button onClick={onNext} disabled={topics.length === 0}>
          Next <ArrowRight />
        </Button>
      </div>
      {topics.length === 0 && (
        <p className="text-xs text-zinc-400">Add at least one topic to continue.</p>
      )}
    </div>
  );
}
