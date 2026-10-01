import type { NextConfig } from "next";

/**
 * Product images are either served from /public/uploads (no external account needed) or from the
 * configured Supabase Storage bucket. next/image needs the Supabase host allow-listed, and that
 * host is only known from the environment, so it is derived here rather than hardcoded.
 */
function supabaseImagePatterns() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return [];
  try {
    const { hostname } = new URL(url);
    return [{ protocol: "https" as const, hostname, pathname: "/storage/v1/object/public/**" }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseImagePatterns(),
  },
};

export default nextConfig;
