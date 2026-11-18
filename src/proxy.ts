import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/session-token";

const OPEN_ADMIN_PATHS = new Set([
  "/admin/login",
  "/admin/setup",
  "/admin/login/submit",
  "/admin/setup/submit",
]);

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (OPEN_ADMIN_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
