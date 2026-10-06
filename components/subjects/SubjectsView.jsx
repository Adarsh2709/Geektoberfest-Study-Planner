"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  api,
  daysBetween,
  formatDate,
  formatMinutes,
  PRIORITY_VARIANT,
  todayKey,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { SubjectForm } from "./SubjectForm";
import { TopicsManager } from "./TopicsManager";

export function SubjectsView({ subjects }) {
  const router = useRouter();
  const toast = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [detail, setDetail] = useState(null); // { subject, topics, stats }
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setDetail({ subject: null, topics: [], stats: null });
    try {
      const data = await api(`/api/subjects/${id}`);
      setDetail(data);
    } catch (err) {
      toast({ title: "Could not load subject", description: err.message, variant: "error" });
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshAll = async () => {
    router.refresh();
    if (detail?.subject) {
      try {
        const data = await api(`/api/subjects/${detail.subject.id}`);
        setDetail(data);
      } catch {
        /* ignore */
      }
    }
  };

  const createSubject = async (values) => {
    setSaving(true);
    try {
      await api("/api/subjects", { method: "POST", body: values });
      toast({ title: "Subject added", variant: "success" });
      setAddOpen(false);
      router.refresh();
    } catch (err) {
      toast({ title: "Could not add subject", description: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const updateSubject = async (values) => {
    setSaving(true);
    try {
      await api(`/api/subjects/${editing.id}`, { method: "PATCH", body: values });
      toast({ title: "Subject updated", variant: "success" });
      setEditing(null);
      refreshAll();
    } catch (err) {
      toast({ title: "Could not update subject", description: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const deleteSubject = async () => {
    setConfirmBusy(true);
    try {
      await api(`/api/subjects/${deleting.id}`, { method: "DELETE" });
      toast({ title: "Subject deleted", description: `${deleting.name} and its data were removed.` });
      setDeleting(null);
      setDetail(null);
      router.refresh();
    } catch (err) {
      toast({ title: "Could not delete subject", description: err.message, variant: "error" });
    } finally {
      setConfirmBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subjects</h1>
          <p className="mt-1 text-sm text-zinc-500">Your syllabus, exam dates and progress.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus /> Add Subject
        </Button>
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-zinc-300" />
          <p className="mt-4 font-medium text-zinc-700">No subjects yet.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Add your first subject to build your study plan.
          </p>
          <Button className="mt-5" onClick={() => setAddOpen(true)}>
            <Plus /> Add Subject
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((s) => {
            const daysLeft = daysBetween(todayKey(), s.examDate);
            return (
              <Card key={s.id} className="flex flex-col">
                <CardContent className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-xs text-zinc-500">Exam: {formatDate(s.examDate)}</p>
                      </div>
                    </div>
                    <Badge variant={PRIORITY_VARIANT[s.priority] || "secondary"}>{s.priority}</Badge>
                  </div>
                  {daysLeft >= 0 ? (
                    <Badge variant={daysLeft <= 7 ? "destructive" : daysLeft <= 21 ? "warning" : "secondary"} className="mt-3">
                      {daysLeft} day{daysLeft === 1 ? "" : "s"} left
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="mt-3">Exam passed</Badge>
                  )}
                  <div className="mt-4">
                    <Progress value={s.progress} />
                    <div className="mt-1.5 flex justify-between text-xs text-zinc-500">
                      <span>{s.completedTopics} / {s.topics} topics</span>
                      <span>{s.progress}%</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
                      {formatMinutes(s.pendingMinutes)} of study left
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="justify-end gap-1 border-t border-zinc-100 p-3">
                  <Button size="sm" variant="outline" onClick={() => openDetail(s.id)}>
                    View
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(s)} aria-label="Edit subject">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-zinc-400 hover:text-red-600"
                    onClick={() => setDeleting(s)}
                    aria-label="Delete subject"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add subject */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add subject" description="Exams power StudyFlow's prioritization.">
        <SubjectForm onSubmit={createSubject} submitting={saving} submitLabel="Add Subject" />
      </Dialog>

      {/* Edit subject */}
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit subject">
        {editing && (
          <SubjectForm
            key={editing.id}
            initial={editing}
            onSubmit={updateSubject}
            submitting={saving}
            submitLabel="Save Changes"
          />
        )}
      </Dialog>

      {/* Subject detail */}
      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.subject?.name || "Subject"}
        description={
          detail?.subject
            ? `Exam ${formatDate(detail.subject.examDate)} · ${detail.subject.priority} priority`
            : undefined
        }
      >
        {detailLoading || !detail?.subject ? (
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{detail.stats?.completedTopics ?? 0} / {detail.stats?.topics ?? 0} topics completed</span>
                <span className="text-zinc-500">{detail.stats?.progress ?? 0}%</span>
              </div>
              <Progress value={detail.stats?.progress ?? 0} className="mt-2" />
              <p className="mt-2 text-xs text-zinc-500">
                {formatMinutes(detail.stats?.doneMinutes || 0)} studied ·{" "}
                {formatMinutes(detail.stats?.pendingMinutes || 0)} remaining
              </p>
            </div>
            <TopicsManager subject={detail.subject} topics={detail.topics} onChanged={refreshAll} />
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={deleteSubject}
        busy={confirmBusy}
        title="Delete subject"
        description={`"${deleting?.name}", its topics and its sessions will be permanently removed.`}
      />
    </div>
  );
}
