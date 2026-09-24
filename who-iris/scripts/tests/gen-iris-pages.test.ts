/**
 * The generated pages must not depend on directory-read order.
 *
 * `readdirSync` returns entries in whatever order the filesystem gives, and it
 * is not stable across machines. Several of these pages render LISTS of
 * catalogue nodes, so the HTML inherited that order — a generator producing
 * different bytes from identical inputs. It was green on the machine that
 * wrote the pages and `iris:pages:check` was RED in CI, with exactly the two
 * list-rendering pages stale (`index.html`, `community-list.html`) while the
 * four per-node pages passed. That asymmetry is what identified it.
 *
 * This is the ratchet. It asserts the ORDER IN THE RENDERED OUTPUT rather than
 * the sort call, because a test that re-reads the sort is a test that passes
 * the day somebody renders a list from an unsorted copy.
 *
 * @module who-iris/scripts/tests/gen-iris-pages.test
 */
import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { execFileSync, spawnSync } from "child_process";
import { createHash } from "crypto";

import { OWNED, fixedPagesOf, recentOrder, requirementsFromSkill } from "../gen-iris-pages.js";
import { pngSize } from "../gen-covers.js";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const NODES = join(INSTANCE, "catalogue", "nodes");
const DOCS = join(INSTANCE, "docs");
/**
 * The replica is LIBRARY-side since the owner's ruling of 2026-09-21 — the KG
 * and its rendering are served by `cat-harness/library`, the documentation by
 * `cat-harness/docs`. So a test that wants a replica page reads `library/`,
 * and `read()` routes by what the page IS rather than by where it used to be.
 */
const LIB = join(INSTANCE, "library");
// WHICH SIDE A TEST'S PAGE LIVES ON — a different question from what the
// generator OWNS, which is why this is not simply `fixedPagesOf("docs")`.
//
// `index.html` exists on BOTH sides — the replica's home and the docs
// landing. Every test here that names it means the REPLICA's, so it is
// excluded; the docs landing is read explicitly by the one test about it.
// That exclusion is the whole difference, and it is now SUBTRACTED from the
// generator's own list rather than written out again, so adding a docs page
// reaches this router without anybody remembering to edit it.
const DOC_PAGES = new Set(fixedPagesOf("docs").filter((f) => f !== "index.html"));
const sideOf = (page: string): string => (DOC_PAGES.has(page) ? DOCS : LIB);
/** Every rendered page, both sides, as `read()` would resolve them. */
const allHtml = (): string[] => [
  ...readdirSync(LIB).filter((f) => f.endsWith(".html")),
  ...readdirSync(DOCS).filter((f) => f.endsWith(".html")),
];

/** Every node id in the catalogue, sorted the way the generator sorts them. */
function sortedIds(): string[] {
  return readdirSync(NODES)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(NODES, f), "utf-8")).id as string)
    .sort((a, b) => a.localeCompare(b, "en"));
}

/** The item slugs a page links to, in the order it first links to each. */
function itemOrderIn(page: string): string[] {
  const html = readFileSync(join(sideOf(page), page), "utf-8");
  const seen: string[] = [];
  for (const m of html.matchAll(/item-(item-[a-z0-9-]+)\.html/g)) {
    if (!seen.includes(m[1]!)) seen.push(m[1]!);
  }
  return seen;
}

/** The generator's slug function, restated — the PAGES are the subject, not it. */
const slug = (id: string) => id.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

