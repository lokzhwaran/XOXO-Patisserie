import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/providers/auth/types";

/**
 * Protects every /admin page and /api/admin endpoint at the proxy layer — never rely on
 * client-side UI checks alone. Session verification itself (querying AdminSession/Supabase) needs
 * the DB and therefore happens in the (dashboard) layout server component and in each route's
 * requireAdmin() call; proxy does the cheap, fast check (cookie presence) so unauthenticated
 * requests never even reach a DB query, and a route that forgets its own guard still can't leak.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";

  if (!isAdminApi && !isAdminPage) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) {
    return isAdminApi
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
