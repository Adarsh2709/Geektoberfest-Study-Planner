import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.onboarded) redirect("/dashboard");

  return <OnboardingWizard userName={user.name} />;
}
