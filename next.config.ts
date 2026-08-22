import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: `default-src 'self'; script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; ${isDev ? "" : "upgrade-insecure-requests"}`,
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: isDev ? ["127.0.0.1"] : undefined,
  images: { remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }] },
  async headers() {
    const noIndexHeaders = { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet, noimageindex" };
    const privatePrefixes = ["home", "moments", "together", "plans", "us", "notes", "questions", "notifications", "settings", "onboarding", "invite", "sign-in", "sign-up", "forgot-password", "reset-password", "offline", "api", "auth"];
    return [
      { source: "/(.*)", headers: securityHeaders },
      ...privatePrefixes.map(prefix => ({ source: `/${prefix}/:path*`, headers: [noIndexHeaders] })),
    ];
  },
};

export default nextConfig;
