import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { registerSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/auth";
import { sessionCookieOptions, signToken } from "@/lib/jwt";

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const { name, email, password } = parsed.data;

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const user = await User.create({
      name,
      email,
      password: await hashPassword(password),
    });

    const token = await signToken(String(user._id));
    const res = NextResponse.json({ ok: true, onboarded: false });
    res.cookies.set({ ...sessionCookieOptions(), value: token });
    return res;
  } catch (err) {
    console.error("Register failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
