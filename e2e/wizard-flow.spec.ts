import { expect, test } from '@playwright/test';

/**
 * These tests require an authenticated Supabase session.
 *
 * To run with auth:
 * 1. Start the dev server: npm run dev
 * 2. Log in manually, then export storage state:
 *    npx playwright codegen --save-storage=e2e/.auth/user.json http://localhost:5173
 * 3. Add `storageState: 'e2e/.auth/user.json'` to playwright.config.ts use section
 * 4. Run: npm run test:e2e
 */

async function navigateToWizard(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto('/app/new');
  // Wait for navigation to settle (auth redirect or wizard render)
  await page.waitForTimeout(2000);
  if (page.url().includes('/login')) return false;
  await page.getByTestId('fei-input').waitFor({ timeout: 10000 });
  return true;
}

test('FEI: invalid shows error on blur', async ({ page }) => {
  const ok = await navigateToWizard(page);
  if (!ok) { test.skip(true, 'Auth required'); return; }

  const feiInput = page.getByTestId('fei-input');
  await feiInput.fill('12345');
  await feiInput.blur();

  const error = page.getByTestId('fei-error');
  await expect(error).toBeVisible();
  await expect(error).toContainText('exactly 10 digits');
});

test('FEI: non-numeric shows format error on blur', async ({ page }) => {
  const ok = await navigateToWizard(page);
  if (!ok) { test.skip(true, 'Auth required'); return; }

  const feiInput = page.getByTestId('fei-input');
  await feiInput.fill('12345AB789');
  await feiInput.blur();

  const error = page.getByTestId('fei-error');
  await expect(error).toBeVisible();
  await expect(error).toContainText('numbers only');
});

test('FEI: valid 10-digit clears error', async ({ page }) => {
  const ok = await navigateToWizard(page);
  if (!ok) { test.skip(true, 'Auth required'); return; }

  const feiInput = page.getByTestId('fei-input');

  await feiInput.fill('12345');
  await feiInput.blur();
  await expect(page.getByTestId('fei-error')).toBeVisible();

  await feiInput.fill('1234567890');
  await feiInput.blur();
  await expect(page.getByTestId('fei-error')).not.toBeVisible();
});

test('FEI: empty shows no error', async ({ page }) => {
  const ok = await navigateToWizard(page);
  if (!ok) { test.skip(true, 'Auth required'); return; }

  const feiInput = page.getByTestId('fei-input');
  await feiInput.fill('');
  await feiInput.blur();
  await expect(page.getByTestId('fei-error')).not.toBeVisible();
});
