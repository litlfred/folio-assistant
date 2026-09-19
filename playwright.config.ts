import { defineConfig, devices } from '@playwright/test';
import { resolveChromium } from './scripts/playwright-chromium';

// Which Chromium to launch, decided once and REPORTED. A prebuilt image pins
// a browser build that the installed @playwright/test may not be the one that
// asks for it, and the resulting "Executable doesn't exist … run npx
// playwright install" names a remedy the image forbids. Falling back silently
// would be worse than the error: the suite would measure a different browser
// than it claims to, so the fallback prints which build it chose.
const chromium = resolveChromium(process.env as Record<string, string | undefined>);
if (chromium.kind === 'fallback' || chromium.kind === 'unknown') {
  console.warn(`[playwright] chromium: ${chromium.kind} — ${chromium.note}`);
}

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
      // Resolved above. `undefined` means "Playwright's own default", which
      // is what a developer machine with a matching install wants; a path
      // means this image pins a build and we are launching it deliberately.
      executablePath: chromium.path,
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
