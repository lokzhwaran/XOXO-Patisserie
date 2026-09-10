import { existsSync, readFileSync, rmSync } from "fs";
import path from "path";

const PID_FILE = path.join(process.cwd(), ".sandbox", "pg.pid");

async function main() {
  if (!existsSync(PID_FILE)) {
    console.log("[db] No embedded Postgres PID file found — nothing to stop (Docker users: run `docker compose down`).");
    return;
  }
  const pid = Number(readFileSync(PID_FILE, "utf8").trim());
  try {
    process.kill(pid, "SIGTERM");
    console.log(`[db] Sent SIGTERM to embedded Postgres (pid ${pid}).`);
  } catch {
    console.log("[db] Process already stopped.");
  }
  rmSync(PID_FILE, { force: true });
}

main();
