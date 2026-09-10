import { z } from "zod";
import { getAppMode } from "./app-mode";

/**
 * Startup env validation. In live mode a missing credential is a hard startup error (never a
 * silent runtime surprise); in sandbox mode nothing is required. Call assertEnv() once from
 * instrumentation (see instrumentation.ts) — not on every request.
 */
const liveEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required in live mode"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required in live mode"),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, "RAZORPAY_WEBHOOK_SECRET is required in live mode"),
});

export function assertEnv(): void {
  // Admin session cookies are HMAC-signed with SESSION_SECRET regardless of APP_MODE (the sandbox
  // credentials auth provider is also the live-mode fallback until Supabase is configured) — a
  // production deploy running with the hardcoded dev default would let anyone forge that signature.
  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    throw new Error(
      "SESSION_SECRET is required in production — set it to a long random string " +
        "(e.g. `openssl rand -hex 32`). Refusing to start with the public dev default."
    );
  }

  if (getAppMode() !== "live") return;

  const result = liveEnvSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(
      `APP_MODE=live but required environment variables are missing:\n${missing}\n\n` +
        `Set APP_MODE=sandbox to run with zero external accounts, or provide the values above.`
    );
  }
}
