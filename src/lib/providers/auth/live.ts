import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthProvider, AuthUser } from "./types";

/** Adapts Supabase Auth to the same AuthProvider interface used by the sandbox provider. */
export const liveAuthProvider: AuthProvider = {
  mode: "live",

  async signIn(email, password) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) return null;
    // Role/name are looked up from AdminUser by email; Supabase only manages the credential itself.
    const { prisma } = await import("@/lib/prisma");
    const adminUser = await prisma.adminUser.findUnique({ where: { email } });
    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email ?? email,
      name: adminUser?.name ?? email,
      role: (adminUser?.role as AuthUser["role"]) ?? "STAFF",
    };
    return { user, sessionToken: data.session.access_token };
  },

  async verifySession(sessionToken) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser(sessionToken);
    if (error || !data.user) return null;
    const { prisma } = await import("@/lib/prisma");
    const adminUser = await prisma.adminUser.findUnique({ where: { email: data.user.email ?? "" } });
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      name: adminUser?.name ?? data.user.email ?? "",
      role: (adminUser?.role as AuthUser["role"]) ?? "STAFF",
    };
  },

  async signOut() {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  },
};
