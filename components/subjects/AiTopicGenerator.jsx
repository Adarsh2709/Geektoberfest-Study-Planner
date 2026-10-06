"use client";

import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { api } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

export function AiTopicGenerator({ subjectId, subjectName, onAdded }) {
  const toast = useToast();
  const [subject, setSubject] = useState(subjectName || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");

  const generate = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return;
    setLoading(true);
    setNotice("");
    setSuggestions([]);
    try {
      const data = await api("/api/ai/syllabus", { method: "POST", body: { subject: subject.trim() } });
      if (!data.available) {
        setNotice(data.reason || "AI is unavailable — add topics manually below.");
      } else {
        setSuggestions(data.topics);
        toast({ title: "Topics generated", description: "Review and edit before adding." });
      }
    } catch (err) {
      setNotice("AI is unavailable — add topics manually below.");
    } finally {
      setLoading(false);
    }
  };

  const updateSuggestion = (index, patch) => {
    setSuggestions((list) => list.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const addAll = async () => {
    setAdding(true);
    try {
      for (const t of suggestions) {
        await api("/api/topics", {
          method: "POST",
          body: { subjectId, name: t.name, difficulty: t.difficulty, estimatedMinutes: t.estimatedMinutes, importance: t.importance },
        });
      }
      toast({
        title: `${suggestions.length} topic${suggestions.length === 1 ? "" : "s"} added`,
        description: "Recalculate your plan to schedule them.",
        variant: "success",
      });
      setSuggestions([]);
      if (onAdded) onAdded();
    } catch (err) {
      toast({ title: "Could not add topics", description: err.message, variant: "error" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
      <form onSubmit={generate} className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject name, e.g. Operating Systems"
          className="bg-white"
        />
        <Button type="submit" disabled={loading || !subject.trim()} className="shrink-0">
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
          Generate Topics
        </Button>
      </form>

      {notice && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{notice}</p>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="space-y-2">
            {suggestions.map((t, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2">
                <Input
                  value={t.name}
                  onChange={(e) => updateSuggestion(i, { name: e.target.value })}
                  className="h-8 flex-1"
                  aria-label="Topic name"
                />
                <Select
                  value={t.difficulty}
                  onChange={(e) => updateSuggestion(i, { difficulty: e.target.value })}
                  className="h-8 w-28"
                  aria-label="Difficulty"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </Select>
                <Input
                  type="number"
                  min={5}
                  max={600}
                  value={t.estimatedMinutes}
                  onChange={(e) => updateSuggestion(i, { estimatedMinutes: Number(e.target.value) || 60 })}
                  className="h-8 w-20"
                  aria-label="Minutes"
                />
                <button
                  type="button"
                  onClick={() => setSuggestions((list) => list.filter((_, idx) => idx !== i))}
                  className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                  aria-label="Remove topic"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button size="sm" onClick={addAll} disabled={adding}>
            {adding ? <Loader2 className="animate-spin" /> : null}
            Add {suggestions.length} topic{suggestions.length === 1 ? "" : "s"}
          </Button>
        </div>
      )}
    </div>
  );
}
