import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { loginSchema } from "@/lib/validation";
import { verifyPassword } from "@/lib/auth";
import { sessionCookieOptions, signToken } from "@/lib/jwt";

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signToken(String(user._id));
    const res = NextResponse.json({ ok: true, onboarded: Boolean(user.onboarded) });
    res.cookies.set({ ...sessionCookieOptions(), value: token });
    return res;
  } catch (err) {
    console.error("Login failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
