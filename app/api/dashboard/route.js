import { NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { buildRecommendationContext, getDashboardData } from "@/lib/dashboard";
import { getRecommendationSafe } from "@/lib/ai";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();
    const data = await getDashboardData(String(user._id));
    const recommendation = await getRecommendationSafe(buildRecommendationContext(data));
    return NextResponse.json({ ...data, recommendation });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
