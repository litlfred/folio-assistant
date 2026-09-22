/**
 * The state dashboards: their route, and what each page can and cannot claim.
 *
 * @module scripts/tests/state-visualizer
 *
 * The generator writes COMMITTED pages under this instance's site dir, so
 * `state:visualizer:check` is the staleness gate and this file is the
 * behaviour gate. It reads what the generator produced rather than re-deriving
 * it the same way, and it must never assert a COUNT of beans or epics — those
 * move whenever anybody works, and a test that fails because somebody closed a
 * bean is a test that gets deleted.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  declaredVisualiserFor,
  describe as describeText,
  GENERATED_BY,
  prunableDashboards,
} from "../state-visualizer.ts";
import { instanceRootFor, siteDirFor } from "../../schemas/cat-harness.ts";

const ROOT = instanceRootFor(import.meta.dir);
const SITE = join(ROOT, siteDirFor(ROOT));

/** A dashboard's committed page. */
const read = (graph: string) =>
  readFileSync(join(SITE, graph, "index.html"), "utf-8");
const has = (graph: string) => existsSync(join(SITE, graph, "index.html"));

describe("the route is the policy, not this generator's choice", () => {
  test("the visualiser is AT the directory's own URL, one per declared state graph", () => {
    for (const id of ["beans", "todos", "qa", "health", "issue-marks", "uploads"]) {
      expect(has(id)).toBe(true);
    }
  });

  test("no stub segment, and no invented one", () => {
    // Bean `o7eq` ruling 1: the segment is the instance's NAME, never its
    // stub. Two earlier drafts published under `folio-assistant`, which names
    // the published graph DOCUMENT and not the instance. Ruling 3 then elides
    // this instance's own name, because its docs are the published root.
    expect(existsSync(join(SITE, "folio-assistant"))).toBe(false);
    expect(existsSync(join(SITE, "state"))).toBe(false);
    expect(existsSync(join(SITE, "state-visualizer"))).toBe(false);
    // And no segment BENEATH the directory either. `harness-requirements`
    // names `<base-url>/beans` as the obligation, so a page one level deeper
    // leaves that URL a 404 and does not meet it.
    expect(existsSync(join(SITE, "beans", "dashboard"))).toBe(false);
  });

  test("the segment is the declared ID, because two paths basename alike", () => {
    // `qa` is `test/results/` and `health` is `test/health/results/`. Taking
    // the basename — which the sibling schema visualiser does, correctly, for
    // its own graph — would give both the segment `results`, and one dashboard
    // would silently overwrite the other.
    expect(has("qa")).toBe(true);
    expect(has("health")).toBe(true);
    expect(existsSync(join(SITE, "results", "index.html"))).toBe(false);
  });
});

describe("each page reads the projection that already exists", () => {
  test("relative to itself, at the depth its own route implies", () => {
    expect(read("beans")).toContain('content="../assets/beans/index.json"');
    expect(read("todos")).toContain('content="../assets/todos/index.json"');
  });

  test("and that projection is really there", () => {
    // The generator publishes no data of its own — `gen-docs-pages.ts` does.
    // A second copy would be two answers to what the work plan holds.
    expect(existsSync(join(SITE, "assets", "beans", "index.json"))).toBe(true);
    expect(existsSync(join(SITE, "assets", "todos", "index.json"))).toBe(true);
  });

  test("a graph page names only its own graph", () => {
    // Asserted on the META TAG, not the bare string: the renderer is INLINED
    // into every page and its source names both metas, because querying for
    // them is its job. An earlier draft asserted the string and failed on the
    // renderer's own code — a true fact about the file and nothing about the
    // page.
    const meta = (html: string, name: string) => new RegExp(`<meta name="${name}"`).test(html);
    expect(meta(read("beans"), "fa-beans-src")).toBe(true);
    expect(meta(read("beans"), "fa-todo-src")).toBe(false);
    expect(meta(read("todos"), "fa-todo-src")).toBe(true);
    expect(meta(read("todos"), "fa-beans-src")).toBe(false);
  });
});

