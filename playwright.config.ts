import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // `*.e2e.ts`, not `*.spec.ts`: `bun test` collects `*.spec.*` anywhere in
  // the tree and chokes on Playwright's `test.describe()`. Keeping the two
  // runners on separate conventions is what stops an e2e spec reddening the
  // unit-test gate.
  testMatch: ['**/*.e2e.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8080',
    headless: true,
    trace: 'on-first-retry',
    launchOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      // Some images ship Chromium at a pinned path under
      // PLAYWRIGHT_BROWSERS_PATH with PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD set,
      // and the installed @playwright/test asks for a `chrome-headless-shell`
      // build they do not carry. Point it at the Chromium that IS present
      // rather than downloading one. Unset elsewhere, so the default applies.
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // `test-server.mjs` serves the repo root statically. It was referenced here
  // long before it existed — see bean `dzl3` — so no e2e test in this repo was
  // runnable until it was written.
  webServer: {
    command: 'node test-server.mjs',
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
  timeout: 180000,
  expect: {
    timeout: 10000,
  },
});
