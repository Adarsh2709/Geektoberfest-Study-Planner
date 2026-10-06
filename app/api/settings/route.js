import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getAuthUser, hashPassword, unauthorized, verifyPassword } from "@/lib/auth";
import { settingsUpdateSchema } from "@/lib/validation";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  const prefs = user.preferences || {};
  return NextResponse.json({
    user: {
      name: user.name,
      email: user.email,
      preferences: {
        dailyStudyMinutes: prefs.dailyStudyMinutes ?? 120,
        preferredStudyTime: prefs.preferredStudyTime ?? "evening",
        weeklyAvailability: prefs.weeklyAvailability || {},
      },
    },
  });
}

export async function PUT(request) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();
    await dbConnect();

    const body = await request.json().catch(() => ({}));
    const parsed = settingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const d = parsed.data;

    if (d.newPassword) {
      const ok = await verifyPassword(d.currentPassword || "", user.password);
      if (!ok) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      user.password = await hashPassword(d.newPassword);
    }

    if (d.name !== undefined) user.name = d.name;
    if (d.preferredStudyTime !== undefined) user.set("preferences.preferredStudyTime", d.preferredStudyTime);
    if (d.dailyStudyMinutes !== undefined) user.set("preferences.dailyStudyMinutes", d.dailyStudyMinutes);
    if (d.weeklyAvailability !== undefined) {
      const weekly = {};
      for (let day = 0; day <= 6; day++) {
        const v = d.weeklyAvailability[String(day)];
        if (v !== undefined) weekly[String(day)] = v;
      }
      user.set("preferences.weeklyAvailability", weekly);
    }

    await user.save();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Settings update failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
