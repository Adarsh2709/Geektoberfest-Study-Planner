"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function TopicForm({ initial, onSubmit, submitting = false, submitLabel = "Add Topic" }) {
  const [name, setName] = useState(initial?.name || "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty || "medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState(String(initial?.estimatedMinutes ?? 60));
  const [importance, setImportance] = useState(String(initial?.importance ?? 5));
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Topic name is required.");
      return;
    }
    await onSubmit({
      name: name.trim(),
      difficulty,
      estimatedMinutes: Number(estimatedMinutes) || 60,
      importance: Number(importance) || 5,
    });
    if (!initial) {
      setName("");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="topic-name">Topic name</Label>
        <Input
          id="topic-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="CPU Scheduling"
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="topic-difficulty">Difficulty</Label>
          <Select
            id="topic-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="topic-minutes">Minutes</Label>
          <Input
            id="topic-minutes"
            type="number"
            min={5}
            max={600}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="topic-importance">Priority (1-10)</Label>
          <Input
            id="topic-importance"
            type="number"
            min={1}
            max={10}
            value={importance}
            onChange={(e) => setImportance(e.target.value)}
          />
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? <Loader2 className="animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
