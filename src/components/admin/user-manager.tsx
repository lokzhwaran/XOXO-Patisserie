"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { toast } from "sonner";

const ROLES = ["OWNER", "MANAGER", "STAFF"];
interface AdminUserRow { id: string; name: string; email: string; role: string; }

export function UserManager({ users, currentUserId }: { users: AdminUserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", role: "STAFF", password: "" });
  const [saving, setSaving] = useState<string | null>(null);

  async function invite() {
    setSaving("invite");
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    setSaving(null);
    if (!response.ok) { toast.error(data.error ?? "Could not invite user"); return; }
    toast.success(`${form.name} added`);
    setForm({ name: "", email: "", role: "STAFF", password: "" });
    router.refresh();
  }

  async function updateRole(id: string, role: string) {
    setSaving(id);
    const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, role }) });
    const data = await response.json();
    setSaving(null);
    if (!response.ok) { toast.error(data.error ?? "Could not update role"); return; }
    toast.success("Role updated"); router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this staff account?")) return;
    const response = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await response.json();
    if (!response.ok) { toast.error(data.error ?? "Could not remove user"); return; }
    toast.success("User removed"); router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 sm:p-4 shadow-sm sm:grid-cols-2 md:grid-cols-5 md:items-end">
        <div><Label htmlFor="user-name" className="text-xs sm:text-sm">Name</Label><Input id="user-name" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 sm:h-10 text-xs sm:text-sm" /></div>
        <div><Label htmlFor="user-email" className="text-xs sm:text-sm">Email</Label><Input id="user-email" type="email" placeholder="staff@bakery.local" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 sm:h-10 text-xs sm:text-sm" /></div>
        <div><Label htmlFor="user-role" className="text-xs sm:text-sm">Role</Label><select id="user-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="h-9 sm:h-10 w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 sm:px-3 text-xs sm:text-sm text-[var(--color-foreground)]">{ROLES.map((role) => <option key={role}>{role}</option>)}</select></div>
        <div><Label htmlFor="user-password" className="text-xs sm:text-sm">Temporary password</Label><Input id="user-password" type="text" placeholder="Min 8 chars" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-9 sm:h-10 text-xs sm:text-sm" /></div>
        <Button disabled={saving === "invite"} onClick={invite} className="h-9 sm:h-10 text-xs sm:text-sm sm:col-span-2 md:col-span-1">{saving === "invite" ? "Adding..." : "Add staff"}</Button>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <table className="w-full min-w-[480px] text-xs sm:text-sm">
          <thead className="border-b border-[var(--color-border)] text-left text-[11px] sm:text-xs uppercase text-[var(--color-muted-foreground)]"><tr><th className="p-2.5 sm:p-3">Name</th><th className="p-2.5 sm:p-3">Email</th><th className="p-2.5 sm:p-3">Role</th><th className="p-2.5 sm:p-3">Action</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-muted)] transition-colors">
                <td className="p-2.5 sm:p-3 font-medium">{user.name}{user.id === currentUserId ? " (you)" : ""}</td>
                <td className="p-2.5 sm:p-3">{user.email}</td>
                <td className="p-2.5 sm:p-3"><select value={user.role} disabled={saving === user.id} onChange={(e) => updateRole(user.id, e.target.value)} className="h-8 sm:h-9 rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs sm:text-sm text-[var(--color-foreground)]">{ROLES.map((role) => <option key={role}>{role}</option>)}</select></td>
                <td className="p-2.5 sm:p-3">{user.id !== currentUserId && <button type="button" onClick={() => remove(user.id)} className="text-[var(--color-danger)] underline text-xs">Remove</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
