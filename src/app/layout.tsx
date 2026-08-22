import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { getSiteUrl, siteDescription, siteName, siteTitle } from "@/lib/seo";
import "./globals.css";

const bodyFont = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-body" });
const displayFont = Cormorant_Garamond({ subsets: ["latin"], display: "swap", variable: "--font-display", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: siteTitle, template: "%s | DNest" },
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: "DNest" }],
  creator: "DNest",
  publisher: "DNest",
  category: "lifestyle",
  keywords: ["long distance relationship app", "private couples app", "couple memory app", "relationship timeline", "love notes app", "couple scrapbook", "virtual date ideas", "couple bucket list", "meetup countdown", "relationship memory book"],
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" }, { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" }], apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
  robots: { index: true, follow: true },
  openGraph: { title: siteTitle, description: siteDescription, url: "/", siteName, type: "website", locale: "en_US", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "DNest — Our little place, no matter the distance." }] },
  twitter: { card: "summary_large_image", title: siteTitle, description: siteDescription, images: ["/opengraph-image"] },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || "_dY_pBzblQ3yamELmdEfgqFKNRG2yZr-yGGlyL05OX8",
  },
};

export const viewport: Viewport = { themeColor: "#a95f69", colorScheme: "light dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}><body>{children}</body></html>;
}
