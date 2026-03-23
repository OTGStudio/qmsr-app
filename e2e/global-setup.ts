import { existsSync } from 'node:fs';
import { chromium, type FullConfig } from '@playwright/test';

const AUTH_FILE = 'e2e/.auth/user.json';

/**
 * Playwright global setup: ensures an authenticated storage-state file exists
 * before any E2E tests run.
 *
 * Two paths:
 * 1. If `e2e/.auth/user.json` already exists, skip (reuse previous session).
 * 2. If QMRS_TEST_EMAIL + QMRS_TEST_PASSWORD env vars are set, log in
 *    programmatically and save the storage state.
 * 3. Otherwise, print instructions — tests will gracefully skip at runtime.
 */
async function globalSetup(config: FullConfig) {
  if (existsSync(AUTH_FILE)) {
    console.log('[e2e] Auth file found — reusing existing session.');
    return;
  }

  const email = process.env.QMRS_TEST_EMAIL;
  const password = process.env.QMRS_TEST_PASSWORD;

  if (!email || !password) {
    console.log(
      '[e2e] No auth file and no QMRS_TEST_EMAIL/QMRS_TEST_PASSWORD env vars.\n' +
        '       Tests requiring auth will be skipped.\n' +
        '       To set up auth manually, run:\n' +
        '         npm run test:e2e:setup\n' +
        '       Then re-run: npm run test:e2e',
    );
    return;
  }

  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:5173';

  console.log(`[e2e] Logging in as ${email}...`);
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${baseURL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to /app (auth success)
  try {
    await page.waitForURL('**/app**', { timeout: 20000 });
  } catch {
    // Debug: log the current URL and page content on failure
    console.error(`[e2e] Login redirect failed. Current URL: ${page.url()}`);
    const body = await page.textContent('body').catch(() => '(could not read body)');
    console.error(`[e2e] Page text: ${body?.slice(0, 500)}`);
    await browser.close();
    return;
  }

  // Save the authenticated session
  await context.storageState({ path: AUTH_FILE });
  console.log(`[e2e] Auth saved to ${AUTH_FILE}`);

  await browser.close();
}

export default globalSetup;
