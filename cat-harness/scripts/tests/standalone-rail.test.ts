/**
 * `railStandalonePages` — the pages that are neither a mount nor a generated
 * viewer. Bean `oi1y`.
 *
 * What these tests are mostly about is **what the pass must NOT touch**, because
 * every one of those cases looks identical from the outside once it has gone
 * wrong: a page with two navigations, or a replica wearing somebody else's
 * chrome, is not a crash and not a failing gate. It is a page that renders.
 *
 * The fixture deliberately names a page for each exclusion rather than testing
 * the predicate, since the predicate is three `startsWith` calls and the risk
 * is not that it computes wrongly — it is that the caller forgets a family.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { mountRoutes, railStandalonePages } from "../mount-instance-docs.js";

const page = (body: string): string =>
  `<!doctype html>\n<html><head><title>t</title></head><body>${body}</body></html>\n`;

/** The theme's own sidebar, as Jekyll lays it onto a `.md` page. */
const THEME_NAV = `<nav aria-label="Main" id="site-nav" class="site-nav">theme</nav>`;
/** The harness rail, as `injectRail` writes it. */
const HARNESS_NAV = `<nav class="fa-nav" aria-label="folio-assistant">rail</nav>`;

function site(): string {
  const root = mkdtempSync(join(tmpdir(), "oi1y-"));
  const put = (rel: string, body: string): void => {
    const p = join(root, rel);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, body);
  };
  // The two halves of one wireframe directory, which is the defect in miniature.
  put("wireframes/navbar/as-is.html", page(`<div class="side">a DRAWN sidebar</div>`));
  put("wireframes/navbar/intent.html", page(`${THEME_NAV}<p>laid out by Jekyll</p>`));
  put("bootstrap/README.html", page("<p>copied through</p>"));
  put("cat-harness/library/x/index.html", page(HARNESS_NAV));
  put("api/modules/thing.html", page("<p>TypeDoc, with its own navigation</p>"));
  put("who-iris/item.html", page("<p>a mount route</p>"));
  put("STAGING/branch/page.html", page("<p>a preview of somebody's branch</p>"));
  put("fragment.html", "<p>html by extension only</p>\n");
  return root;
}

const run = (root: string) => railStandalonePages(root, "cat-harness", "cat-harness", ["who-iris"]);
const railed = (root: string, rel: string): boolean =>
  /<nav class="fa-nav"/.test(readFileSync(join(root, rel), "utf-8"));

describe("what it rails", () => {
  test("a standalone page with no navigation gets one", () => {
    const root = site();
    run(root);
    expect(railed(root, "wireframes/navbar/as-is.html")).toBe(true);
    expect(railed(root, "bootstrap/README.html")).toBe(true);
  });

  test("a TypeDoc page gets one too, beside the navigation it already has", () => {
    // The exclusion this test used to assert. `api/` was held out of the first
    // pass because TypeDoc's pages already carry a toolbar, a module list and
    // a search dialog, so a second navigation was a LAYOUT question.
    //
    // Answered by rendering rather than by argument: a real published page was
    // railed and both versions opened at 1280px. The rail takes its 56px
    // COLLAPSED STRIP at x=0, the toolbar reflows to x=56, and `scrollWidth`
    // equals `innerWidth` in both — nothing is pushed off the page, and
    // TypeDoc's module list keeps its own column beside the strip.
    //
    // Asserted here so that re-excluding `api/` has to change a test.
    const root = site();
    run(root);
    expect(railed(root, "api/modules/thing.html")).toBe(true);
  });

  test("a page that DRAWS a sidebar still gets a real one", () => {
    // The IRIS-replica objection, answered from the repository's own
    // precedent: `navbar/intent.md` depicts the navbar too and wears the theme
    // sidebar, and nobody has called that wrong. A replica impersonates
    // somebody else's site; a wireframe is this site documenting itself, so
    // the drawing is content inside the page rather than a claim about it.
    const root = site();
    run(root);
    const html = readFileSync(join(root, "wireframes/navbar/as-is.html"), "utf-8");
    expect(html).toContain("a DRAWN sidebar");
    expect(html).toContain('<nav class="fa-nav"');
  });
});

describe("what it must NOT touch — each failure renders fine and is therefore invisible", () => {
  test("a page with the THEME's sidebar is already navigated", () => {
    // The one that produced four wrong measurements before this pass existed:
    // `docs-ui.css` styles the theme sidebar with `fa-nav-*` class names, so a
    // test for the harness rail that matches loosely sees a themed page as
    // railed — and a test that matches only the harness element rails it a
    // second time, giving the reader two navigations.
    const root = site();
    const r = run(root);
    expect(railed(root, "wireframes/navbar/intent.html")).toBe(false);
    expect(r.alreadyNavigated).toBeGreaterThan(0);
  });

  test("a page ALREADY carrying the harness rail is left alone", () => {
    const root = site();
    const before = readFileSync(join(root, "cat-harness/library/x/index.html"), "utf-8");
    run(root);
    expect(readFileSync(join(root, "cat-harness/library/x/index.html"), "utf-8")).toBe(before);
  });

  test("a mount route is the OTHER pass's subject", () => {
    // `injectRails` walks these with a per-instance model. Railing them here
    // too would give a mounted page two rails, and the second would carry the
    // ROOT instance's graphs rather than the mounted instance's — right-looking
    // and wrong.
    const root = site();
    run(root);
    expect(railed(root, "who-iris/item.html")).toBe(false);
  });

  test("STAGING previews are not this site", () => {
    // Every open branch's build lives under STAGING. Railing those would
    // rewrite other people's previews with THIS branch's navigation, and the
    // preview would then disagree with the branch it claims to show.
    const root = site();
    run(root);
    expect(railed(root, "STAGING/branch/page.html")).toBe(false);
  });
});

describe("what it reports", () => {
  test("a file with no <body> is NAMED, never counted", () => {
    // Same contract as the mount pass. A fragment is not a page this rail
    // belongs on, and a bare number could not be told from a bug.
    const root = site();
    const r = run(root);
    expect(r.skipped).toEqual(["fragment.html"]);
    expect(r.injected).toBe(3);
  });

  test("running twice injects nothing the second time", () => {
    // `injectRail` refuses a page that already carries one, so the pass is
    // idempotent — which is what makes it safe on a site the build may
    // process more than once.
    const root = site();
    run(root);
    const second = run(root);
    expect(second.injected).toBe(0);
  });
});

describe("the mount routes are ASKED for, not guessed", () => {
  test("`bootstrap` is not a mount route, so the pass must not skip it", () => {
    // The regression this exists for, and it cost a wrong claim on the PR.
    //
    // The first version decided a site directory was a mount when a same-named
    // `<name>/<name>.json` existed in the repository. `bootstrap/bootstrap.json`
    // does — but bootstrap declares no renderable docs, so `mountable()` never
    // mounts it, and the guess excluded exactly the ten pages the pass had just
    // been extended to reach.
    //
    // Asserted against the REAL repository rather than a fixture, because the
    // defect was that a plausible predicate disagreed with the real pipeline.
    expect(mountRoutes("cat-harness")).not.toContain("bootstrap");
  });

  test("it returns the routes the mount pass actually owns", () => {
    // Not pinned to a list: which instances are mountable is a property of the
    // repository and changes when one is added. What must hold is that every
    // route names a directory the mount pass would copy, and that the root
    // instance's own docs are not among them — it is already the site root.
    const routes = mountRoutes("cat-harness");
    expect(routes.every((r) => r.length > 0 && !r.startsWith("/"))).toBe(true);
    expect(routes).not.toContain("cat-harness");
  });
});
