import { test, expect } from '@playwright/test';

test('POS page loads correctly', async ({ page }) => {
  // Navigate to the POS page
  await page.goto('/pos');

  // Verify the page loads without crashing
  await expect(page.locator('body')).toBeVisible();
});