describe("what a page may claim", () => {
  test("a graph with no projection says so instead of rendering zeros", () => {
    // `qa` was the example here until 2026-09-21, when bean `py74` gave it a
    // projection. `health` (1 file) and `issue-marks` (2) are the ones this
    // repository has DECIDED are too thin to earn a dashboard, so they are the
    // stable examples rather than merely the currently-empty ones.
    const html = read("health");
    expect(html).toContain("declared");
    expect(html).toContain("2krx");
    // No container in the BODY, so the renderer never mounts. Matched as the
    // element rather than the attribute name, which the inlined renderer also
    // contains.
    expect(/<div class="fa-workplan" data-fa-workplan>/.test(html)).toBe(false);
    expect(/<meta name="fa-(beans|todo)-src"/.test(html)).toBe(false);
  });

  test("every page carries the registry, so the set is navigable from any of them", () => {
    // There is no index above these: `<base>/` is the documentation site's.
    // The way across is on each page, which is what makes them registered
    // sub-visualisations rather than six unrelated pages.
    for (const id of ["beans", "todos", "qa"]) {
      expect(read(id)).toContain("State graphs this harness declares");
    }
    // The link to beans is on every page EXCEPT the beans page, which is the
    // next assertion and the reason this one cannot simply check all three.
    expect(read("todos")).toContain('href="../beans/"');
    expect(read("qa")).toContain('href="../beans/"');
  });

  test("a page never links to itself", () => {
    // A link to here is a control that does nothing, and a reader who clicks
    // it learns only that it did nothing. The current row is plain text.
    expect(read("beans")).not.toContain('href="../beans/"');
    expect(read("todos")).not.toContain('href="../todos/"');
    expect(read("beans")).toContain('<span class="sv-here">beans</span>');
  });

  test("the renderer and its styles are inlined, so no asset is fetched", () => {
    const html = read("beans");
    expect(html).toContain("mountWorkPlan");
    expect(html).toContain("--fa-wp-surface");
    expect(html).not.toContain("<script src=");
    expect(html).not.toContain("cdn.");
  });

  test("every page carries the do-not-hand-edit notice", () => {
    for (const id of ["beans", "todos", "qa"]) {
      expect(read(id)).toContain("Do not hand-edit");
    }
  });
});

describe("no projection here is not the same as nothing renders this", () => {
  // Bean `flh4`, issue #618. The generator asked "is there a projection at MY
  // path?" and published the answer as "nothing renders this graph". `uploads`
  // is where the two diverge: its queue block lives inside
  // `assets/library/index.json`, because it is one dataset with `library/` and
  // two projections over it would be two answers to "how many are queued".

  test("a graph whose declaration names a visualiser says so, and links to it", () => {
    const html = read("uploads");
    expect(html).toContain("rendered elsewhere");
    expect(html).not.toContain("nothing publishes a projection for it yet");
  });

  test("the link is a real directory under this site, not a fabricated path", () => {
    // Asserted by RESOLVING it, not by matching the string. The declared value
    // is repo-root relative and the page is two levels into the site, so a
    // plausible-looking href is exactly the defect that would survive a
    // string assertion.
    const html = read("uploads");
    const href = /rendered elsewhere[\s\S]*?href="([^"]+)"/.exec(html)?.[1];
    expect(href).toBeTruthy();
    const target = join(SITE, "uploads", href!);
    expect(existsSync(join(target, "index.html"))).toBe(true);
  });

  test("it is labelled with the URL a reader sees, never the repo path", () => {
    // The declared value is `cat-harness/docs/...`, which is correct on disk
    // and meaningless in an address bar.
    const label = /rendered elsewhere[\s\S]*?<a [^>]*>([^<]+)<\/a>/.exec(read("uploads"))?.[1];
    expect(label).toBeTruthy();
    expect(label!.startsWith("/")).toBe(true);
    expect(label).not.toContain("docs/");
  });

  test("and the graph that page renders really is the one being pointed at", () => {
    // Falsification the other way: if the target stopped carrying queue data,
    // "rendered elsewhere" would be a link to a page that does not render it.
    const href = /rendered elsewhere[\s\S]*?href="([^"]+)"/.exec(read("uploads"))![1]!;
    const target = readFileSync(join(SITE, "uploads", href, "index.html"), "utf-8");
    expect(target).toContain("uningested");
  });

  test("a graph with NO declared visualiser still says nothing renders it", () => {
    // The other direction, and the reason this change is scoped rather than a
    // blanket rewrite: these declare no visualiser, so their pages were right
    // and must not move. `qa` was in this list until 2026-09-21 and left it by
    // GAINING a projection (bean `py74`), not by the rule changing.
    for (const id of ["health", "issue-marks"]) {
      expect(read(id)).toContain("nothing publishes a projection for it yet");
      expect(read(id)).not.toContain("rendered elsewhere");
    }
  });

  test("no page claims a visualiser that is not there", () => {
    // `unresolved` fires on nothing today — 27 of 27 coverage paths resolve —
    // so this asserts the CORPUS is clean rather than that the state works.
    // The state itself is exercised in the unit test below, because a test
    // that can only pass is not a test.
    for (const id of ["beans", "todos", "qa", "health", "issue-marks", "uploads"]) {
      expect(read(id)).not.toContain("not there");
    }
  });
});

