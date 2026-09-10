import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { UserManager } from "@/components/admin/user-manager";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl">Users</h1>
      {admin.role !== "OWNER" ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">Only owners can manage staff accounts. Contact the bakery owner if you need access changes.</p>
      ) : (
        <UserManager users={users.map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role }))} currentUserId={admin.id} />
      )}
    </div>
  );
}
