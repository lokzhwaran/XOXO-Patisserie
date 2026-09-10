import { prisma } from "@/lib/prisma";
import { getAppMode } from "@/lib/app-mode";
import { Badge } from "@/components/ui/badge";
import { AlertsList } from "@/components/admin/alerts-list";

async function lastEvent(domain: string) {
  return prisma.sandboxEvent.findFirst({ where: { domain }, orderBy: { createdAt: "desc" } });
}

export default async function AdminSystemPage() {
  const mode = getAppMode();
  const [lastPayment, lastDelivery, lastNotification, alerts] = await Promise.all([
    lastEvent("PAYMENT"),
    lastEvent("DELIVERY"),
    prisma.notificationOutbox.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.adminAlert.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const integrations = [
    {
      name: "Payments (Razorpay)",
      configured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      lastCall: lastPayment?.createdAt,
    },
    {
      name: "WhatsApp Cloud API",
      configured: Boolean(process.env.WHATSAPP_CLOUD_API_TOKEN),
      lastCall: lastNotification?.channel === "WHATSAPP" ? lastNotification.createdAt : undefined,
    },
    {
      name: "Email (Resend)",
      configured: Boolean(process.env.RESEND_API_KEY),
      lastCall: lastNotification?.channel === "EMAIL" ? lastNotification.createdAt : undefined,
    },
    {
      name: "Delivery (Porter)",
      configured: Boolean(process.env.PORTER_API_KEY),
      lastCall: lastDelivery?.createdAt,
    },
    {
      name: "Auth (Supabase)",
      configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      lastCall: undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl">System & Integrations</h1>
        <p className="mt-1 text-xs sm:text-sm text-[var(--color-muted-foreground)] flex items-center gap-2">
          <span>Current mode:</span>
          <Badge tone={mode === "sandbox" ? "warning" : "success"} className="text-xs">{mode.toUpperCase()}</Badge>
        </p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <table className="w-full min-w-[480px] text-xs sm:text-sm">
          <thead className="border-b border-[var(--color-border)] text-left text-[11px] sm:text-xs uppercase text-[var(--color-muted-foreground)]">
            <tr><th className="p-2.5 sm:p-3">Integration</th><th className="p-2.5 sm:p-3">Configured</th><th className="p-2.5 sm:p-3">Last call</th></tr>
          </thead>
          <tbody>
            {integrations.map((i) => (
              <tr key={i.name} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-muted)] transition-colors">
                <td className="p-2.5 sm:p-3 font-medium">{i.name}</td>
                <td className="p-2.5 sm:p-3">
                  <Badge tone={i.configured ? "success" : "neutral"} className="text-[10px] sm:text-xs">{i.configured ? "Yes" : "Not configured (sandbox active)"}</Badge>
                </td>
                <td className="p-2.5 sm:p-3 text-[11px] sm:text-xs text-[var(--color-muted-foreground)]">
                  {i.lastCall ? new Date(i.lastCall).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertsList
        initialAlerts={alerts.map((a) => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          title: a.title,
          body: a.body,
          isRead: a.isRead,
          relatedOrderId: a.relatedOrderId,
          relatedProductId: a.relatedProductId,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