describe("declaredVisualiserFor — the four outcomes, against fixtures", () => {
  // The site segment comes from the SINGLE ANSWER, never a literal — the rule
  // `site-dir-single-answer` enforces, and which this block broke on its first
  // draft. A hardcoded site root once unignored 3,080 files.
  const SEG = siteDirFor(ROOT);
  const page = (...parts: string[]) => ["inst", SEG, ...parts].join("/");

  /** A repo root with a site in it, and whichever pages the case needs. */
  function roots(pages: string[] = []): { site: string; repoRoot: string } {
    const repoRoot = mkdtempSync(join(tmpdir(), "sv-cov-"));
    const site = join(repoRoot, "inst", SEG);
    mkdirSync(site, { recursive: true });
    for (const rel of pages) {
      const f = join(repoRoot, rel);
      mkdirSync(join(f, ".."), { recursive: true });
      writeFileSync(f, "<html></html>");
    }
    return { site, repoRoot };
  }

  test("no declared visualiser is `declared` — unchanged, and the common case", () => {
    expect(declaredVisualiserFor("qa", undefined, roots()).state).toBe("declared");
  });

  test("a declared visualiser that resolves is `elsewhere`, with a page-relative href", () => {
    const rel = page("lib", "x", "index.html");
    const got = declaredVisualiserFor("uploads", rel, roots([rel]));
    expect(got.state).toBe("elsewhere");
    expect(got.href).toBe(join("..", "lib", "x", "index.html"));
    expect(got.declaredVisualiser).toBe(rel);
  });

  test("a declared visualiser that is NOT there is `unresolved`, never `elsewhere`", () => {
    // The branch the corpus cannot reach: 27 of 27 coverage paths resolve. If
    // this collapsed into `elsewhere`, the page would publish a link to a 404
    // — which is the defect this whole change exists to avoid, one level down.
    const rel = page("lib", "gone", "index.html");
    const got = declaredVisualiserFor("uploads", rel, roots());
    expect(got.state).toBe("unresolved");
    expect(got.href).toBeUndefined();
    expect(got.declaredVisualiser).toBe(rel);
  });

  test("a visualiser OUTSIDE the site is `elsewhere` but carries no href", () => {
    // It exists, so it is not `unresolved`; it is not published, so any href
    // would be a control that resolves to nothing once the site is served.
    const got = declaredVisualiserFor("uploads", "other/place/index.html", roots(["other/place/index.html"]));
    expect(got.state).toBe("elsewhere");
    expect(got.href).toBeUndefined();
  });

  test("resolution is against the REPO root, not the instance root", () => {
    // The trap that would have marked all 27 missing. Measured 2026-09-20: 25
    // of 27 coverage paths resolve ONLY from the repo root, 0 only from the
    // instance. The same page, spelled both ways: the repo-root spelling must
    // resolve and the instance-relative one must not, or the assertion above
    // is not discriminating.
    const rel = page("lib", "x", "index.html");
    const r = roots([rel]);
    expect(declaredVisualiserFor("uploads", rel, r).state).toBe("elsewhere");
    expect(declaredVisualiserFor("uploads", "lib/x/index.html", r).state).toBe("unresolved");
  });
});

