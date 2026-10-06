import { cache } from "react";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import dbConnect from "./mongodb.js";
import User from "../models/User.js";
import { COOKIE_NAME, verifyToken } from "./jwt.js";

/** Returns the authenticated user (mongoose doc) or null. Request-deduped. */
export const getAuthUser = cache(async () => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.sub) return null;
  try {
    await dbConnect();
    return await User.findById(payload.sub);
  } catch {
    return null;
  }
});

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
