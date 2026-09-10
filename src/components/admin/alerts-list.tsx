"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import { Check, Trash2, Bell } from "lucide-react";

interface AlertItem {
  id: string;
  type: string;
  severity: string;
  title: string;
  body: string;
  isRead: boolean;
  relatedOrderId: string | null;
  relatedProductId: string | null;
  createdAt: string;
}

export function AlertsList({ initialAlerts }: { initialAlerts: AlertItem[] }) {
  const router = useRouter();
  const [alerts, setAlerts] = useState(initialAlerts);
  const [loading, setLoading] = useState(false);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  async function markAllRead() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "readAll" }),
      });
      if (res.ok) {
        setAlerts((curr) => curr.map((a) => ({ ...a, isRead: true })));
        toast.success("All alerts marked as read");
        router.refresh();
      }
    } catch {
      toast.error("Failed to update alerts");
    } finally {
      setLoading(false);
    }
  }

  async function clearAll() {
    if (!window.confirm("Clear all alert notifications?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clearAll" }),
      });
      if (res.ok) {
        setAlerts([]);
        toast.success("Alerts cleared");
        router.refresh();
      }
    } catch {
      toast.error("Failed to clear alerts");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-[var(--color-primary)]" />
          <h2 className="font-heading text-lg sm:text-xl">Operational Alerts & Notifications</h2>
          {unreadCount > 0 && (
            <Badge tone="danger" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        {alerts.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button size="sm" variant="outline" disabled={loading} onClick={markAllRead} className="h-8 text-xs gap-1">
                <Check className="h-3.5 w-3.5" /> Mark all read
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={loading} onClick={clearAll} className="h-8 text-xs gap-1 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10">
              <Trash2 className="h-3.5 w-3.5" /> Clear all
            </Button>
          </div>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-xs sm:text-sm text-[var(--color-muted-foreground)]">
          No active alerts or system notifications.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-[var(--radius-lg)] border p-3.5 sm:p-4 transition-colors ${
                alert.isRead
                  ? "border-[var(--color-border)] bg-[var(--color-surface)]"
                  : "border-[var(--color-primary)]/40 bg-[var(--color-surface)] shadow-xs"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      alert.severity === "CRITICAL"
                        ? "danger"
                        : alert.severity === "WARNING"
                        ? "warning"
                        : "neutral"
                    }
                    className="text-[10px] sm:text-xs"
                  >
                    {alert.severity}
                  </Badge>
                  <span className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
                    {alert.type}
                  </span>
                  {!alert.isRead && (
                    <span className="h-2 w-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                  )}
                </div>
                <span className="text-[10px] sm:text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">
                  {format(new Date(alert.createdAt), "d MMM, h:mm a")}
                </span>
              </div>

              <h3 className="mt-2 text-xs sm:text-sm font-semibold text-[var(--color-foreground)] leading-snug">
                {alert.title}
              </h3>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)] leading-relaxed line-clamp-3">
                {alert.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