describe("a declared description is escaped BEFORE its code spans are made", () => {
  // Bean `xo3t`. The registry wrote descriptions through `esc()` alone, so the
  // markdown backticks in them reached the page as backticks. Measured across
  // both declarations: 12 of 34 carry one in the first sentence, which is the
  // part the registry shows.

  test("a backticked span becomes code", () => {
    expect(describeText("what the sweep under `test/health/` wrote"))
      .toBe("what the sweep under <code>test/health/</code> wrote");
  });

  test("several spans on one line each become their own code element", () => {
    expect(describeText("`a`, `b` and `c`"))
      .toBe("<code>a</code>, <code>b</code> and <code>c</code>");
  });

  test("ANGLE BRACKETS INSIDE a span stay escaped — the order is the fix", () => {
    // This is the case the corpus would exploit unaided: `library` is declared
    // as "one `<bib-slug>/` per ingested document". Escaping AFTER the code
    // substitution would turn the emitted <code> into text and leave the
    // description's own brackets live.
    expect(describeText("one `<bib-slug>/` per document"))
      .toBe("one <code>&lt;bib-slug&gt;/</code> per document");
  });

  test("markup outside a span is escaped, never emitted", () => {
    expect(describeText('<img src=x onerror="alert(1)">'))
      .toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(describeText("a & b")).toBe("a &amp; b");
  });

  test("an UNPAIRED backtick is left alone, not greedy to end of line", () => {
    // A greedy or unanchored match would swallow the rest of the text into a
    // code element that the author never opened.
    expect(describeText("a ` b")).toBe("a ` b");
    expect(describeText("`open and never closed")).toBe("`open and never closed");
  });

  test("the corpus renders with no literal backtick left in a registry row", () => {
    // The end-to-end half: whatever the declarations say today, no dashboard
    // shows a raw backtick in the descriptions it lists.
    for (const id of ["beans", "todos", "qa", "health", "issue-marks", "uploads"]) {
      const body = read(id).slice(read(id).indexOf('<ul class="sv-list">'));
      expect(/<p>[^<]*`/.test(body)).toBe(false);
    }
  });
});

describe("orphan dashboards — a page that answers to no declaration", () => {
  // Bean `ankg`. A generator that writes and never deletes leaves a page
  // serving a subject nothing describes, and `--check` was structurally blind
  // to it: it inspected only the files it was about to write, so it could find
  // a page that was WRONG but never one that SHOULD NOT EXIST.

  // The generator's own constant, not a retyped copy: a fixture that restates
  // the value under test agrees with a wrong one just as happily as a right one.
  const MARK = GENERATED_BY;

  /** A site directory with the given pages in it. */
  function site(pages: Record<string, string>): string {
    const dir = mkdtempSync(join(tmpdir(), "sv-prune-"));
    for (const [rel, body] of Object.entries(pages)) {
      const abs = join(dir, rel);
      mkdirSync(join(abs, ".."), { recursive: true });
      writeFileSync(abs, body);
    }
    return dir;
  }

  test("a page carrying our marker, under no wanted id, is an orphan", () => {
    const d = site({ "gone/index.html": `<html><!-- ${MARK} --></html>` });
    expect(prunableDashboards(d, ["beans"])).toEqual([join("gone", "index.html")]);
  });

  test("a page for a WANTED id is never an orphan", () => {
    const d = site({ "beans/index.html": `<html><!-- ${MARK} --></html>` });
    expect(prunableDashboards(d, ["beans"])).toEqual([]);
  });

  test("a page WITHOUT our marker is never touched, even with nothing wanted", () => {
    // The safety argument, as a test. The site holds `guides/`, `reference/`,
    // `assets/`, `api/` and the translated trees — none of them ours. Selecting
    // on the directory instead of the marker would take all of them.
    const d = site({
      "guides/index.html": "<html>hand-authored</html>",
      "reference/index.html": "<html>another generator</html>",
      "assets/index.html": "<html></html>",
    });
    expect(prunableDashboards(d, [])).toEqual([]);
  });

  test("a directory with no index.html at all is not a candidate", () => {
    const d = site({ "stuff/notes.md": "# notes" });
    expect(prunableDashboards(d, [])).toEqual([]);
  });

  test("ours and theirs side by side: only ours is selected", () => {
    const d = site({
      "gone/index.html": `<html><!-- ${MARK} --></html>`,
      "guides/index.html": "<html>hand-authored</html>",
      "beans/index.html": `<html><!-- ${MARK} --></html>`,
    });
    expect(prunableDashboards(d, ["beans"])).toEqual([join("gone", "index.html")]);
  });

  test("a site that does not exist yields nothing rather than throwing", () => {
    expect(prunableDashboards(join(tmpdir(), "sv-prune-absent-xyz"), [])).toEqual([]);
  });

  test("ON THE REAL CORPUS: an empty keep-set selects only pages we wrote", () => {
    // The strongest statement available: ask for the worst case — nothing is
    // wanted — and assert the answer is exactly this generator's own pages,
    // never one of the site's other directories.
    const ours = ["beans", "todos", "qa", "health", "issue-marks", "uploads", "glossary"];
    const selected = prunableDashboards(SITE, []);
    expect(selected.sort()).toEqual(ours.map((g) => join(g, "index.html")).sort());
  });
});


describe("the renderer is chosen by the projection's `$schema`, not by the graph's id", () => {
  // This was `g.id === "beans" ? beans-meta : todo-meta` — a DEFAULT rather
  // than a choice, so every projection that was not beans got the todo
  // renderer. It survived because only two existed. The third (`qa`, bean
  // `py74`) would have mounted the work-plan renderer over a document with no
  // `items` array, and the page would have claimed `live` above a container
  // that rendered nothing — worse than honestly saying `declared`, which is
  // the defect `flh4` already paid for one state over.

  test("the qa page mounts NO work-plan container and declares no src meta", () => {
    const html = read("qa");
    expect(/<div class="fa-workplan" data-fa-workplan>/.test(html)).toBe(false);
    // The bare strings appear in the INLINED renderer's own source, which
    // queries for both. Asserted as the element, the way the sibling test
    // above already learned to.
    expect(/<meta name="fa-(beans|todo)-src"/.test(html)).toBe(false);
  });

  test("beans and todos still get theirs, so the dispatch did not simply stop working", () => {
    expect(/<meta name="fa-beans-src"/.test(read("beans"))).toBe(true);
    expect(/<meta name="fa-todo-src"/.test(read("todos"))).toBe(true);
  });

  test("the qa page renders one panel per family, server-side", () => {
    const html = read("qa");
    for (const fam of ["kg-qa/v1", "qa-witness/v1", "block-qa/v1"]) {
      expect(html).toContain(`<code>${fam}</code>`);
    }
  });

  test("and SAYS there is no total, rather than leaving its absence to be noticed", () => {
    // The ruling is that no cross-family number exists. A reader who finds
    // none and is told nothing will assume the page is unfinished.
    const html = read("qa");
    expect(html).toContain("no total across these families");
    // The three disagreements are named, so the claim is checkable on the page.
    expect(html).toContain("<code>totals</code>");
    expect(html).toContain("<code>counts</code>");
    expect(html).toContain("<code>warn</code>");
  });

  test("both third states are printed even at zero", () => {
    // A count that appears only when non-zero cannot be told from one nobody
    // measured — which is the whole reason this graph had no projection.
    const html = read("qa");
    expect(html).toContain("could not determine");
    expect(html).toMatch(/\d+ would not parse/);
  });
});

describe("the bucket counts are a KPI row, not nested panels", () => {
  // Found by SCREENSHOTTING the page, not by reading the markup: the counts
  // were `.sv-item` cards nested inside the family's own `.sv-item`, so a
  // label and an integer carried the same visual weight as the panel
  // containing them, and nine of them filled half the page.

  test("each count is a stat tile with a value and a label", () => {
    const html = read("qa");
    expect(html).toContain('<ul class="sv-counts">');
    expect(html).toMatch(/<li class="sv-count"><span class="sv-count-v">\d+<\/span><span class="sv-count-k">/);
  });

  test("a count is never a `.sv-item`, which is the registry's card", () => {
    // The regression this guards: reusing `.sv-item` here is what made a
    // bucket look like a peer of the family that contains it.
    const panels = read("qa").split('<h2 class="sv-h2">State graphs')[0] ?? "";
    expect(panels).toContain("sv-count");
    expect(panels).not.toContain('<li class="sv-item">');
  });

  test("no bucket carries a status colour", () => {
    // fail/pass/warn are status words and the status palette is right for them
    // in general. Here it would assert a shared scale across families that
    // deliberately have none — one has `warn`, the other has no concept of it.
    const panels = read("qa").split('<h2 class="sv-h2">State graphs')[0] ?? "";
    expect(panels).not.toMatch(/sv-count[^"]*"[^>]*class="[^"]*is-(declared|live|elsewhere|unresolved)/);
    expect(panels).not.toMatch(/<li class="sv-count"[^>]*style=/);
  });
});

describe("the e2e spec's copy of the marker agrees with the generator's — bean `5wrg`", () => {
  // `state-dashboards.e2e.ts` discovers dashboards by the marker, and CANNOT
  // import it: `state-visualizer.ts` calls `instanceRootFor(import.meta.dir)`
  // at module scope, and `import.meta.dir` is a Bun extension that is
  // `undefined` under Node — which is what Playwright runs specs with.
  //
  // So the string is duplicated, and this checks it. An unavoidable duplicate
  // is fine; an unchecked one is not.

  test("the spec carries the exact marker the generator writes", () => {
    const spec = readFileSync(join(ROOT, "test", "state-dashboards.e2e.ts"), "utf-8");
    expect(spec).toContain(`const MARKER = ${JSON.stringify(GENERATED_BY)};`);
  });

  test("and the marker is really in the pages, so neither copy is hypothetical", () => {
    // Guards the case where both copies agree and both are wrong.
    expect(read("qa")).toContain(GENERATED_BY);
  });
});