describe("rendered lists are in a deterministic order", () => {
  const expected = sortedIds()
    .filter((id) => id.startsWith("item/"))
    .map(slug);

  it("there are items to order — otherwise everything below passes vacuously", () => {
    expect(expected.length).toBeGreaterThan(1);
  });

  it("community-list.html lists items in catalogue-id order", () => {
    expect(itemOrderIn("community-list.html")).toEqual(expected);
  });

  it("index.html is ordered by ACCESSION, which today coincides with id order", () => {
    // **This assertion is nearly vacuous and says so.** `index.html` became
    // the IRIS home replica and now orders Recent Submissions by
    // `dc.date.accessioned`, descending — a different key from
    // `community-list.html`'s catalogue-id order. On the current three items
    // the two agree by coincidence (2020 > 2014 > 2012 happens to match
    // 18892cf3 < 63e14c27 < b08c6c19), and a fourth item can break that
    // without anything being wrong.
    //
    // Kept, because the coincidence is worth KNOWING about: the day it breaks,
    // this fails and points at the real ratchet rather than leaving somebody to
    // discover that two pages they assumed agreed never had to. The live
    // ordering ratchet is "recent submissions are ordered, and the order is
    // total" below, which asserts against `recentOrder` itself.
    expect(itemOrderIn("index.html")).toEqual(expected);
  });

  it("both pages are each internally deterministic", () => {
    // What the CI failure was actually about: a page rendering a list from an
    // unsorted copy. Asserted per page against its OWN key, not by comparing
    // the two, now that they sort on different ones.
    expect(itemOrderIn("community-list.html")).toEqual(expected);
    expect(new Set(itemOrderIn("index.html")).size).toBe(itemOrderIn("index.html").length);
  });
});

describe("the generator owns its filenames, and prunes only those", () => {
  it("every .html committed under docs/ is one the generator would write", () => {
    // The orphan guard, asserted against the COMMITTED tree rather than a
    // temp dir. Re-keying two items on 2026-09-20 left
    // `item-item-local-*.html` behind — nine files where seven were wanted,
    // two of them serving a record the catalogue no longer describes, and
    // `--check` was blind because it only inspected what it was about to
    // write. This fails if that recurs.
    const html = allHtml();
    expect(html.length).toBeGreaterThan(3);
    const items = sortedIds().filter((id) => id.startsWith("item/")).map((id) => `item-${slug(id)}.html`);
    const colls = sortedIds().filter((id) => id.startsWith("collection/")).map((id) => `collection-${slug(id)}.html`);
    // A SECOND LIST BESIDE `OWNED`, and it has now gone stale in BOTH
    // directions within three days — which is the finding, not the chore.
    //
    // 2026-09-22 (morning): `catalogue.html` was added, written, pruned-checked
    // and gated, and this set still did not know it existed.
    // 2026-09-22 (later, bean `ha78` / issue #886): it MOVED out of who-iris
    // altogether, to the conventional viewer route under the built site, and
    // this set still listed it — so the assertion failed on a page whose
    // absence was the whole point of the change.
    //
    // NOW DERIVED (bean `o6vj`, issue #895). It was a hand-kept list, on the
    // reasoning that `OWNED` is a regex and cannot enumerate — true, and the
    // fix was to export the enumerable part rather than to keep a fourth copy
    // of it. `fixedPagesOf` is the generator's own declaration; the item and
    // collection families are still built from the catalogue here, because
    // those genuinely depend on the data and are what the orphan half of this
    // test is about.
    //
    // This does NOT weaken the assertion into agreeing with any change. The
    // per-side ownership guard now runs inside the generator on every
    // invocation, so a page added to a side that does not own it fails before
    // this test is reached — and what this still pins is that the committed
    // tree holds exactly the pages the declaration says, no more and no less.
    const wanted = new Set([
      ...fixedPagesOf("library"),
      ...fixedPagesOf("docs"),
      ...items,
      ...colls,
    ]);
    expect(html.filter((f) => !wanted.has(f))).toEqual([]);
    expect([...wanted].filter((f) => !html.includes(f))).toEqual([]);
  });

  it("OWNED matches what the generator emits", () => {
    for (const f of allHtml()) {
      expect(OWNED.test(f)).toBe(true);
    }
  });

  it("OWNED spares what the generator did NOT write", () => {
    // The other half, and the one that makes pruning safe to run at all:
    // `deletion-requires-confirmation` is about artefacts an agent did not
    // create, so the pattern must not reach them. Checked by name rather than
    // by deleting anything.
    for (const f of ["hand-authored.html", ".nojekyll", "README.md", "assets", "index.json"]) {
      expect(OWNED.test(f)).toBe(false);
    }
  });
});

