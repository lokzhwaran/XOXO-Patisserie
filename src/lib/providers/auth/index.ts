import { getAppMode } from "@/lib/app-mode";
import { sandboxAuthProvider } from "./sandbox";
import { liveAuthProvider } from "./live";
import type { AuthProvider } from "./types";

/**
 * Live mode still uses the sandbox (credentials) provider unless Supabase is actually configured —
 * a missing credential must never silently break login. See src/lib/env.ts for the startup check
 * that instead makes live-mode misconfiguration a hard, explicit error at boot.
 */
export function getAuthProvider(): AuthProvider {
  const mode = getAppMode();
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  if (mode === "live" && supabaseConfigured) return liveAuthProvider;
  return sandboxAuthProvider;
}

export * from "./types";
