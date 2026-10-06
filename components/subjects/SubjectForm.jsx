"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn, SUBJECT_COLORS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function SubjectForm({ initial, onSubmit, submitting = false, submitLabel = "Save Subject" }) {
  const [name, setName] = useState(initial?.name || "");
  const [examDate, setExamDate] = useState(initial?.examDate || "");
  const [priority, setPriority] = useState(initial?.priority || "medium");
  const [color, setColor] = useState(initial?.color || SUBJECT_COLORS[0]);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Subject name is required.");
      return;
    }
    if (!examDate) {
      setError("Exam date is required.");
      return;
    }
    await onSubmit({ name: name.trim(), examDate, priority, color });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="subject-name">Subject name</Label>
        <Input
          id="subject-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Operating Systems"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="subject-exam">Exam date</Label>
          <Input
            id="subject-exam"
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subject-priority">Priority</Label>
          <Select id="subject-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {SUBJECT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              onClick={() => setColor(c)}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                color === c ? "border-zinc-900" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
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