describe("ingestion-notes is a projection of the skill, not a copy of it", () => {
  const SKILL = readFileSync(join(INSTANCE, "skills", "iris-dspace.md"), "utf-8");

  it("every requirement in the skill reaches the page", () => {
    // The point of generating the page: a requirement added to the skill and
    // not visible on the page would be a finding captured where nobody who
    // needs it is looking, which is the failure the page exists to prevent.
    const page = readFileSync(join(DOCS, "ingestion-notes.html"), "utf-8");
    const reqs = requirementsFromSkill(SKILL);
    expect(reqs.length).toBeGreaterThan(10);
    for (const r of reqs) expect(page).toContain(`>${r.id}</th>`);
    expect(page).toContain(`<strong>${reqs.length}</strong>`);
  });

  it("refuses rather than rendering an empty table when the source moves", () => {
    // A projection that quietly produces nothing when its source is renamed
    // reports "0 findings", which is indistinguishable from "no problems" and
    // is a lie. It throws instead, and the gate goes red.
    expect(() => requirementsFromSkill("# a skill with no requirements table\n")).toThrow(
      /no .* rows found/,
    );
  });

  it("ids are unique and the numbering has no gaps", () => {
    const ids = requirementsFromSkill(SKILL).map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(ids.map((_, i) => `R${i + 1}`));
  });
});

