import { spawn } from "child_process";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import net from "net";
import { dockerAvailable } from "./detect";

if (existsSync(path.join(process.cwd(), ".env"))) {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
}

const PID_FILE = path.join(process.cwd(), ".sandbox", "pg.pid");
const PORT_FILE = path.join(process.cwd(), ".sandbox", "pg.port");
const DEFAULT_PORT = 55432;

function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection(port, "127.0.0.1");
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

export function embeddedUrl(port = DEFAULT_PORT): string {
  return `postgresql://postgres:postgres@127.0.0.1:${port}/xoxobakery`;
}

/** Starts Postgres for local development: docker-compose if Docker is available and running,
 *  otherwise a detached embedded Postgres process (no Docker required). Idempotent — safe to
 *  call repeatedly; does nothing if a database is already reachable on the expected port. */
export async function ensureDatabaseRunning(): Promise<{ databaseUrl: string; via: "existing" | "docker" | "embedded" }> {
  if (process.env.DATABASE_URL) {
    const port = Number(new URL(process.env.DATABASE_URL.replace("postgresql://", "http://")).port || 5432);
    if (await isPortOpen(port)) {
      return { databaseUrl: process.env.DATABASE_URL, via: "existing" };
    }
    console.log(`[db] DATABASE_URL is set but nothing is listening on port ${port} yet — starting a database.`);
  }

  if (await isPortOpen(5432)) {
    return { databaseUrl: "postgresql://xoxobakery:xoxobakery@localhost:5432/xoxobakery", via: "existing" };
  }

  if (dockerAvailable()) {
    console.log("[db] Docker detected — starting docker-compose Postgres...");
    await new Promise<void>((resolve, reject) => {
      const child = spawn("docker", ["compose", "up", "-d"], { stdio: "inherit" });
      child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("docker compose up failed"))));
    });
    for (let i = 0; i < 30; i++) {
      if (await isPortOpen(5432)) {
        return { databaseUrl: "postgresql://xoxobakery:xoxobakery@localhost:5432/xoxobakery", via: "docker" };
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error("Postgres did not become reachable after docker compose up");
  }

  console.log("[db] Docker not available — starting embedded Postgres (no Docker required)...");
  return startEmbedded();
}

async function startEmbedded(): Promise<{ databaseUrl: string; via: "embedded" }> {
  const dataDir = path.join(process.cwd(), ".sandbox", "pgdata");
  mkdirSync(path.dirname(PID_FILE), { recursive: true });

  // Run the embedded-postgres start in a detached child so it survives after this script exits.
  const child = spawn(
    process.execPath,
    [
      "--import",
      "tsx",
      path.join(__dirname, "embedded-db-daemon.ts"),
      dataDir,
      String(DEFAULT_PORT),
    ],
    { detached: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env } }
  );
  child.unref();

  const ready = await new Promise<boolean>((resolve) => {
    let settled = false;
    child.stdout?.on("data", (chunk: Buffer) => {
      if (chunk.toString().includes("EMBEDDED_PG_READY") && !settled) {
        settled = true;
        resolve(true);
      }
    });
    child.stderr?.on("data", (chunk: Buffer) => process.stderr.write(chunk));
    setTimeout(() => !settled && resolve(false), 30000);
  });

  if (!ready) throw new Error("Embedded Postgres did not report ready within 30s");
  if (child.pid) writeFileSync(PID_FILE, String(child.pid));
  writeFileSync(PORT_FILE, String(DEFAULT_PORT));

  return { databaseUrl: embeddedUrl(DEFAULT_PORT), via: "embedded" };
}

if (require.main === module) {
  ensureDatabaseRunning()
    .then(({ databaseUrl, via }) => {
      console.log(`[db] Ready via ${via}: ${databaseUrl}`);
    })
    .catch((err) => {
      console.error("[db] Failed to start database:", err);
      process.exit(1);
    });
}
