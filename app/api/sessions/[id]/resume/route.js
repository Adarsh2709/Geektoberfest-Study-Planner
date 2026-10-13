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
    if (session.status === "completed" || session.status === "skipped") {
      return NextResponse.json({ error: `Cannot resume a ${session.status} session` }, { status: 400 });
    }
    if (session.status !== "in_progress") {
      return NextResponse.json({ error: "Session has not been started yet" }, { status: 400 });
    }

    // Idempotent if already running
    if (session.timerState === "running" && session.lastStartedAt) {
      return NextResponse.json({
        ok: true,
        status: session.status,
        timerState: "running",
        lastStartedAt: session.lastStartedAt,
        elapsedActiveSeconds: session.elapsedActiveSeconds || 0,
      });
    }

    const now = new Date();
    session.lastStartedAt = now;
    session.timerState = "running";
    session.pausedAt = null;
    await session.save();

    return NextResponse.json({
      ok: true,
      status: session.status,
      timerState: "running",
      lastStartedAt: session.lastStartedAt,
      elapsedActiveSeconds: session.elapsedActiveSeconds || 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
