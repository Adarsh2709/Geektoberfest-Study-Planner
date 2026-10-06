import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Subject from "@/models/Subject";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { subjectSchema } from "@/lib/validation";
import { getSubjectsStats } from "@/lib/queries";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();
    const subjects = await getSubjectsStats(String(user._id));
    return NextResponse.json({ subjects });
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
    const parsed = subjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const { name, examDate, priority, color } = parsed.data;

    const existing = await Subject.find({ userId: user._id }).select("name").lean();
    if (existing.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json({ error: "You already have a subject with this name" }, { status: 409 });
    }

    const subject = await Subject.create({
      userId: user._id,
      name,
      examDate: new Date(`${examDate}T00:00:00.000Z`),
      priority,
      color,
    });

    return NextResponse.json({
      subject: {
        id: String(subject._id),
        name: subject.name,
        examDate,
        priority: subject.priority,
        color: subject.color,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
