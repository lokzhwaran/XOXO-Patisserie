import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppMode } from "@/lib/app-mode";

export async function GET() {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return NextResponse.json({
    status: dbOk ? "ok" : "degraded",
    mode: getAppMode(),
    database: dbOk ? "ok" : "unreachable",
    timestamp: new Date().toISOString(),
  });
}
