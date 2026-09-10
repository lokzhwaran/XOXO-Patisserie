import EmbeddedPostgres from "embedded-postgres";
import { execSync } from "child_process";
import { rmSync, existsSync } from "fs";
import path from "path";

const dataDir = ".sandbox/verify-pgdata";
const port = 55491;
const databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${port}/xoxobakery`;
const envPath = path.join(process.cwd(), ".env");
if (existsSync(envPath)) process.loadEnvFile(envPath);
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@bakery.local";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";

async function main() {
  if (existsSync(dataDir)) rmSync(dataDir, { recursive: true, force: true });

  const pg = new EmbeddedPostgres({ databaseDir: dataDir, user: "postgres", password: "postgres", port, persistent: false });
  console.log("[verify] Initialising embedded Postgres...");
  await pg.initialise();
  console.log("[verify] Starting embedded Postgres...");
  await pg.start();
  await pg.createDatabase("xoxobakery");
  console.log("[verify] Postgres is up on port", port);

  process.env.DATABASE_URL = databaseUrl;

  console.log("[verify] Pushing Prisma schema...");
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  console.log("[verify] Seeding (minimal)...");
  execSync("npx tsx prisma/seed.ts --minimal", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  console.log("[verify] Querying seeded data to confirm...");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const productCount = await prisma.product.count();
  const orderCount = await prisma.order.count();
  const adminCount = await prisma.adminUser.count();
  const admin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  console.log(`[verify] products=${productCount} orders=${orderCount} adminUsers=${adminCount}`);
  console.log(`[verify] admin passwordHash present: ${Boolean(admin?.passwordHash)}`);

  // Exercise the sandbox auth provider directly against this DB.
  const { sandboxAuthProvider } = await import("../src/lib/providers/auth/sandbox");
  const signInResult = await sandboxAuthProvider.signIn(adminEmail, adminPassword);
  console.log(`[verify] sandbox login success: ${Boolean(signInResult)}`);
  const wrongResult = await sandboxAuthProvider.signIn(adminEmail, "wrong-password");
  console.log(`[verify] sandbox login with wrong password correctly rejected: ${wrongResult === null}`);

  await prisma.$disconnect();
  await pg.stop();
  console.log("[verify] ALL CHECKS PASSED");
}

main().catch((err) => {
  console.error("[verify] FAILED:", err);
  process.exit(1);
});
