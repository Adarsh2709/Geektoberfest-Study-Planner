import { NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { historyQuerySchema } from "@/lib/validation";
import { getStudyHistory } from "@/lib/analytics";

export async function GET(request) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();

    const params = new URL(request.url).searchParams;
    const parsed = historyQuerySchema.safeParse(
      Object.fromEntries(
        ["from", "to", "subjectId", "topicId", "status", "page", "limit"].map((k) => [k, params.get(k) || undefined])
      )
    );
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const data = await getStudyHistory(String(user._id), parsed.data);
    if (!data) return NextResponse.json({ error: "Subject or topic not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
