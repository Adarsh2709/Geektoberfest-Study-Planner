import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarClock, GraduationCap, RefreshCw, Sparkles } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: CalendarClock,
    title: "Deterministic planning engine",
    text: "Subjects, topics, exam dates and your real available time become a day-wise plan — daily capacity and exam deadlines are always respected.",
  },
  {
    icon: Sparkles,
    title: "AI-assisted syllabus",
    text: "Enter a subject name and AI suggests topics, difficulty and estimated study time. You review and edit everything before it's saved.",
  },
  {
    icon: RefreshCw,
    title: "Adaptive replanning",
    text: "StudyFlow tracks what you actually complete. Fall behind, and unfinished work is automatically redistributed across future study slots.",
  },
];

export default async function Home() {
  const user = await getAuthUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2.5 text-lg font-semibold">
          <span className="rounded-lg bg-indigo-600 p-1.5">
            <GraduationCap className="h-5 w-5 text-white" />
          </span>
          StudyFlow
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Sign in
          </Link>
          <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
            Get started <ArrowRight />
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            AI assists. The plan engine decides.
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            Turn your syllabus into a study plan that{" "}
            <span className="text-indigo-600">adapts when life happens</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-500">
            StudyFlow schedules your topics around exam dates and the time you actually have — and
            automatically redistributes unfinished work when you fall behind.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
              Create your plan <ArrowRight />
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Sign in
            </Link>
          </div>
        </section>

        <section className="border-t border-zinc-100 bg-zinc-50/60 py-16">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <span className="inline-flex rounded-lg bg-indigo-50 p-2.5">
                  <f.icon className="h-5 w-5 text-indigo-600" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-100 py-8 text-center text-sm text-zinc-400">
        StudyFlow — plan smarter, not harder.
      </footer>
    </div>
  );
}
