import { getAuthUser } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getAuthUser();
  const prefs = user.preferences || {};
  return (
    <SettingsForm
      user={{
        name: user.name,
        email: user.email,
        preferences: {
          dailyStudyMinutes: prefs.dailyStudyMinutes ?? 120,
          preferredStudyTime: prefs.preferredStudyTime ?? "evening",
          weeklyAvailability: prefs.weeklyAvailability || {},
        },
      }}
    />
  );
}
