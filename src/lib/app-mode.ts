/** Single source of truth for sandbox-vs-live mode across every provider. Default: sandbox. */
export type AppMode = "sandbox" | "live";

export function getAppMode(): AppMode {
  const raw = (process.env.APP_MODE ?? "sandbox").toLowerCase();
  return raw === "live" ? "live" : "sandbox";
}

export const isSandboxMode = () => getAppMode() === "sandbox";
export const isLiveMode = () => getAppMode() === "live";
