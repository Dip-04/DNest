import { expect, test } from "@playwright/test";

test("private pages preserve the intended destination and explain the redirect", async ({ page }) => {
  await page.goto("/moments/new?from=home");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fmoments%2Fnew%3Ffrom%3Dhome/);
  await expect(page.locator('[role="alert"]').filter({ hasText: "Please sign in to open your private Nest." })).toBeVisible();
});

test("protected APIs return JSON 401 instead of redirecting to HTML", async ({ request }) => {
  const response = await request.get("/api/export", { maxRedirects: 0 });
  expect(response.status()).toBe(401);
  expect(response.headers()["content-type"]).toContain("application/json");
  await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
});

test("password reset requires a valid recovery session", async ({ page }) => {
  await page.goto("/reset-password");
  await expect(page).toHaveURL(/\/forgot-password/);
  await expect(page.locator('[role="alert"]').filter({ hasText: "Request a fresh password-reset link" })).toBeVisible();
});

test("success and error toasts animate, announce, dismiss, and clean their URL", async ({ page }) => {
  await page.goto("/?success=Your%20changes%20were%20saved.");
  const success = page.getByRole("status");
  await expect(success).toContainText("Your changes were saved.");
  await success.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(success).toBeHidden();
  await expect(page).toHaveURL("/");

  await page.goto("/sign-in?error=Check%20the%20form%20and%20try%20again.");
  await expect(page.locator('[role="alert"]').filter({ hasText: "Check the form and try again." })).toBeVisible();
});
