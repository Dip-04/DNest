import { expect, test } from "@playwright/test";

test("homepage exposes complete public metadata and valid JSON-LD", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("DNest — Private Relationship App for Couples");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /private space for couples/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https?:\/\//);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /DNest/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('meta[name="google-site-verification"]')).toHaveAttribute("content", "_dY_pBzblQ3yamELmdEfgqFKNRG2yZr-yGGlyL05OX8");
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const schemas = JSON.parse(blocks[0]) as Array<{ "@type": string }>;
  expect(schemas.map(schema => schema["@type"])).toEqual(["WebSite", "SoftwareApplication"]);
});

test("crawl endpoints expose only public marketing URLs", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const robotsText = await robots.text();
  expect(robotsText).toContain("Sitemap:");
  expect(robotsText).toContain("Disallow: /moments");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const sitemapText = await sitemap.text();
  for (const path of ["/features", "/privacy", "/terms"]) expect(sitemapText).toContain(path);
  for (const privatePath of ["/home", "/moments", "/invite/", "/sign-in"]) expect(sitemapText).not.toContain(privatePath);
});

test("favicon, manifest, and social image return usable assets", async ({ request }) => {
  for (const path of ["/favicon.ico", "/apple-touch-icon.png", "/icons/android-chrome-192x192.png", "/icons/android-chrome-512x512.png", "/icons/maskable-icon-512x512.png"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"], path).toMatch(/image/);
  }
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  expect((await manifest.json()).icons).toHaveLength(4);
  const og = await request.get("/opengraph-image");
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toContain("image/png");
});

test("auth and private entry points are noindex", async ({ page, request }) => {
  await page.goto("/sign-in");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const signIn = await request.get("/sign-in");
  expect(signIn.headers()["x-robots-tag"]).toContain("noindex");
  const home = await request.get("/home", { maxRedirects: 0 });
  expect([302, 307, 308]).toContain(home.status());
  expect(home.headers()["x-robots-tag"]).toContain("noindex");
});

test("unknown public URLs return an actual 404", async ({ request }) => {
  expect((await request.get("/this-page-does-not-exist")).status()).toBe(404);
});
