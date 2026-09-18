import { defineConfig } from "@playwright/test";

/**
 * Config for UI specs that build their own DOM with `page.setContent` and
 * therefore need no web server.
 *
 * The main `playwright.config.ts` starts `node test-server.cjs`, and that file
 * is absent from the repository and not gitignored — so `bunx playwright test`
 * fails before any test runs. That is a pre-existing defect tracked separately;
 * this config exists so server-less specs are runnable meanwhile, not to work
 * around it permanently.
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/sidebar-panels.spec.ts"],
  timeout: 60000,
  reporter: "list",
  use: {
    headless: true,
    launchOptions: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      // This image ships Chromium at a pinned build under
      // PLAYWRIGHT_BROWSERS_PATH and sets PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD.
      // The installed @playwright/test wants a `chrome-headless-shell` build
      // it does not have, so point it at the Chromium that IS here rather
      // than downloading one. Overridable for other environments.
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_PATH ||
        "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    },
  },
});
