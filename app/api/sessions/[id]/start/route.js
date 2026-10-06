import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import { getAuthUser, unauthorized } from "@/lib/auth";

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
    if (session.status === "in_progress") {
      return NextResponse.json({ ok: true, status: "in_progress", startedAt: session.startedAt });
    }

    session.status = "in_progress";
    session.startedAt = new Date();
    await session.save();

    return NextResponse.json({ ok: true, status: "in_progress", startedAt: session.startedAt });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
