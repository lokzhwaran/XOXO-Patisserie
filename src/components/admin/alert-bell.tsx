"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

export function AdminAlertBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link href="/admin/system" className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-muted)]" aria-label="Alerts">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-[9px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
