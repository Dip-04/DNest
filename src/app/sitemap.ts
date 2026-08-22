import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteUrl();
  return [
    { url: new URL("/", origin).toString(), changeFrequency: "weekly", priority: 1 },
    { url: new URL("/features", origin).toString(), changeFrequency: "monthly", priority: 0.8 },
    { url: new URL("/privacy", origin).toString(), changeFrequency: "yearly", priority: 0.5 },
    { url: new URL("/terms", origin).toString(), changeFrequency: "yearly", priority: 0.4 },
  ];
}
