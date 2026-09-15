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

  if (isProtected && !token) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  if (pathname.startsWith("/admin") && token) {
    if ((token as any).role !== "admin") {
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }
  }

  if (
    (pathname.startsWith("/mentor") ||
      pathname === "/assignments" ||
      pathname === "/meeting" ||
      pathname === "/announcement") &&
    token
  ) {
    if ((token as any).role !== "mentor") {
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }
  }

  if (pathname.startsWith("/student") && token) {
    if ((token as any).role !== "student") {
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }
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
