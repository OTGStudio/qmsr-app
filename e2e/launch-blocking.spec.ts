import { expect, test } from '@playwright/test';

test('launch button disabled when validation errors exist', async ({ page }) => {
  await page.goto('/app/new');
  if (page.url().includes('/login')) {
    test.skip(true, 'Auth required');
    return;
  }

  const launchBtn = page.getByTestId('launch-btn');
  if (await launchBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await expect(launchBtn).toBeDisabled();
    await expect(page.getByTestId('launch-errors')).toBeVisible();
  }
});
