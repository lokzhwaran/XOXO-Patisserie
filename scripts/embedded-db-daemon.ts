import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "fs";

/** Runs as a detached child process spawned by db-up.ts so the Postgres daemon it starts keeps
 *  running after the parent script/process exits (pg_ctl start itself already daemonizes, but we
 *  keep this process alive too so `pnpm db:down` has a PID to signal). */
async function main() {
  const [, , dataDir, portStr] = process.argv;
  const port = Number(portStr);
  const firstRun = !existsSync(dataDir);

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "postgres",
    password: "postgres",
    port,
    persistent: true,
  });

  if (firstRun) await pg.initialise();
  await pg.start();
  if (firstRun) await pg.createDatabase("xoxobakery").catch(() => undefined);

  console.log("EMBEDDED_PG_READY");

  process.on("SIGTERM", async () => {
    await pg.stop();
    process.exit(0);
  });
  process.on("SIGINT", async () => {
    await pg.stop();
    process.exit(0);
  });

  // Keep the event loop alive indefinitely.
  setInterval(() => {}, 1 << 30);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
