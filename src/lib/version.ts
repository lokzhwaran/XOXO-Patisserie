export const APP_VERSION = "0.1.1-launch-polish";
export const APP_VERSION_LABEL = "v0.1.1-launch-polish";
export const APP_VERSION_CREATED_AT = "2026-09-29T14:47:57Z";

export function getVersionStamp() {
  return {
    version: APP_VERSION,
    label: APP_VERSION_LABEL,
    createdAt: APP_VERSION_CREATED_AT,
  };
}
