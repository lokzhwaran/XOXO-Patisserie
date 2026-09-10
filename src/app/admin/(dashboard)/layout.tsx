import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  LayoutDashboard,
  ShoppingBag,
  Cookie,
  LineChart,
  Users,
  Settings,
  Truck,
  FlaskConical,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { getAuthProvider, SESSION_COOKIE_NAME } from "@/lib/providers/auth";
import { isSandboxMode } from "@/lib/app-mode";
import { prisma } from "@/lib/prisma";
import { AdminAlertBell } from "@/components/admin/alert-bell";
import { SignOutButton } from "@/components/admin/sign-out-button";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/menu", label: "Menu & Inventory", icon: Cookie },
  { href: "/admin/financials", label: "Financials", icon: LineChart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/delivery", label: "Delivery", icon: Truck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/users", label: "Users", icon: ShieldCheck },
  { href: "/admin/system", label: "System", icon: Activity },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getAuthProvider().verifySession(token) : null;
  if (!user) redirect("/admin/login");

  const unreadAlerts = await prisma.adminAlert.count({ where: { isRead: false } });
  const sandbox = isSandboxMode();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]">
      {sandbox && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 bg-amber-500 px-3 py-1.5 text-center text-[11px] sm:text-xs font-semibold text-black">
          <div className="flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5 shrink-0" />
            <span>SANDBOX MODE — no real money, messages, or deliveries</span>
          </div>
          <Link href="/sandbox" className="underline hover:text-stone-900">Open Sandbox Console</Link>
        </div>
      )}
      <div className="flex flex-1 min-w-0">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:flex">
          <div className="mb-6 px-2">
            <span className="font-heading text-lg">XOXO Patisserie</span>
            <p className="text-xs text-[var(--color-muted-foreground)]">Admin Console</p>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-[var(--radius-base)] px-3 py-2 text-sm transition-colors hover:bg-[var(--color-muted)]"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 sm:px-6 py-3 sm:py-4 gap-2">
            <span className="font-heading text-base sm:text-lg md:hidden truncate">XOXO Patisserie</span>
            <div className="hidden md:block" />
            <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
              <AdminAlertBell unreadCount={unreadAlerts} />
              <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm">
                <span>{user.name} · {user.role}</span>
              </div>
              <SignOutButton />
            </div>
          </header>
          <nav className="flex gap-1 overflow-x-auto no-scrollbar border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-muted)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-secondary)] active:scale-95"
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <main className="flex-1 p-3.5 sm:p-6 min-w-0 w-full overflow-x-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}
