import { expect, test } from "@playwright/test";

test.describe("public smoke", () => {
  test("home page describes Multi-Tenant Supabase Starter", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Multi-Tenant Supabase Starter/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Create account/i })).toBeVisible();
  });

  test("register and login pages load", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /Create platform account/i })).toBeVisible();

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Platform login/i })).toBeVisible();
  });

  test("solution page loads", async ({ page }) => {
    await page.goto("/solution");
    await expect(
      page.getByRole("heading", { name: /Internal Email Mapping/i })
    ).toBeVisible();
  });
});
