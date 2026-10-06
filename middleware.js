import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/jwt";

const PROTECTED = ["/dashboard", "/planner", "/today", "/subjects", "/progress", "/settings", "/onboarding"];
const AUTH_PAGES = ["/login", "/register"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isProtected && !payload) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  if (isAuthPage && payload) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/planner/:path*",
    "/today/:path*",
    "/subjects/:path*",
    "/progress/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/login",
    "/register",
  ],
};
