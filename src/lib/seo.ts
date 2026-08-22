import type { Metadata } from "next";

export const siteName = "DNest";
export const siteTitle = "DNest — Private Relationship App for Couples";
export const siteDescription = "DNest is a private space for couples to save memories, share love notes, plan meetups, and keep their relationship story close across any distance.";

export function getSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const fallback = "http://localhost:3000";
  try {
    const url = new URL(configured || fallback);
    if (process.env.VERCEL_ENV === "production" && (!configured || url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname.endsWith(".vercel.app"))) {
      throw new Error("NEXT_PUBLIC_APP_URL must be the canonical custom HTTPS domain in production.");
    }
    return new URL(url.origin);
  } catch (error) {
    if (process.env.VERCEL_ENV === "production") throw error;
    return new URL(fallback);
  }
}

export function publicPageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | DNest`, description, url: path, siteName, type: "website", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "DNest — Our little place, no matter the distance." }] },
    twitter: { card: "summary_large_image", title: `${title} | DNest`, description, images: ["/opengraph-image"] },
  };
}

export function privateMetadata(title: string): Metadata {
  return { title, alternates: { canonical: null }, robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } } };
}
