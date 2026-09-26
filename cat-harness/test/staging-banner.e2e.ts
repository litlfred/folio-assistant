import { test, expect } from "@playwright/test";
import { FRAGMENT } from "../scripts/staging-banner.ts";

/**
 * The staging banner's CLIENT half, in a browser. Bean `g196`.
 *
 * `staging-banner-constant.test.ts` pins the property the bean is about — the
 * injected bytes do not depend on the build. It cannot say whether the script
 * those bytes carry actually WORKS, because the script only runs in a browser
 * with a `location.pathname` under `STAGING/` and a `staging.json` to fetch.
 * That is this file.
 *
 * The three states below are the ones that matter, and the middle one is the
 * reason this is not a happy-path test:
 *
 *   staging.json fetched     -> the full banner, links and compare target
 *   fetch fails / 404        -> still says FEATURE BRANCH, says detail is gone
 *   not under a STAGING path -> says so, and does not fetch someone else's
 *
 * **"Could not determine" is never rendered as "this is the real site."** The
 * banner exists so a reviewer cannot mistake staged content for the published
 * site; a client-rendered banner that vanishes on a failed fetch would fail
 * exactly when it matters, and the harm is a reviewer approving the wrong
 * artefact. So the degraded states are asserted first-class, not as edge
 * cases.
 *
 * The fragment is IMPORTED rather than retyped. `sidebar-panels.e2e.ts` keeps
 * its own copy of the old offset script, which is how the six copies of
 * `stripLeanComments` happened (bean `bqrg`) — three of them broken, with
 * nothing saying so.
 */

const SLUG = "claude-example";
const ROOT = `/folio-assistant/STAGING/${SLUG}/`;

const FACTS = {
  branch: "claude/example",
  sha: "abc1234",
  built: "2026-09-20T18:00:00Z",
  pr: "563",
  prUrl: "https://github.com/litlfred/folio-assistant/pull/563",
  branchUrl: "https://github.com/litlfred/folio-assistant/tree/claude/example",
  issue: "215",
  issueUrl: "https://github.com/litlfred/folio-assistant/issues/215",
  runUrl: "https://github.com/litlfred/folio-assistant/actions/runs/9",
  mainSite: "https://litlfred.github.io/folio-assistant",
  mainPagesKnown: true,
  newPages: ["guides/brand-new.html"],
};

// The footer include renders CONSTANTLY on a staging build — `short_sha`,
// `built_at` and `run_url` are no longer written to `docs/_data/build.yml`
// there, so Liquid's `| default: 'dev'` is what ships and the client fills the
// real values in. This fixture reproduces exactly that output.
const FOOTER =
  `<p class="text-small mb-0 fa-build-stamp">deployed ` +
  `<a href="https://github.com/litlfred/folio-assistant/actions"><code>dev</code></a></p>`;

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>${FRAGMENT}<h1>page</h1>${FOOTER}</body></html>`;

/**
 * Serve a page at `path` and, unless `json` is null, a `staging.json` at the
 * preview root. `page.route` rather than a server: the property under test is
 * how the script behaves given a pathname and a fetch outcome, and a route
 * lets the 404 case be produced exactly rather than arranged.
 */
async function serve(page: import("@playwright/test").Page, path: string, json: object | null) {
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("staging.json")) {
      if (json === null) return route.fulfill({ status: 404, body: "not found" });
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(json) });
    }
    return route.fulfill({ status: 200, contentType: "text/html", body: PAGE });
  });
  await page.goto(`http://127.0.0.1:8080${path}`);
  await page.waitForLoadState("networkidle");
}

test("the banner fills in from staging.json", async ({ page }) => {
  await serve(page, `${ROOT}index.html`, FACTS);
  const banner = page.locator("[data-fa-staging-banner]");
  await expect(banner).toContainText("FEATURE BRANCH");
  await expect(banner).toContainText("claude/example");
  await expect(banner).toContainText("abc1234");
  await expect(banner).toContainText("2026-09-20T18:00:00Z");
  await expect(banner.getByText("PR #563")).toBeVisible();
  await expect(banner.getByText("issue #215")).toBeVisible();
  await expect(banner.getByText("build log")).toBeVisible();
});

test("the compare link deep-links to THIS page on main", async ({ page }) => {
  // Landing the reader on the site root asks them to re-navigate from memory
  // to do the comparison the link is for, and the deeper the page the less
  // likely they bother. The client derives the page from its own pathname.
  await serve(page, `${ROOT}guides/agent-onboarding.html`, FACTS);
  const compare = page.locator("[data-fa-staging-banner] a", { hasText: "compare with main" });
  await expect(compare).toHaveAttribute(
    "href",
    "https://litlfred.github.io/folio-assistant/guides/agent-onboarding.html",
  );
});

test("a page with NO counterpart on main says so instead of linking to a 404", async ({ page }) => {
  // Deep-linking unconditionally would publish a 404 on exactly the pages a
  // reviewer most wants to see — the ones the branch ADDS.
  await serve(page, `${ROOT}guides/brand-new.html`, FACTS);
  const banner = page.locator("[data-fa-staging-banner]");
  await expect(banner).toContainText("(new page)");
  await expect(banner.locator("a", { hasText: "main ↗" })).toHaveAttribute(
    "href",
    "https://litlfred.github.io/folio-assistant/",
  );
});

