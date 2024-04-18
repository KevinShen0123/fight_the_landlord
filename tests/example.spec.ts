import { test, expect } from '@playwright/test';

test('test player', async ({ page }) => {
  await page.goto('http://localhost:8221/api/login?key=foo-bar-baz&user=qingli&role=Player');

  await expect(page).toHaveTitle(/Playwright/);
});

test('test admin', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
