import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthProvider, SESSION_COOKIE_NAME } from "@/lib/providers/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await getAuthProvider().signOut(token);
  }
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
