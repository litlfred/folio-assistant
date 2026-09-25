/**
 * Escaped block-level markup in a BUILT page, and the one judgement it makes.
 *
 * @module scripts/tests/check-escaped-markup
 *
 * The defect: `docs/_includes/landing.html` built its `<article>` opening tag
 * across several lines, and a Liquid `{% endif -%}` right-stripped the newline
 * before the next attribute, so the tag emitted as
 * `…--fa-text-scale:0.74;"aria-labelledby=…`. Two attributes with no separator
 * is unparseable; `index.md` is markdown; Kramdown escaped the whole block. The
 * published landing page carried `&lt;article class="fa-sticky …"` as visible
 * text — **3 escaped, 0 real** — with every `.fa-landing-sticky--fixed` rule
 * dead, and TypeScript, e2e, accessibility and twelve gates were all green over
 * it, because every one of them reads a SOURCE that was valid HTML.
 *
 * Two things are pinned below, and the second is the one that decides whether
 * anybody leaves the check switched on:
 *
 * 1. **It fires on the shape that shipped** — including the closing tag, since
 *    Kramdown escapes the whole span once it refuses the block.
 * 2. **It does not fire on displayed markup.** The first run flagged two pages
 *    that are simply correct: `translation-support.html` documents the path
 *    `&lt;section&gt;/&lt;block&gt;/…` and `md-authoring.html` quotes
 *    `&lt;table class="md-table"&gt;`, both inside `<code>`. A check that fires on
 *    its legitimate subjects is a check that is wrong, so code and pre regions
 *    are excluded — and that exclusion needs a test in BOTH directions, or it is
 *    indistinguishable from a check that never fires at all.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  BLOCK_TAGS,
  blankCodeRegions,
  checkEscapedMarkup,
  escapedTagsIn,
  htmlPages,
  leakedTablesIn,
} from "../check-escaped-markup.js";

/** The exact opening tag the broken build published, welded attributes and all. */
const SHIPPED_BAD =
  '<div class="fa-sticky-board fa-landing-board">&lt;article class="fa-sticky fa-landing-sticky' +
  ' fa-sticky--backdrop fa-landing-sticky--fixed" data-fa-sticky-theme="grumpy-cat"' +
  ' data-fa-shape="mobile" style="--fa-text-scale:0.74;"aria-labelledby="fa-sticky-cat-harness-summary"&gt;' +
  "<p>body</p>&lt;/article&gt;</div>";

describe("escapedTagsIn", () => {
  test("finds the opening tag the broken build shipped", () => {
    const found = escapedTagsIn("index.html", SHIPPED_BAD);
    const opens = found.filter((f) => f.tag === "article" && f.kind === "open");
    expect(opens.length).toBe(1);
    expect(opens[0]!.excerpt).toContain("fa-landing-sticky");
  });

  test("finds the closing tag too — Kramdown escapes the whole span, not just the start", () => {
    const found = escapedTagsIn("index.html", SHIPPED_BAD);
    expect(found.filter((f) => f.tag === "article" && f.kind === "close").length).toBe(1);
  });

  test("a correctly rendered article is not a finding", () => {
    // The falsifier for every test above: the same page with real markup must
    // come back clean, or the check is just matching the word "article".
    const good = SHIPPED_BAD.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    expect(escapedTagsIn("index.html", good)).toEqual([]);
  });

  test("escaped markup inside <code> is DISPLAYED markup, not leaked markup", () => {
    // Both of these are real pages in this repository, and both are correct.
    const doc =
      "<p>The unit is " +
      "<code>&lt;section&gt;/&lt;block&gt;/translations/&lt;locale&gt;/block.po</code>." +
      "</p><p>Emitted as <code>&lt;table class=\"md-table\"&gt;</code> via regex.</p>";
    expect(escapedTagsIn("translation-support.html", doc)).toEqual([]);
  });

  test("...and inside <pre> likewise", () => {
    const doc = '<pre><code>&lt;article class="x"&gt;\n&lt;/article&gt;</code></pre>';
    expect(escapedTagsIn("guide.html", doc)).toEqual([]);
  });

  test("the SAME tag outside a code region is still reported", () => {
    // The other half of the exclusion. Without this, blanking code regions is
    // indistinguishable from blanking the whole page.
    const doc = '<p>see <code>&lt;article&gt;</code></p><div>&lt;article class="x"&gt;</div>';
    const found = escapedTagsIn("guide.html", doc);
    expect(found.length).toBe(1);
    expect(found[0]!.excerpt).toContain('class="x"');
  });

  test("a prose word that merely starts with a tag name is not a tag", () => {
    expect(escapedTagsIn("p.html", "<p>&lt;articles are not tags&lt;tabled either</p>")).toEqual([]);
  });

  test("an excerpt quotes the real page, not the blanked copy scanned over", () => {
    // Offsets are preserved by blanking rather than deleting; if that ever
    // regresses, excerpts silently start quoting spaces.
    const doc = '<p><code>&lt;ul&gt;</code></p><div>&lt;article data-x="keep-me"&gt;</div>';
    const found = escapedTagsIn("p.html", doc);
    expect(found.length).toBe(1);
    expect(found[0]!.excerpt).toContain("keep-me");
  });
});

