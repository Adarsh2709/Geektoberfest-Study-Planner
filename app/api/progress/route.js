import { NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { getProgressData } from "@/lib/dashboard";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();
    const data = await getProgressData(String(user._id));
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
