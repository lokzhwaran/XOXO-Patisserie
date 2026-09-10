import type { Metadata } from "next";
import { Toaster } from "sonner";
import "../globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "XOXO Patisserie — Admin Console",
  description: "Manage orders, menu, capacity, and settings.",
  robots: { index: false, follow: false },
};

// A deliberately separate root layout: the admin console must never render the customer
// header/footer/WhatsApp button that (site) uses — it is its own application shell.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--color-muted)] text-[var(--color-foreground)]">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
