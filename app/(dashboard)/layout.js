import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function DashboardLayout({ children }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  return <AppShell user={{ name: user.name, email: user.email }}>{children}</AppShell>;
}
