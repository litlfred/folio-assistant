import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // `*.e2e.ts`, not `*.spec.ts`: `bun test` collects `*.spec.*` anywhere in
  // the tree and chokes on Playwright's `test.describe()`. Keeping the two
  // runners on separate conventions is what stops an e2e spec reddening the
  // unit-test gate.
  testMatch: ['**/*.e2e.ts'],
  timeout: 120000,
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
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node test-server.cjs',
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
  timeout: 180000,
  expect: {
    timeout: 10000,
  },
});