test("an unread publish ref falls back to the root and does NOT call pages new", async ({ page }) => {
  // The third state. "Could not tell" rendering as "this page is new" would
  // label every page new on any run where the publish-ref fetch failed.
  await serve(page, `${ROOT}guides/brand-new.html`, { ...FACTS, mainPagesKnown: false, newPages: [] });
  const banner = page.locator("[data-fa-staging-banner]");
  await expect(banner).not.toContainText("(new page)");
  await expect(banner.locator("a", { hasText: "compare with main" })).toHaveAttribute(
    "href",
    "https://litlfred.github.io/folio-assistant/",
  );
});

test("a directory URL compares against index.html, not against the bare directory", async ({ page }) => {
  await serve(page, ROOT, FACTS);
  await expect(
    page.locator("[data-fa-staging-banner] a", { hasText: "compare with main" }),
  ).toHaveAttribute("href", "https://litlfred.github.io/folio-assistant/index.html");
});

test("a 404 on staging.json STILL announces the preview", async ({ page }) => {
  // The rule the whole design turns on. A reviewer must not be able to mistake
  // this page for the published site because a fetch failed.
  await serve(page, `${ROOT}index.html`, null);
  const banner = page.locator("[data-fa-staging-banner]");
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("FEATURE BRANCH");
  await expect(banner).toContainText("build details unavailable");
});

test("served from outside a preview path, it says so rather than fetching", async ({ page }) => {
  // No `STAGING/<slug>/` in the pathname means there is no staging.json that
  // belongs to this page; fetching one anyway would read another preview's.
  await serve(page, "/folio-assistant/index.html", FACTS);
  const banner = page.locator("[data-fa-staging-banner]");
  await expect(banner).toContainText("FEATURE BRANCH");
  await expect(banner).toContainText("not served from a preview path");
});

test("the banner pushes the fixed sidebar down, after the fetch changes its height", async ({ page }) => {
  // just-the-docs makes `.side-bar` `position: fixed; top: 0`, and a sticky
  // banner is in normal flow so it moves nothing out of it — the banner
  // covered the site title and the toolbar row holding the theme, reading
  // preferences, language and QR controls. A reader reported the language
  // selector "still not visible"; it was under the banner.
  //
  // Filling the banner in is a THIRD moment its height can change, which the
  // build-time version never had: it was already final when the script ran.
  await serve(page, `${ROOT}index.html`, FACTS);
  const offset = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--fa-staging-offset").trim(),
  );
  const height = await page.locator("[data-fa-staging-banner]").evaluate((b) => b.getBoundingClientRect().height);
  expect(parseFloat(offset)).toBeGreaterThan(0);
  expect(parseFloat(offset)).toBeCloseTo(height, 0);
});

test("a branch name containing markup is rendered as TEXT", async ({ page }) => {
  // Git ref names may contain `<`, `>` and `"` — they are not in git's
  // forbidden set, which stops at space, `~`, `^`, `:`, `?`, `*`, `[`, `\`
  // and the control characters. The old bash banner interpolated `$BRANCH`
  // into an HTML string. This one must build nodes.
  await serve(page, `${ROOT}index.html`, { ...FACTS, branch: `x<img src=q onerror="window.__pwned=1">y` });
  const banner = page.locator("[data-fa-staging-banner]");
  await expect(banner).toContainText(`x<img src=q onerror="window.__pwned=1">y`);
  expect(await banner.locator("img").count()).toBe(0);
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
});


test("the footer build stamp is filled from staging.json too", async ({ page }) => {
  // Bean `g196`, second half. `footer_custom.html` renders `short_sha` and
  // `built_at` into EVERY page, so a fresh `date -u` made every page unique on
  // every run — the same defect as the banner, one include away, and it
  // survived the banner fix. Measured on two deploys of one branch three
  // minutes apart, both already shipping a constant banner: 1466 insertions,
  // 1465 deletions across 613 files, every page changed by exactly one line.
  await serve(page, `${ROOT}index.html`, FACTS);
  const stamp = page.locator(".fa-build-stamp");
  await expect(stamp).toContainText("abc1234");
  await expect(stamp).toContainText("2026-09-20T18:00:00Z");
  await expect(stamp).not.toContainText("dev");
  await expect(stamp.locator("a")).toHaveAttribute(
    "href",
    "https://github.com/litlfred/folio-assistant/actions/runs/9",
  );
});

test("a failed fetch leaves the footer as Jekyll rendered it, not blank", async ({ page }) => {
  // The same third-state rule as the banner: "could not determine" degrades to
  // the honest placeholder rather than to an empty footer that looks like a
  // page with no build at all.
  await serve(page, `${ROOT}index.html`, null);
  await expect(page.locator(".fa-build-stamp")).toContainText("dev");
});
