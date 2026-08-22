import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/features",
          "/privacy",
          "/terms",
          "/favicon.ico",
          "/icons/",
          "/opengraph-image",
        ],
        disallow: [
          "/api/",
          "/auth/",
          "/home",
          "/moments",
          "/together",
          "/plans",
          "/us",
          "/notes",
          "/questions",
          "/notifications",
          "/settings",
          "/onboarding",
          "/invite/",
          "/sign-in",
          "/sign-up",
          "/forgot-password",
          "/reset-password",
          "/offline",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  };
}
