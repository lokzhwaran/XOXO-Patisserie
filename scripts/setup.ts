import { execSync } from "child_process";
import { existsSync, copyFileSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { ensureDatabaseRunning } from "./db-up";

const ENV_PATH = path.join(process.cwd(), ".env");
const ENV_EXAMPLE_PATH = path.join(process.cwd(), ".env.example");

async function main() {
  console.log("XOXO Patisserie — one-command setup\n");

  if (!existsSync(ENV_PATH)) {
    copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
    console.log("[setup] Created .env from .env.example");
  }
  process.loadEnvFile(ENV_PATH);

  const { databaseUrl, via } = await ensureDatabaseRunning();
  process.env.DATABASE_URL = databaseUrl;
  console.log(`[setup] Database ready via ${via}: ${databaseUrl}`);
  persistDatabaseUrl(databaseUrl);

  console.log("[setup] Pushing Prisma schema...");
  execSync("npx prisma db push --skip-generate", { stdio: "inherit", env: process.env });

  console.log("[setup] Generating Prisma client...");
  execSync("npx prisma generate", { stdio: "inherit", env: { ...process.env, PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: "1" } });

  const seedFlag = process.argv.includes("--minimal") ? "--minimal" : "--demo";
  console.log(`[setup] Seeding database (${seedFlag})...`);
  execSync(`npx tsx prisma/seed.ts ${seedFlag}`, { stdio: "inherit", env: process.env });

  console.log("\n✅ Setup complete. Run `pnpm dev` and visit http://localhost:3000\n");
  printCredentialsTable();
}

function persistDatabaseUrl(databaseUrl: string) {
  const content = readFileSync(ENV_PATH, "utf8");
  const updated = content.match(/^DATABASE_URL=/m)
    ? content.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${databaseUrl}"`)
    : `${content}\nDATABASE_URL="${databaseUrl}"\n`;
  writeFileSync(ENV_PATH, updated);
}

function printCredentialsTable() {
  console.log("Seeded admin accounts (sandbox credentials auth — no external account needed):\n");
  console.log("| Role    | Email                  | Password       |");
  console.log("|---------|------------------------|----------------|");
  console.log("| OWNER   | admin@bakery.local     | Admin@12345    |");
  console.log("| MANAGER | manager@bakery.local   | Manager@12345  |");
  console.log("| STAFF   | staff@bakery.local     | Staff@12345    |");
  console.log("\nLog in at http://localhost:3000/admin/login\n");
}

main().catch((err) => {
  console.error("[setup] Failed:", err);
  process.exit(1);
});
