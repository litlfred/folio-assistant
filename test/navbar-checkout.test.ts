/**
 * `navbar` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/navbar.test.ts` (bean `7zz1`, owner ruling
 * 2026-10-06 "Top-level instance"): each draws the navbar rows of who-iris's
 * declared graphs, which only the checkout holds. Standing alone, cat-harness
 * has none of it, and `check:cat-harness-standalone` collects every test in
 * that layer. The rest of that file's tests stay there; every path here is
 * composed from ORIGIN_DIR, the directory they were written in, so nothing
 * they read changed.
 */
import { describe, expect, it } from "bun:test";

import { navbarRegionsHtml } from "../cat-harness/scripts/lib/navbar.js";
import { railModel } from "../cat-harness/scripts/lib/harness-rail.js";
import { declaredGraphs } from "../cat-harness/scripts/mount-instance-docs.js";
import { kindTitle } from "../cat-harness/scripts/lib/nav-label.js";

describe("every declared graph reaches the navbar, linked or not", () => {
  // The owner's report: "there shuold be all the harness controlled
  // dirs/graphs". The navbar listed two of who-iris's six.
  //
  // THIS IS BOUND TO `declaredGraphs`, not to a hand-built model. The
  // renderer's handling of a non-link is tested above against a fixture, and
  // that fixture went on passing while the PRODUCER emitted only the mounted
  // kinds — the regression was visible only by building a site. A test that
  // cannot see the producer cannot see this defect.
  const kinds = (linked: Record<string, string> = {}) =>
    declaredGraphs("who-iris", new Map(Object.entries(linked))).map((i) => i.label);
  // Rows say the kind's DISPLAY name since bean `ob3m` finding 6 ("One name
  // everywhere"), so a kind word is compared through the same function.
  const K = (kind: string): string => kindTitle(kind);

  it("lists every kind the instance declares, not only the published ones", () => {
    // SEVEN declared, and the seventh arrived by this test doing its job.
    // `code` joined on 2026-09-23 when `who-iris/scripts/` was declared under
    // bean `ylj7` — `gen-iris-pages.ts` and the catalogue checker had been
    // sitting in no declared directory while every OTHER graph in this
    // instance was declared. The list grew because the instance did, which is
    // what "every kind the instance declares" is for; pinning it at six would
    // have made the assertion a statement about 2026-09-22 rather than about
    // the declaration.
    // EIGHT since 2026-09-27: `qa` joined when `who-iris/test/results/` was
    // declared, so that auditing this instance produces a committed verdict
    // rather than nothing — 13 instances had no `test/results` at all, which
    // made "audited clean" and "never audited" the same observation (bean
    // `bjzs`). The list grew because the instance did, exactly as it did for
    // `code`; pinning it at seven would make the assertion a statement about
    // 2026-09-26 rather than about the declaration.
    // ELEVEN since 2026-10-01: `schemas` joined when who-iris took its own
    // source descriptor (`sources/`) and generated lookup (`id-lookup/`, kind
    // `code`) from large-datasets (bean `j7ql`); `glossary` and `voices` joined
    // when the WHO style guide was folded into who-iris as a subgraph (bean
    // `qsx4`) — the voices declared from within `skills/skills.json`, the
    // glossary in who-iris.json. Same reason as both above.
    expect(kinds()).toEqual(["catalogue", "code", "docs", "glossary", "library", "qa", "schemas", "skills", "themes", "translation-sources", "uploads", "voices"].map(K));
  });

  it("links exactly the kinds it was told are published", () => {
    const got = declaredGraphs("who-iris", new Map([["docs", "../docs/who-iris/"]]));
    expect(got.find((i) => i.label === K("docs"))?.href).toBe("../docs/who-iris/");
    // ...and everything else carries no href, which the renderer draws as a
    // non-link. `harness-tiles`: declared and not rendered is a GAP.
    expect(got.filter((i) => i.href === undefined).map((i) => i.label)).toEqual([
      "catalogue",
      // `code` is declared and publishes no page — which is exactly the state
      // this assertion exists to keep visible, rather than a gap to hide.
      "code",
      // `glossary` and `voices` arrived with the style guide (bean `qsx4`); no
      // page is passed in here, so both are declared-and-unlinked.
      "glossary",
      "library",
      // `qa` is declared and publishes no page, like `code` above: the audit
      // writes sidecars, and the viewer for them is the QA index rather than a
      // per-instance graph page. Declared-and-unrendered is the state this
      // assertion keeps visible.
      "qa",
      // `schemas` (who-iris/sources/, bean `j7ql`) publishes no page either.
      "schemas",
      "skills",
      "themes",
      // `translation-sources`: who-iris carries its own glossary catalogues
      // since bean riit ("move things to semantically appropriate place").
      "translation-sources",
      "uploads",
      "voices",
    ].map(K));
  });

  it("carries the generator's REASON onto the rows that have no href", () => {
    const got = declaredGraphs(
      "who-iris",
      new Map([["docs", "../docs/who-iris/"]]),
      new Map([
        ["catalogue", { note: "no viewer yet" }],
        ["themes", { note: "staging only" }],
      ]),
    );
    expect(got.find((i) => i.label === K("catalogue"))?.note).toBe("no viewer yet");
    // TWO ROWS, TWO REASONS. One wording for every inert row is the defect
    // this replaced — `title="declared, with no published viewer"` was wrong
    // for the staging-only and render-exempt cases, which are not gaps.
    expect(got.find((i) => i.label === K("themes"))?.note).toBe("staging only");
    // A kind the generator said nothing about renders as it always did: grey,
    // and making no claim about why. The honest third state.
    expect(got.find((i) => i.label === K("skills"))?.note).toBeUndefined();
  });

  it("links a kind whose viewer the HANDLER published — `pk2s`", () => {
    // The defect: who-iris's `catalogue` drew as a grey row over a page that
    // exists. `cat-harness/catalogue/who-iris/index.html` is 23,534 bytes on
    // `gh-pages`, measured 2026-09-23 — the rail was losing a working link.
    //
    // The mount table cannot see it. `mountable()` requires an `index.html`
    // in the instance's own directory, and `who-iris/catalogue/` holds DATA.
    // The page that renders it is the cat-harness HANDLER's, and a handler's
    // viewer is never a mount.
    const got = declaredGraphs(
      "who-iris",
      new Map([["docs", "../docs/who-iris/"]]),
      new Map([["catalogue", { href: "../cat-harness/catalogue/who-iris/" }]]),
    );
    expect(got.find((i) => i.label === K("catalogue"))?.href).toBe("../cat-harness/catalogue/who-iris/");
    // And it is a LINK, so it owes no explanation.
    expect(got.find((i) => i.label === K("catalogue"))?.note).toBeUndefined();
  });

  it("the MOUNT TABLE wins where it has an answer — the owner's order, not a tie-break", () => {
    // *"cliking shoud go to folio view, not the schema viweer."* A mount is
    // the instance presenting itself; the handler's viewer is cat-harness's
    // default rendering of the same graph. Both exist for `library`, and the
    // instance's own route is the one a reader gets.
    const got = declaredGraphs(
      "who-iris",
      new Map([["library", "../who-iris/"]]),
      new Map([["library", { href: "../cat-harness/library/who-iris/" }]]),
    );
    expect(got.find((i) => i.label === K("library"))?.href).toBe("../who-iris/");
  });
});

