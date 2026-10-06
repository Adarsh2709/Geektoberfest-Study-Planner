import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { rebuildPlan } from "@/lib/replanner";

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();
    await dbConnect();

    const [subjectCount, topicCount] = await Promise.all([
      Subject.countDocuments({ userId: user._id }),
      Topic.countDocuments({ userId: user._id }),
    ]);
    if (subjectCount === 0) {
      return NextResponse.json({ error: "Add at least one subject before generating a plan" }, { status: 400 });
    }
    if (topicCount === 0) {
      return NextResponse.json({ error: "Add at least one topic before generating a plan" }, { status: 400 });
    }

    const result = await rebuildPlan(String(user._id), { markOnboarded: true });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Plan generation failed:", err);
    return NextResponse.json({ error: "Could not generate your plan" }, { status: 500 });
  }
}
