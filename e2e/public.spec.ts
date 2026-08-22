import { test, expect } from "@playwright/test";
test("theme control switches and persists the selected appearance", async ({
  page,
}) => {
  await page.goto("/");
  const toggle = page
    .getByRole("button", { name: /switch to (dark|light) mode/i })
    .first();
  await toggle.click();
  const selectedTheme = await page.locator("html").getAttribute("data-theme");
  expect(["light", "dark"]).toContain(selectedTheme);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    selectedTheme!,
  );
});

test("landing page communicates the private two-person product", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /relationship deserves/ }),
  ).toBeVisible();
  await expect(page.getByText(/Exactly two members/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Create your Nest/ }).first(),
  ).toHaveAttribute("href", "/sign-up");
});
test("auth pages are usable on a phone", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open our Nest" }),
  ).toBeVisible();
});
test("private pages redirect unauthenticated visitors when Supabase is configured", async ({
  page,
}) => {
  await page.goto("/home");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fhome/);
});
