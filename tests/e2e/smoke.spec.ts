import { test, expect } from "@playwright/test";

// Hermetic smoke tests — no auth, no DB writes. They guard the public surface +
// the auth gate, which is where a broken deploy shows up first.

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Nashville's curated startup talent network/i })
  ).toBeVisible();
});

test("sign-in offers LinkedIn + magic link", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in →" }).click();
  await expect(page.getByRole("button", { name: /Sign in with LinkedIn/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Send magic link/i })).toBeVisible();
});

test("public /apply renders the intake", async ({ page }) => {
  await page.goto("/apply");
  await expect(page.getByText(/LinkedIn is how we know you/i)).toBeVisible();
});

test("/admin redirects to home when signed out", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL("http://localhost:3000/");
});
