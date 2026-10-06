import { NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  const prefs = user.preferences || {};
  return NextResponse.json({
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      onboarded: Boolean(user.onboarded),
      preferences: {
        dailyStudyMinutes: prefs.dailyStudyMinutes ?? 120,
        preferredStudyTime: prefs.preferredStudyTime ?? "evening",
        weeklyAvailability: prefs.weeklyAvailability || {},
      },
    },
  });
}
