import { expect, test } from "@playwright/test";

test("health endpoint is available", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ status: "ok" });
});

test("customer homepage renders primary navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/XOXO/i);
  await expect(page.getByRole("link", { name: /menu/i }).first()).toBeVisible();
});