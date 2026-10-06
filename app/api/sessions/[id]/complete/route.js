import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import Topic from "@/models/Topic";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { completeSessionSchema } from "@/lib/validation";

const ID_RE = /^[0-9a-fA-F]{24}$/;

export async function POST(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();
    await dbConnect();
    const { id } = await params;
    if (!ID_RE.test(id)) return NextResponse.json({ error: "Invalid session" }, { status: 400 });

    const session = await StudySession.findOne({ _id: id, userId: user._id });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.status === "completed") {
      return NextResponse.json({ error: "Session is already completed" }, { status: 400 });
    }
    if (session.status === "skipped") {
      return NextResponse.json({ error: "Session was skipped" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = completeSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    let actualMinutes = parsed.data.actualMinutes;
    if (actualMinutes == null) {
      actualMinutes = session.startedAt
        ? Math.max(1, Math.round((Date.now() - session.startedAt.getTime()) / 60000))
        : session.plannedMinutes;
    }
    actualMinutes = Math.min(1440, Math.max(0, actualMinutes));

    session.status = "completed";
    session.completedAt = new Date();
    session.actualMinutes = actualMinutes;
    await session.save();

    // Mark the topic completed when all of its estimated work is done.
    if (session.topicId) {
      const topic = await Topic.findOne({ _id: session.topicId, userId: user._id });
      if (topic && !topic.completed) {
        const done = await StudySession.find({
          userId: user._id,
          topicId: topic._id,
          status: "completed",
        }).select("plannedMinutes").lean();
        const totalDone = done.reduce((n, s) => n + (s.plannedMinutes || 0), 0);
        if (totalDone >= (topic.estimatedMinutes || 0)) {
          topic.completed = true;
          await topic.save();
        }
      }
    }

    return NextResponse.json({ ok: true, actualMinutes: session.actualMinutes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
