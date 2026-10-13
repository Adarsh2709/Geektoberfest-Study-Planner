import { NextResponse } from "next/server";
import { POST as handleReschedule } from "./reschedule/route.js";

export async function PATCH(request, context) {
  return handleReschedule(request, context);
}
