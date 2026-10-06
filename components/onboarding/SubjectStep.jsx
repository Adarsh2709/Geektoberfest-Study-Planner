"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2 } from "lucide-react";
import { api, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { SubjectForm } from "@/components/subjects/SubjectForm";

export function SubjectStep({ subjects, onRefresh, onNext, onBack }) {
  const toast = useToast();
  const [showForm, setShowForm] = useState(subjects.length === 0);
  const [saving, setSaving] = useState(false);

  const createSubject = async (values) => {
    setSaving(true);
    try {
      await api("/api/subjects", { method: "POST", body: values });
      toast({ title: "Subject added", variant: "success" });
      await onRefresh();
    } catch (err) {
      toast({ title: "Could not add subject", description: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const deleteSubject = async (id) => {
    try {
      await api(`/api/subjects/${id}`, { method: "DELETE" });
      await onRefresh();
    } catch (err) {
      toast({ title: "Could not delete subject", description: err.message, variant: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Add your subjects</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Each subject needs an exam date — StudyFlow prioritizes around it.
        </p>
      </div>

      {subjects.length > 0 && (
        <div className="space-y-2">
          {subjects.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-zinc-500">Exam: {formatDate(s.examDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={s.priority === "high" ? "destructive" : s.priority === "medium" ? "warning" : "secondary"}>
                  {s.priority}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-red-600"
                  onClick={() => deleteSubject(s.id)}
                  aria-label="Remove subject"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <SubjectForm onSubmit={createSubject} submitting={saving} submitLabel="Add Subject" />
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <Plus /> Add Subject
        </Button>
      )}

      <div className="flex justify-between border-t border-zinc-100 pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <Button onClick={onNext} disabled={subjects.length === 0}>
          Next <ArrowRight />
        </Button>
      </div>
      {subjects.length === 0 && (
        <p className="text-xs text-zinc-400">Add at least one subject to continue.</p>
      )}
    </div>
  );
}
