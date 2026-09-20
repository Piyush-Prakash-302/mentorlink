import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/mentor") ||
    pathname.startsWith("/student") ||
    pathname === "/assignments" ||
    pathname === "/meeting" ||
    pathname === "/announcement";

  // Login required
  if (isProtected && !token) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  const role = (token as any)?.role;

  // Admin pages
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  // Mentor pages
  if (pathname.startsWith("/mentor") && role !== "mentor") {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  // Student pages
  if (pathname.startsWith("/student") && role !== "student") {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  // Assignments, Meetings and Announcements
  // Both mentor and student can access these pages
  if (
    (pathname === "/assignments" ||
      pathname === "/meeting" ||
      pathname === "/announcement") &&
    role !== "mentor" &&
    role !== "student"
  ) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/mentor/:path*",
    "/student/:path*",
    "/assignments",
    "/meeting",
    "/announcement",
  ],
};