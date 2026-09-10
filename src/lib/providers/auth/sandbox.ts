import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { AuthProvider, AuthUser } from "./types";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SECRET = process.env.SESSION_SECRET || "xoxobakery-dev-secret-change-me";
const SCRYPT_KEYLEN = 64;

function sign(sessionId: string): string {
  const hmac = crypto.createHmac("sha256", SECRET).update(sessionId).digest("hex");
  return `${sessionId}.${hmac}`;
}

function unsign(token: string): string | null {
  const [sessionId, sig] = token.split(".");
  if (!sessionId || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(sessionId).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return sessionId;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hashHex] = storedHash.split(":");
  if (!salt || !hashHex) return false;
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, key) => (err ? reject(err) : resolve(key)));
  });
  const stored = Buffer.from(hashHex, "hex");
  return derived.length === stored.length && crypto.timingSafeEqual(derived, stored);
}


/**
 * Fully working credentials-based auth backed by the local AdminUser/AdminSession tables.
 * Requires zero external accounts — this is the default provider in sandbox mode and remains
 * available in live mode as a fallback alongside Supabase Auth.
 */
export const sandboxAuthProvider: AuthProvider = {
  mode: "sandbox",

  async signIn(email, password) {
    const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.passwordHash) return null;
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return null;

    const session = await prisma.adminSession.create({
      data: { userId: user.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role as AuthUser["role"] },
      sessionToken: sign(session.id),
    };
  },

  async verifySession(sessionToken) {
    const sessionId = unsign(sessionToken);
    if (!sessionId) return null;
    const session = await prisma.adminSession.findUnique({ where: { id: sessionId }, include: { user: true } });
    if (!session || session.expiresAt < new Date()) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as AuthUser["role"],
    };
  },

  async signOut(sessionToken) {
    const sessionId = unsign(sessionToken);
    if (!sessionId) return;
    await prisma.adminSession.delete({ where: { id: sessionId } }).catch(() => undefined);
  },
};

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, key) => (err ? reject(err) : resolve(key)));
  });
  return `${salt}:${derived.toString("hex")}`;
}
