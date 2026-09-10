export type AdminRole = "OWNER" | "MANAGER" | "STAFF";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface AuthProvider {
  readonly mode: "sandbox" | "live";
  /** Verifies credentials and returns a signed session token to set as a cookie, or null on failure. */
  signIn(email: string, password: string): Promise<{ user: AuthUser; sessionToken: string } | null>;
  /** Verifies a session token (from the request cookie) and returns the user, or null if invalid/expired. */
  verifySession(sessionToken: string): Promise<AuthUser | null>;
  signOut(sessionToken: string): Promise<void>;
}

export const SESSION_COOKIE_NAME = "xoxobakery_session";
