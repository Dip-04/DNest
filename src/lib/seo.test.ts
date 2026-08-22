import { afterEach, describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getSiteUrl, privateMetadata, siteDescription } from "@/lib/seo";

const originalUrl = process.env.NEXT_PUBLIC_APP_URL;
const originalVercelEnv = process.env.VERCEL_ENV;
const originalVercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = originalUrl;
  process.env.VERCEL_ENV = originalVercelEnv;
  process.env.VERCEL_PROJECT_PRODUCTION_URL = originalVercelProductionUrl;
});

describe("SEO configuration", () => {
  it("keeps the main description useful and snippet-sized", () => {
    expect(siteDescription.length).toBeGreaterThanOrEqual(120);
    expect(siteDescription.length).toBeLessThanOrEqual(160);
  });

  it("normalizes canonical configuration to the origin", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://www.dnest.example/some/path?preview=1";
    expect(getSiteUrl().toString()).toBe("https://www.dnest.example/");
  });

  it("uses Vercel's stable production URL when the public app URL is unavailable", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "dnest.example";
    expect(getSiteUrl().toString()).toBe("https://dnest.example/");
  });

  it("never crashes a production build when canonical environment variables are missing", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    process.env.VERCEL_ENV = "production";
    expect(() => getSiteUrl()).not.toThrow();
    expect(getSiteUrl().toString()).toBe("http://localhost:3000/");
  });

  it("marks reusable private metadata noindex and nofollow", () => {
    const value = privateMetadata("Private");
    expect(value.robots).toMatchObject({ index: false, follow: false, nocache: true });
  });

  it("includes only public URLs in the sitemap", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://dnest.example";
    expect(sitemap().map(entry => entry.url)).toEqual(["https://dnest.example/", "https://dnest.example/features", "https://dnest.example/privacy", "https://dnest.example/terms"]);
  });

  it("advertises the sitemap and blocks private areas", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://dnest.example";
    const value = robots();
    expect(value.sitemap).toBe("https://dnest.example/sitemap.xml");
    expect(value.rules).toEqual(expect.arrayContaining([expect.objectContaining({ disallow: expect.arrayContaining(["/home", "/moments", "/invite/"]) })]));
  });

  it("provides standard and maskable PWA icons", () => {
    const value = manifest();
    expect(value.start_url).toBe("/");
    expect(value.icons).toEqual(expect.arrayContaining([expect.objectContaining({ sizes: "512x512", purpose: "any" }), expect.objectContaining({ sizes: "512x512", purpose: "maskable" })]));
  });
});
