import EmbeddedPostgres from "embedded-postgres";
import path from "path";
import { existsSync } from "fs";

const DATA_DIR = path.join(process.cwd(), ".sandbox", "pgdata");
const PORT = 55432;

export function embeddedDatabaseUrl(): string {
  return `postgresql://postgres:postgres@127.0.0.1:${PORT}/xoxobakery`;
}

let instance: EmbeddedPostgres | null = null;

/** Starts (or reuses) a local embedded Postgres binary — no Docker required. Used by `pnpm setup`
 *  and `pnpm db:up` when Docker isn't available on the machine. Data persists in .sandbox/pgdata. */
export async function startEmbeddedPostgres(): Promise<string> {
  const firstRun = !existsSync(DATA_DIR);
  instance = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: "postgres",
    password: "postgres",
    port: PORT,
    persistent: true,
  });

  if (firstRun) {
    await instance.initialise();
  }
  await instance.start();
  if (firstRun) {
    await instance.createDatabase("xoxobakery");
  }
  return embeddedDatabaseUrl();
}

export async function stopEmbeddedPostgres(): Promise<void> {
  if (instance) {
    await instance.stop();
    instance = null;
  }
}
