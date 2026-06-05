import { expect, test } from "@playwright/test";

const e2eLive =
  process.env.E2E_LIVE === "1" &&
  !!process.env.E2E_OWNER_EMAIL &&
  !!process.env.E2E_OWNER_PASSWORD;

test.describe("live Supabase flow", () => {
  test.skip(!e2eLive, "Set E2E_LIVE=1 and owner credentials to run");

  test("owner can register, create org, open customer site", async ({ page }) => {
    const suffix = Date.now();
    const ownerEmail = process.env.E2E_OWNER_EMAIL!;
    const ownerPassword = process.env.E2E_OWNER_PASSWORD!;
    const orgSlug = `e2e-org-${suffix}`;

    await page.goto("/login");
    await page.getByLabel("Email").fill(ownerEmail);
    await page.getByLabel("Password").fill(ownerPassword);
    await page.getByRole("button", { name: /Log in/i }).click();

    await page.waitForURL("**/console");
    await expect(page.getByRole("heading", { name: /Your organizations/i })).toBeVisible();

    await page.getByLabel("Organization name").fill(`E2E Org ${suffix}`);
    await page.getByLabel("URL slug").fill(orgSlug);
    await page.getByRole("button", { name: /Create org/i }).click();

    await expect(page.getByRole("heading", { name: new RegExp(`E2E Org ${suffix}`) })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("link", { name: /Customer signup/i }).first().click();
    await expect(page.getByRole("link", { name: /Multi-Tenant Supabase Starter/i })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/${orgSlug}/signup`));
  });
});
