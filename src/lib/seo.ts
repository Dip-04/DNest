import type { Metadata } from "next";

export const siteName = "DNest";
export const siteTitle = "DNest — Private Relationship App for Couples";
export const siteDescription =
  "DNest is a private space for couples to save memories, share love notes, plan meetups, and keep their relationship story close across any distance.";

function toHttpOrigin(
  value: string | undefined,
  assumeHttps = false,
): URL | null {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(
      assumeHttps && !candidate.includes("://")
        ? `https://${candidate}`
        : candidate,
    );
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return new URL(url.origin);
  } catch {
    return null;
  }
}

export function getSiteUrl(): URL {
  // Vercel may evaluate metadata routes (including /_not-found) before project
  // environment variables are attached. Canonical resolution must never make
  // an otherwise valid production build fail.
  return (
    toHttpOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    toHttpOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL, true) ??
    new URL("http://localhost:3000")
  );
}

export function publicPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | DNest`,
      description,
      url: path,
      siteName,
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "DNest — Our little place, no matter the distance.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | DNest`,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export function privateMetadata(title: string): Metadata {
  return {
    title,
    alternates: { canonical: null },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  };
}