describe("adjacent graph rows cannot be confused (bean yag0)", () => {
  // The owner clicked who-iris's `docs` row meaning `library` on 2026-09-23:
  // adjacent rows, each a one-letter initial beside a bare kind word, and at
  // rest the strip shows only the marks. `catalogue` and `code` shared `C`.
  const rows = declaredGraphs("who-iris", new Map([["docs", "../docs/who-iris/"], ["library", "../cat-harness/library/who-iris/"]]));

  it("docs and library carry a drawn glyph and distinct hues, not initials", () => {
    // The rows say the kind's display name since bean `ob3m` finding 6.
    const docs = rows.find((r) => r.label === "Docs")!;
    const library = rows.find((r) => r.label === "Library")!;
    expect(docs.glyphPath).toBeDefined();
    expect(library.glyphPath).toBeDefined();
    expect(docs.icon).toBeUndefined();
    expect(docs.tone).not.toBe(library.tone);
  });

  it("every row's accessible name is full and distinct, and begins with its visible label", () => {
    const html = navbarRegionsHtml(railModel({ instance: "who-iris", toRoot: "..", links: rows }));
    const names = rows.map((r) => `${r.label} — ${r.description}`);
    expect(new Set(names).size).toBe(rows.length);
    for (const r of rows) {
      expect(r.description).toContain("who-iris");
      // The visible label then the hidden rest, inside the same row, and the
      // same text as its tooltip.
      expect(html).toContain(`${r.label}<span class="fa-nav-sr"> — ${r.description!.replace(/&/g, "&amp;")}`);
    }
    expect(rows.find((r) => r.label === "Library")!.description).toBe("L1 source content, who-iris");
    expect(html).toContain('title="Library — L1 source content, who-iris"');
  });

  it("the glyph is an SVG hidden from assistive technology — the words are the name", () => {
    const html = navbarRegionsHtml(railModel({ instance: "who-iris", toRoot: "..", links: rows }));
    expect(html).toMatch(/<span class="fa-nav-glyph fa-nav-tone" style="[^"]*" aria-hidden="true"><svg viewBox="0 0 24 24"/);
  });
});
