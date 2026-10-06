import { NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { sessionsQuerySchema } from "@/lib/validation";
import { getSessionsDetailed } from "@/lib/queries";

export async function GET(request) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();

    const url = new URL(request.url);
    const parsed = sessionsQuerySchema.safeParse({
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
      subjectId: url.searchParams.get("subjectId") || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const sessions = await getSessionsDetailed(String(user._id), parsed.data);
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
