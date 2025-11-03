import { test, expect } from "@playwright/test";

test.describe("Homepage smoke", () => {
  test("renders hero copy", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /connect/i })).toBeVisible();
  });
});
