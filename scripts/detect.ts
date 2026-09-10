import { spawnSync } from "child_process";

export function commandExists(cmd: string): boolean {
  const result = spawnSync(process.platform === "win32" ? "where" : "which", [cmd], { stdio: "ignore" });
  return result.status === 0;
}

export function dockerAvailable(): boolean {
  if (!commandExists("docker")) return false;
  const result = spawnSync("docker", ["info"], { stdio: "ignore", timeout: 5000 });
  return result.status === 0;
}