describe("blankCodeRegions", () => {
  test("preserves length, so every later offset still points at the real page", () => {
    const doc = '<p>a</p><code>&lt;article&gt;</code><p>b</p>';
    expect(blankCodeRegions(doc).length).toBe(doc.length);
  });

  test("leaves everything outside code and pre untouched", () => {
    const doc = '<div>&lt;article&gt;</div>';
    expect(blankCodeRegions(doc)).toBe(doc);
  });
});

describe("BLOCK_TAGS", () => {
  test("covers structure and deliberately omits the inline elements this repo documents", () => {
    expect(BLOCK_TAGS).toContain("article");
    // `<picture>` and `<source>` are written about in prose on these pages; a
    // check that flagged them would be switched off within a week.
    expect(BLOCK_TAGS as readonly string[]).not.toContain("picture");
    expect(BLOCK_TAGS as readonly string[]).not.toContain("source");
  });
});

describe("checkEscapedMarkup", () => {
  test("reports the page a finding is on, and counts pages scanned", () => {
    const dir = mkdtempSync(join(tmpdir(), "escaped-markup-"));
    try {
      mkdirSync(join(dir, "sub"), { recursive: true });
      writeFileSync(join(dir, "index.html"), SHIPPED_BAD);
      writeFileSync(join(dir, "sub", "ok.html"), "<div><article>fine</article></div>");
      // Not HTML: a built tree may legitimately carry escaped markup as DATA.
      writeFileSync(join(dir, "data.json"), '{"s":"&lt;article class=\\"x\\"&gt;"}');

      const { pages, found } = checkEscapedMarkup(dir);
      expect(pages).toBe(2);
      expect(new Set(found.map((f) => f.page))).toEqual(new Set(["index.html"]));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a clean tree is clean — the check is not merely always red", () => {
    const dir = mkdtempSync(join(tmpdir(), "escaped-markup-clean-"));
    try {
      writeFileSync(join(dir, "index.html"), "<div><article>fine</article></div>");
      expect(checkEscapedMarkup(dir).found).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("an empty tree yields zero pages — which the CLI treats as could-not-determine", () => {
    // The third state lives in `main()`, and this pins the value it reads. A
    // green run over zero pages is the failure this whole script exists after.
    const dir = mkdtempSync(join(tmpdir(), "escaped-markup-bare-"));
    try {
      expect(checkEscapedMarkup(dir).pages).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("htmlPages", () => {
  test("walks nested directories and takes only .html/.htm", () => {
    const dir = mkdtempSync(join(tmpdir(), "escaped-markup-walk-"));
    try {
      mkdirSync(join(dir, "a", "b"), { recursive: true });
      writeFileSync(join(dir, "a", "b", "deep.html"), "<p>x</p>");
      writeFileSync(join(dir, "a", "page.htm"), "<p>x</p>");
      writeFileSync(join(dir, "a", "styles.css"), "p{}");
      expect(htmlPages(dir).length).toBe(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("a markdown table printed as text — bean `7w1a`", () => {
  /** The head of the methodologies page exactly as the broken build published it. */
  const SHIPPED_TABLE =
    "<p>| methodology | applies when | origin held? | declared by |\n" +
    "|—|—|—|—|\n" +
    '| <strong><a href="#diig">DIIG</a></strong><br /><code>diig</code> | Planning | x | y |</p>';

  test("finds the table that shipped, and names it by its header row", () => {
    const found = leakedTablesIn("methodologies/index.html", SHIPPED_TABLE);
    expect(found).toEqual([
      { page: "methodologies/index.html", excerpt: "| methodology | applies when | origin held? | declared by |" },
    ]);
  });

  test("accepts the other spellings a converter may emit", () => {
    for (const row of ["|---|---|", "| :---: | --- |", "|&mdash;|&mdash;|"]) {
      expect(leakedTablesIn("p.html", `<p>| a | b |\n${row}\n| 1 | 2 |</p>`).length).toBe(1);
    }
  });

  test("a table that RENDERED is not a finding", () => {
    const ok = "<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>";
    expect(leakedTablesIn("p.html", ok)).toEqual([]);
  });

  test("a table's SOURCE shown in a code block is documentation, not a leak", () => {
    const shown = "<pre><code>| a | b |\n|---|---|\n| 1 | 2 |\n</code></pre>";
    expect(leakedTablesIn("p.html", shown)).toEqual([]);
  });

  test("a single dash rule or a prose pipe is not a delimiter row", () => {
    expect(leakedTablesIn("p.html", "<p>a | b</p>\n<p>|—|</p>\n<hr />")).toEqual([]);
  });

  test("the tree scan reports it", () => {
    const dir = mkdtempSync(join(tmpdir(), "leaked-table-"));
    try {
      writeFileSync(join(dir, "index.html"), SHIPPED_TABLE);
      expect(checkEscapedMarkup(dir).leakedTables.length).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
