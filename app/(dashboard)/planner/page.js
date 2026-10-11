import { getAuthUser } from "@/lib/auth";
import { getSessionsDetailed, getSubjectsStats } from "@/lib/queries";
import { dayKey, startOfToday, startOfWeek } from "@/lib/utils";
import { PlannerView } from "@/components/planner/PlannerView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planner" };

export default async function PlannerPage() {
  const user = await getAuthUser();
  const timeZone = user?.preferences?.timeZone || "UTC";
  const weekStart = startOfWeek(startOfToday(timeZone));
  const weekStartKey = dayKey(weekStart);
  const weekEndKey = dayKey(new Date(weekStart.getTime() + 6 * 86400000));

  const [sessions, subjects] = await Promise.all([
    getSessionsDetailed(String(user._id), { from: weekStartKey, to: weekEndKey }),
    getSubjectsStats(String(user._id)),
  ]);

  const prefs = user.preferences || {};

  return (
    <PlannerView
      initialWeekKey={weekStartKey}
      initialSessions={sessions}
      subjects={subjects}
      availability={{
        weeklyAvailability: prefs.weeklyAvailability || {},
        dailyStudyMinutes: prefs.dailyStudyMinutes ?? 120,
      }}
    />
  );
}