describe("the IRIS home replica", () => {
  // The REPLICA's home, which is library-side now.
  const home = readFileSync(join(LIB, "index.html"), "utf-8");

  it("carries no WHO emblem and no photograph", () => {
    // The instruction this page exists under: a replica carrying the real mark
    // is indistinguishable from the real site at a glance. Checked by name
    // because the capture ships `who_logo.svg` and it is one copy-paste away.
    expect(home).not.toContain("who_logo");
    expect(home).not.toContain(".jpg");
    expect(home.toLowerCase()).not.toContain("emblem.svg");
  });

  it("shows every committed cover, and each src RESOLVES from the page", () => {
    // INVERTED, not deleted. Its previous form asserted the covers were
    // withheld -- the owner's first ruling of 2026-09-21, that the emblem is
    // *"logo and other branding"*. Asked whether to show them masked, they
    // chose masking, so the assertion turns over and the reason stays visible.
    //
    // Resolving the src is the half that matters. While the covers were
    // withheld the `<img>` was never emitted, so a `src` broken by moving
    // these pages from `docs/` to `library/` (bean `zgba`) sat undetected --
    // two faults stacked, the outer hiding the inner. Containing the filename
    // would have passed throughout. Existing on disk is what would not.
    const covers = readdirSync(LIB).filter((f) => f.endsWith("-cover.png"));
    expect(covers.length).toBeGreaterThan(0);
    for (const c of covers) {
      const m = new RegExp(`<img[^>]*src="([^"]*${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})"`).exec(home);
      expect(m, `no <img> for ${c}`).not.toBeNull();
      expect(existsSync(join(LIB, m![1]!)), `${m![1]} does not resolve from library/`).toBe(true);
    }
  });

  /**
   * Is the PDF backend here? Asked once, the way `gen-covers` asks it.
   *
   * The CI gate job installs `ruff` and nothing else. `gen-covers.ts` carries
   * a paragraph about exactly this — `iris:covers:check` went into that job
   * and "turned the branch red three times" — and the first version of the
   * test below was written anyway, in the same session that read it. It went
   * red on the first CI run for precisely the documented reason.
   */
  const pdfBackend = spawnSync("python3", ["-c", "import pymupdf"]).status === 0;

  it("the emblem is absent from the BYTES, not merely undisplayed", () => {
    // The display flag is not the guarantee. `pdf-cover.py` blanks the region
    // before it computes the digests, so the committed PNG cannot carry the
    // emblem whatever a page decides to do with it.
    //
    // WITHOUT THE BACKEND this degrades to *slightly less* and says so, rather
    // than to could-not-determine — `verifyWithoutRender`'s rule, and the
    // reason it exists: a check reporting `unknown` on every CI run is a check
    // nobody reads. Two of the three claims need no decoder at all.
    //
    // MASK_FILL is spelled here rather than imported: this test's job is to be
    // an independent witness, and a constant shared with the thing it checks
    // agrees with it by construction.
    const nodeDir = join(INSTANCE, "catalogue", "nodes");
    let pixelChecked = 0;
    let declaredChecked = 0;

    for (const f of readdirSync(nodeDir).filter((x) => x.endsWith(".json"))) {
      const n = JSON.parse(readFileSync(join(nodeDir, f), "utf-8"));
      for (const b of n.bitstreams ?? []) {
        for (const r of b.maskedRegions ?? []) {
          const abs = join(INSTANCE, b.materialization.localPath);

          // (1) The bytes on disk are the ones the claim describes. No decoder.
          const sha = createHash("sha256").update(readFileSync(abs)).digest("hex");
          expect(sha, `${b.name}: committed bytes are not the declared ones`).toBe(
            b.materialization.fixity.digest,
          );

          // (2) The rectangle fits the ACTUAL file, read from its IHDR — not
          // from the declaration, which is the thing that could be stale. This
          // is the "measured against a different rendering" defect, and it is
          // checkable with no backend.
          const size = pngSize(readFileSync(abs))!;
          expect(size, `${b.name}: not a readable PNG`).toBeDefined();
          expect(r.x1, `${b.name}: mask runs past the real width`).toBeLessThanOrEqual(size.w);
          expect(r.y1, `${b.name}: mask runs past the real height`).toBeLessThanOrEqual(size.h);
          declaredChecked++;

          // (3) The pixels really are flat fill. Needs a decoder.
          if (!pdfBackend) continue;
          const out = execFileSync("python3", [
            "-c",
            [
              "import pymupdf,sys",
              "p,x0,y0,x1,y1 = sys.argv[1], *map(int, sys.argv[2:6])",
              "pm = pymupdf.Pixmap(p)",
              "pm = pymupdf.Pixmap(pm, 0) if pm.alpha else pm",
              "b,W,n = pm.samples, pm.width, pm.n",
              "cols = {tuple(b[(y*W+x)*n:(y*W+x)*n+3]) for y in range(y0,y1) for x in range(x0,x1)}",
              "print(len(cols), sorted(cols)[0] if cols else ())",
            ].join("\n"),
            abs, String(r.x0), String(r.y0), String(r.x1), String(r.y1),
          ]).toString().trim();
          expect(out, `${b.name}: mask is not a single flat colour`).toMatch(/^1 /);
          expect(out).toContain("128, 128, 128");
          pixelChecked++;
        }
      }
    }

    // A sweep that found nothing must not report clean — the `dh4f` shape.
    expect(declaredChecked, "no masked region found to check").toBeGreaterThan(0);
    if (!pdfBackend) {
      console.log(
        `    (no pymupdf: checked ${declaredChecked} declared region(s) against each file's own ` +
          `IHDR and digest; the flat-fill pixel check was skipped)`,
      );
    } else {
      expect(pixelChecked).toBe(declaredChecked);
    }
  });

  it("states the upstream item count it was given, not a remembered one", () => {
    // The search placeholder is transcribed from the capture -- 273559, no
    // separators, exactly as IRIS prints it -- and it is where this catalogue's
    // item count came from at all.
    const cat = JSON.parse(readFileSync(join(INSTANCE, "catalogue", "catalogue.json"), "utf-8"));
    expect(home).toContain(`repository&rsquo;s ${cat.totalItemsUpstream} items`);
    expect(home).toContain(cat.totalItemsUpstream.toLocaleString("en-US"));
    expect(home).toContain(cat.totalFilesUpstream.toLocaleString("en-US"));
  });

  it("the banner's node count is computed, not written down", () => {
    // It was three literals and one of them went stale the moment a node was
    // added. Asserted against the tree rather than against the generator.
    const n = readdirSync(NODES).filter((f) => f.endsWith(".json")).length;
    expect(home).toContain(`${n} nodes`);
  });

  it("the search box is inert and says so", () => {
    expect(home).toContain("<button type=\"button\" disabled>");
    expect(home).toContain("Disabled.");
  });
});

