import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Subject from "@/models/Subject";
import StudySession from "@/models/StudySession";
import Topic from "@/models/Topic";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { subjectUpdateSchema } from "@/lib/validation";
import { getSubjectDetail } from "@/lib/queries";

const ID_RE = /^[0-9a-fA-F]{24}$/;

export async function GET(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();
    const { id } = await params;
    if (!ID_RE.test(id)) return NextResponse.json({ error: "Invalid subject" }, { status: 400 });

    const detail = await getSubjectDetail(String(user._id), id);
    if (!detail) return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    return NextResponse.json(detail);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();
    await dbConnect();
    const { id } = await params;
    if (!ID_RE.test(id)) return NextResponse.json({ error: "Invalid subject" }, { status: 400 });

    const subject = await Subject.findOne({ _id: id, userId: user._id });
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const parsed = subjectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const d = parsed.data;
    if (d.name !== undefined) subject.name = d.name;
    if (d.priority !== undefined) subject.priority = d.priority;
    if (d.color !== undefined) subject.color = d.color;
    if (d.examDate !== undefined) subject.examDate = new Date(`${d.examDate}T00:00:00.000Z`);
    await subject.save();

    return NextResponse.json({
      subject: {
        id: String(subject._id),
        name: subject.name,
        examDate: d.examDate ?? subject.examDate.toISOString().slice(0, 10),
        priority: subject.priority,
        color: subject.color,
      },
    });
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
    if (!ID_RE.test(id)) return NextResponse.json({ error: "Invalid subject" }, { status: 400 });

    const subject = await Subject.findOneAndDelete({ _id: id, userId: user._id });
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    await Topic.deleteMany({ userId: user._id, subjectId: subject._id });
    await StudySession.deleteMany({ userId: user._id, subjectId: subject._id });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
