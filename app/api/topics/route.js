import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { topicSchema } from "@/lib/validation";
import { getUserTopics } from "@/lib/queries";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();
    const topics = await getUserTopics(String(user._id));
    return NextResponse.json({ topics });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();
    await dbConnect();

    const body = await request.json().catch(() => ({}));
    const parsed = topicSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const d = parsed.data;

    const subject = await Subject.findOne({ _id: d.subjectId, userId: user._id });
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 400 });

    const topic = await Topic.create({
      userId: user._id,
      subjectId: subject._id,
      name: d.name,
      difficulty: d.difficulty,
      estimatedMinutes: d.estimatedMinutes,
      importance: d.importance,
    });

    return NextResponse.json({
      topic: {
        id: String(topic._id),
        subjectId: String(topic.subjectId),
        name: topic.name,
        difficulty: topic.difficulty,
        estimatedMinutes: topic.estimatedMinutes,
        importance: topic.importance,
        completed: topic.completed,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