describe("recent submissions are ordered, and the order is total", () => {
  const items = sortedIds().filter((id) => id.startsWith("item/"));

  it("there is more than one item to order", () => {
    expect(items.length).toBeGreaterThan(1);
  });

  it("the order does not depend on the input order", () => {
    // Same argument as the list-order ratchet above: readdir order already
    // produced a generator emitting different bytes from identical inputs
    // once. A sort with ties is that defect with a smaller blast radius.
    const all = readdirSync(NODES)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(readFileSync(join(NODES, f), "utf-8")))
      .filter((n) => n.flavour === "item");
    const a = recentOrder(all).map((n) => n.id);
    const b = recentOrder(all.slice().reverse()).map((n) => n.id);
    expect(a).toEqual(b);
  });

  it("the page lists them in that order", () => {
    const all = readdirSync(NODES)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(readFileSync(join(NODES, f), "utf-8")))
      .filter((n) => n.flavour === "item");
    expect(itemOrderIn("index.html")).toEqual(recentOrder(all).map((n) => slug(n.id)));
  });
});

describe("the KG-to-portal page keeps its claims honest", () => {
  const page = readFileSync(join(DOCS, "kg-to-portal.html"), "utf-8");

  it("inlines the architecture drawing rather than linking across mount routes", () => {
    // These pages are served from BOTH `/who-iris/` and `/docs/who-iris/`, so
    // a relative path to a file outside this directory resolves under one and
    // 404s under the other. Inlined, there is no path to be wrong.
    expect(page).toContain("<svg");
    expect(page).toContain("GDHCN");
    expect(page).not.toContain("cat-harness/docs/assets");
  });

  it("does not claim a stage this instance has not built", () => {
    // The page's whole value is that it says where who-iris actually is.
    // Package, sign and verify are not built here, and a page that quietly
    // promoted one would be the `xom7` shape: it looks exactly like a working
    // pipeline from in here.
    for (const s of ["Package", "Sign", "Verify"]) {
      const row = new RegExp(`<strong>${s}</strong>[\\s\\S]{0,600}?</tr>`);
      const m = row.exec(page);
      expect(m).not.toBeNull();
      expect(m![0]).toContain("not built");
    }
  });

  it("states the upstream figures from the catalogue, not from prose", () => {
    const cat = JSON.parse(readFileSync(join(INSTANCE, "catalogue", "catalogue.json"), "utf-8"));
    expect(page).toContain(cat.totalItemsUpstream.toLocaleString("en-US"));
    expect(page).toContain(cat.totalFilesUpstream.toLocaleString("en-US"));
  });

  it("says readers are not measured rather than inventing a count", () => {
    // Traffic is bytes x requests and nothing here counts requests. An
    // invented reader count would make every cost figure under it fiction.
    expect(page).toContain("not measured");
  });
});

describe("a phone-width reader never pans sideways — bean `xwrt`", () => {
  it("every committed page lets inline code break rather than widen the page", () => {
    // Mounted verbatim, so the harness's narrow-viewport.css never reaches
    // these pages. Three long code spans made kg-to-portal 566 px wide at a
    // 390 px viewport before the rule was in the generator's own stylesheet.
    const pages = [
      ...readdirSync(DOCS).filter((f) => f.endsWith(".html")).map((f) => join(DOCS, f)),
      ...readdirSync(LIB).filter((f) => f.endsWith(".html")).map((f) => join(LIB, f)),
    ];
    expect(pages.length).toBeGreaterThan(0);
    const missing = pages.filter((p) => !readFileSync(p, "utf-8").includes(":not(pre) > code { overflow-wrap: anywhere; }"));
    expect(missing).toEqual([]);
  });
});
