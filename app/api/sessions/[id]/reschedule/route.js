import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import Subject from "@/models/Subject";
import User from "@/models/User";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { rescheduleSessionSchema } from "@/lib/validation";
import { parseDayKey, weekdayOfKey, validateReschedule } from "@/lib/utils";

const ID_RE = /^[0-9a-fA-F]{24}$/;

export async function POST(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();
    await dbConnect();

    const { id } = await params;
    if (!ID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = rescheduleSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const targetDateStr = parsed.data.date;
    const targetDate = parseDayKey(targetDateStr);

    // Verify session ownership strictly
    const session = await StudySession.findOne({ _id: id, userId: user._id });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify subject ownership
    const subject = await Subject.findOne({ _id: session.subjectId, userId: user._id });
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Calculate user capacity on target date
    const fullUser = await User.findById(user._id).lean();
    const weekly = fullUser?.preferences?.weeklyAvailability || {};
    const weekday = weekdayOfKey(targetDateStr);
    const dayCapacity =
      typeof weekly[String(weekday)] === "number" && weekly[String(weekday)] >= 0
        ? weekly[String(weekday)]
        : fullUser?.preferences?.dailyStudyMinutes ?? 120;

    // Check existing scheduled study load on target date
    const existingSessions = await StudySession.find({
      userId: user._id,
      _id: { $ne: session._id },
      date: targetDate,
      status: { $in: ["planned", "in_progress", "completed"] },
    }).lean();

    const existingDayMinutes = existingSessions.reduce(
      (acc, s) => acc + (s.plannedMinutes || 0),
      0
    );

    // Run core validation
    const check = validateReschedule({
      session,
      examDate: subject.examDate,
      targetDateStr,
      dayCapacity,
      existingDayMinutes,
    });

    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    session.date = targetDate;
    await session.save();

    return NextResponse.json({
      ok: true,
      sessionId: String(session._id),
      newDate: targetDateStr,
      warning: check.warning || null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
