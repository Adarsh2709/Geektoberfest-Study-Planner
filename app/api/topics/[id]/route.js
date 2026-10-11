import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import Topic from "@/models/Topic";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { topicUpdateSchema } from "@/lib/validation";
import { startOfToday } from "@/lib/utils";

const ID_RE = /^[0-9a-fA-F]{24}$/;

export async function PATCH(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();
    await dbConnect();
    const { id } = await params;
    if (!ID_RE.test(id)) return NextResponse.json({ error: "Invalid topic" }, { status: 400 });

    const topic = await Topic.findOne({ _id: id, userId: user._id });
    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const parsed = topicUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const d = parsed.data;
    if (d.name !== undefined) topic.name = d.name;
    if (d.difficulty !== undefined) topic.difficulty = d.difficulty;
    if (d.estimatedMinutes !== undefined) topic.estimatedMinutes = d.estimatedMinutes;
    if (d.importance !== undefined) topic.importance = d.importance;
    if (d.completed !== undefined) topic.completed = d.completed;
    await topic.save();

    // Marking a topic complete removes its future planned sessions.
    if (d.completed === true) {
      const today = startOfToday(user?.preferences?.timeZone || "UTC");
      await StudySession.deleteMany({ userId: user._id, topicId: topic._id, status: "planned", date: { $gte: today } });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();
    await dbConnect();
    const { id } = await params;
    if (!ID_RE.test(id)) return NextResponse.json({ error: "Invalid topic" }, { status: 400 });

    const topic = await Topic.findOneAndDelete({ _id: id, userId: user._id });
    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    await StudySession.deleteMany({ userId: user._id, topicId: topic._id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
