import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getAuthUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-2.5 text-xl font-semibold">
          <span className="rounded-lg bg-indigo-600 p-1.5">
            <GraduationCap className="h-5 w-5 text-white" />
          </span>
          StudyFlow
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to continue your study plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoginForm />
            <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-xs text-zinc-500">
              Demo account (after running <span className="font-mono">npm run seed</span>):{" "}
              <span className="font-mono">demo@studyflow.app</span> /{" "}
              <span className="font-mono">demo1234</span>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-indigo-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
