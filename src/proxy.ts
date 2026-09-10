import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/providers/auth/types";

/**
 * Protects every /admin route at the proxy layer — never rely on client-side UI checks
 * alone. Session verification itself (querying AdminSession/Supabase) needs the DB and therefore
 * happens in the (dashboard) layout server component; proxy does the cheap, fast check
 * (cookie presence) so unauthenticated requests never even reach a DB query.
 */
export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};