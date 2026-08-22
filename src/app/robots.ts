import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: ["/", "/sign-in", "/sign-up"], disallow: ["/home", "/moments", "/together", "/plans", "/us", "/notes", "/questions", "/notifications", "/settings", "/onboarding", "/invite"] }] };
}
