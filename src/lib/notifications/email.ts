import { Resend } from "resend";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { getAppMode } from "@/lib/app-mode";
import { prisma } from "@/lib/prisma";

const apiKey = process.env.RESEND_API_KEY ?? "";
export const resendEnabled = Boolean(apiKey);
const resend = resendEnabled ? new Resend(apiKey) : null;

const FROM = process.env.RESEND_FROM_EMAIL ?? "XOXO Patisserie <orders@xoxopatisserie.in>";
const SANDBOX_MAIL_DIR = path.join(process.cwd(), ".sandbox", "mail");

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}): Promise<{ success: boolean; error?: string }> {
  const useLive = getAppMode() === "live" && resendEnabled;

  if (!useLive) {
    // Sandbox mode: write a reviewable .eml/.html to .sandbox/mail/ and record in the outbox.
    mkdirSync(SANDBOX_MAIL_DIR, { recursive: true });
    const filename = `${Date.now()}-${params.to.replace(/[^a-z0-9]/gi, "_")}`;
    writeFileSync(path.join(SANDBOX_MAIL_DIR, `${filename}.html`), params.html);
    writeFileSync(
      path.join(SANDBOX_MAIL_DIR, `${filename}.eml`),
      `To: ${params.to}\r\nFrom: ${FROM}\r\nSubject: ${params.subject}\r\nContent-Type: text/html\r\n\r\n${params.html}`
    );
    await prisma.notificationOutbox.create({
      data: { channel: "EMAIL", templateKey: "custom", to: params.to, subject: params.subject, body: params.html, variables: {} },
    });
    return { success: true };
  }

  if (!resend) return { success: false, error: "Resend not configured" };
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      attachments: params.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
