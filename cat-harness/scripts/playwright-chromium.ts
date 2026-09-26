/**
 * Which Chromium should Playwright launch here?
 *
 * The answer is not always "the one Playwright asks for". A prebuilt image
 * pins a browser build under `PLAYWRIGHT_BROWSERS_PATH` and sets
 * `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`, so the build on disk is whatever the
 * image was baked with — while the installed `@playwright/test` asks for the
 * revision ITS version pins. When those diverge every browser-backed test
 * dies at launch with "Executable doesn't exist … run npx playwright install",
 * which is advice you cannot take in an image that forbids the download.
 *
 * Measured in this container on 2026-09-19: `@playwright/test` resolved to
 * 1.61.1, which wants `chromium_headless_shell-1228`; the image ships 1194.
 * Playwright 1.56.0 is the release whose pinned revision IS 1194, so the
 * declared floor `^1.60.0` could not be satisfied by any version matching the
 * image — the drift was in the range, not only in the caret.
 *
 * @module scripts/playwright-chromium
 * @graphNode schema
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Three states, never two. A fallback that is indistinguishable from the
 * expected build is how a suite silently starts measuring something other
 * than what it claims — so `fallback` is reported separately from `expected`
 * and says which revision it found.
 */
export type ChromiumChoice =
  | { kind: "explicit"; path: string; note: string }
  | { kind: "expected"; path: undefined; note: string }
  | { kind: "fallback"; path: string; note: string }
  | { kind: "unknown"; path: undefined; note: string };

/** Directory entries that are a Chromium build, newest revision first. */
function chromiumBuilds(dir: string, ls: (d: string) => string[]): string[] {
  return ls(dir)
    .filter((n) => /^chromium(_headless_shell)?-\d+$/.test(n))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
}

/**
 * `PLAYWRIGHT_CHROMIUM_PATH` always wins — an operator who names a binary has
 * said something this function cannot know. Otherwise: when the image pins a
 * browsers directory and a Chromium build is in it, launch that one and SAY
 * SO; when the directory is unreadable or holds no Chromium, return
 * `unknown` and let Playwright's own error stand, because inventing a path
 * that does not exist replaces a clear failure with a confusing one.
 */
export function resolveChromium(
  env: Record<string, string | undefined>,
  ls: (d: string) => string[] = readdirSync as unknown as (d: string) => string[],
  exists: (p: string) => boolean = existsSync,
): ChromiumChoice {
  const explicit = env.PLAYWRIGHT_CHROMIUM_PATH;
  if (explicit) {
    return { kind: "explicit", path: explicit, note: `PLAYWRIGHT_CHROMIUM_PATH=${explicit}` };
  }

  const root = env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root) {
    return { kind: "expected", path: undefined, note: "no PLAYWRIGHT_BROWSERS_PATH; Playwright's own default applies" };
  }

  let builds: string[];
  try {
    builds = chromiumBuilds(root, ls);
  } catch {
    return { kind: "unknown", path: undefined, note: `could not read ${root}; leaving Playwright's default in place` };
  }

  for (const build of builds) {
    const candidate = join(root, build, "chrome-linux", "chrome");
    if (exists(candidate)) {
      return {
        kind: "fallback",
        path: candidate,
        note: `${root} ships ${build}; launching it. Set PLAYWRIGHT_CHROMIUM_PATH to override.`,
      };
    }
  }

  return { kind: "unknown", path: undefined, note: `no Chromium build under ${root}; leaving Playwright's default in place` };
}
