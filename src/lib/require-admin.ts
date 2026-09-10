import { cookies } from "next/headers";
import { getAuthProvider, SESSION_COOKIE_NAME, type AuthUser } from "@/lib/providers/auth";

/** Verifies the admin session cookie; returns null if unauthenticated. Use in every admin API route. */
export async function requireAdmin(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return getAuthProvider().verifySession(token);
}
