/**
 * P1's navigation diff (`ig-nav-diff.ts`, bean `ha24`): sushi `menu:` against
 * the Publisher's rendered top bar, entry by entry.
 */
import { describe, expect, it } from "bun:test";
import { combinedNavDiff, derivedMenu, derivedPages, navDiff, navDiffRecord, renderedMenu, renderedTocPages, tocDiff } from "./ig-nav-diff.ts";

const BAR = `<ul xmlns="http://www.w3.org/1999/xhtml" class="nav navbar-nav">
  <li class="dropdown"><a data-toggle="dropdown" href="#" class="dropdown-toggle">Home <b class="caret"></b></a>
    <ul class="dropdown-menu"><li><a href="index.html">Summary</a></li><li><a href="changes.html">Change &amp; Log</a></li></ul></li>
  <li><a href="framework.pdf">Framework</a></li>
  <li class="dropdown"><a data-toggle="dropdown" href="#" class="dropdown-toggle">Indices <b class="caret"></b></a>
    <ul class="dropdown-menu"><li><a href="artifacts.html">Artifact Index</a></li><li><a href="api-hub.html">API Hub</a></li></ul></li>
</ul>`;

const SUSHI = `id: example.ig
menu:
  Home:
    Summary: index.html
    Change Log: changes.html
  Framework: framework.pdf
  Indices:
    Artifact Index: artifacts.html
`;

describe("the two sides", () => {
  it("reads the Publisher's top bar: dropdowns, a top-level page, entities decoded", () => {
    expect(renderedMenu(`<html><body>${BAR}</body></html>`)).toEqual([
      { label: "Home", items: [{ label: "Summary", href: "index.html" }, { label: "Change & Log", href: "changes.html" }] },
      { label: "Framework", href: "framework.pdf", items: [] },
      { label: "Indices", items: [{ label: "Artifact Index", href: "artifacts.html" }, { label: "API Hub", href: "api-hub.html" }] },
    ]);
  });

  it("refuses a page with no top bar rather than reporting it as empty", () => {
    expect(() => renderedMenu("<html></html>")).toThrow("navbar-nav");
  });
});

describe("the diff, entry by entry", () => {
  const d = navDiff(derivedMenu(SUSHI), renderedMenu(BAR));

  it("matches by href, so a relabel is a label difference, not a removal plus an addition", () => {
    expect(d).toContainEqual({ kind: "label", group: "Home", href: "changes.html", derived: "Change Log", rendered: "Change & Log" });
  });

  it("names an entry only the Publisher rendered", () => {
    expect(d).toContainEqual({ kind: "only-rendered", group: "Indices", label: "API Hub", href: "api-hub.html" });
  });

  it("reports nothing for what agrees, and an order change once per group", () => {
    expect(d.length).toBe(2);
    const swapped = navDiff(derivedMenu(SUSHI), renderedMenu(BAR.replace('<li><a href="index.html">Summary</a></li><li><a href="changes.html">Change &amp; Log</a></li>', '<li><a href="changes.html">Change Log</a></li><li><a href="index.html">Summary</a></li>')));
    expect(swapped.filter((x) => x.kind === "order")).toEqual([{ kind: "order", group: "Home", derived: ["index.html", "changes.html"], rendered: ["changes.html", "index.html"] }]);
  });

  it("names a whole group either side lacks", () => {
    expect(navDiff([{ label: "Only", items: [] }], [{ label: "Other", items: [] }])).toEqual([
      { kind: "group-only-derived", group: "Only" },
      { kind: "group-only-rendered", group: "Other" },
    ]);
  });
});

describe("per IG and combined", () => {
  const script = "fhir-harness/scripts/ig-nav-diff.ts";
  const a = navDiffRecord("a.ig", derivedMenu(SUSHI), renderedMenu(BAR), script);
  const b = navDiffRecord("b.ig", derivedMenu(SUSHI), derivedMenu(SUSHI), script);

  it("an IG whose diff is empty is a record of zero, not an absent record", () => {
    expect(b.total).toBe(0);
    expect(b.families["nav-diff"]!.count).toBe(0);
  });

  it("combines with each difference tagged by IG, and each IG's count stated", () => {
    const c = combinedNavDiff([a, b], script);
    expect(c.total).toBe(2);
    expect(c.families["by-ig"]!.entries).toEqual([{ ig: "a.ig", differences: 2 }, { ig: "b.ig", differences: 0 }]);
    expect(() => combinedNavDiff([a], script)).toThrow("at least two");
    expect(() => combinedNavDiff([a, a], script)).toThrow("twice");
  });
});

describe("the toc half: declared pages against the Publisher's table of contents", () => {
  const SUSHI_PAGES = `id: example.ig
pages:
  index.md:
    title: Home
    overview.md:
      title: Overview
  changes.xml:
    title: Changes
`;
  const TOC = `<h2>Table of Contents</h2><table><tr><td><a href="index.html">Home</a></td></tr>
<tr><td><a href="overview.html#top">Overview</a></td></tr><tr><td><a href="qa.html">QA</a></td></tr>
<tr><td><a href="ValueSet-x.html">x</a></td></tr><tr><td><a href="https://hl7.org/x.html">ext</a></td></tr></table>`;

  it("derives nested pages as .html, and reads the toc's pages without anchors, artefacts or external links", () => {
    expect(derivedPages(SUSHI_PAGES)).toEqual(["index.html", "overview.html", "changes.html"]);
    expect(renderedTocPages(TOC)).toEqual(["index.html", "overview.html", "qa.html"]);
  });

  it("names pages either side lacks", () => {
    expect(tocDiff(derivedPages(SUSHI_PAGES), renderedTocPages(TOC))).toEqual([
      { kind: "page-only-derived", page: "changes.html" },
      { kind: "page-only-rendered", page: "qa.html" },
    ]);
  });

  it("refuses a page that is not a table of contents", () => {
    expect(() => renderedTocPages("<html></html>")).toThrow("Table of Contents");
  });
});
