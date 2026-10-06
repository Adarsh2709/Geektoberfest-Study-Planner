import { NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { rebuildPlan } from "@/lib/replanner";

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();
    const result = await rebuildPlan(String(user._id));
    return NextResponse.json(result);
  } catch (err) {
    console.error("Recalculation failed:", err);
    return NextResponse.json({ error: "Could not recalculate your plan" }, { status: 500 });
  }
}
