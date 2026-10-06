import { NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { getSessionsDetailed } from "@/lib/queries";
import { todayKey } from "@/lib/utils";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();
    const key = todayKey();
    const sessions = await getSessionsDetailed(String(user._id), { from: key, to: key });
    return NextResponse.json({ date: key, sessions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
