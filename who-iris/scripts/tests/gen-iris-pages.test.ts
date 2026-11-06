/**
 * The pages `gen-iris-pages.ts` writes: the docs pages, the catalogue page's
 * inputs, the library's withheld list, and since 2026-10-30 the one page
 * left of the IRIS replica: its home page.
 *
 * @module who-iris/scripts/tests/gen-iris-pages.test
 */
import { describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { execFileSync, spawnSync } from "child_process";
import { createHash } from "crypto";

import {
  OWNED,
  authoredDocs,
  renderAuthored,
  SITE_LOCALES,
  SITE_STRINGS,
  catalogueProblems,
  fixedPagesOf,
  requirementsFromSkill,
  rebaseToOwnSiteRoot,
} from "../gen-iris-pages.js";
import { coverNodes as nodesOf, pngSize, publicationBlockers } from "../../platform.ts";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const DOCS = join(INSTANCE, "docs");
/**
 * The replica is in `site/` since bean `2b5s` (2026-09-30, the owner's
 * *"site/ + publish covers"*); it was library-side from 2026-09-21 until then.
 * `library/` is the CORPUS only — the covers and `withheld.json` the replica
 * reads — so a test that wants a replica page reads `site/`, and `read()`
 * routes by what the page IS rather than by where it used to be.
 */
const SITE = join(INSTANCE, "site");
const LIB = join(INSTANCE, "library");
/** Every rendered page, both sides, as `read()` would resolve them. */
const allHtml = (): string[] => [
  ...readdirSync(SITE).filter((f) => f.endsWith(".html")),
  ...readdirSync(DOCS).filter((f) => f.endsWith(".html")),
];

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
    // Since 2026-10-30 site/ holds only the replica's home page; the item,
    // collection and community pages are gone and their addresses 404.
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
      "index.html",
      ...fixedPagesOf("docs"),
      // The renderings of the authored pages (bean `mw5z`), derived the way the generator derives them.
      ...authoredDocs(DOCS).map((d) => d.file.replace(/\.md$/, ".html")),
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
  // The REPLICA's home, which is in `site/` now (bean `2b5s`).
  const home = readFileSync(join(SITE, "index.html"), "utf-8");

  it("carries no WHO emblem and no photograph", () => {
    // The instruction this page exists under: a replica carrying the real mark
    // is indistinguishable from the real site at a glance. Checked by name
    // because the capture ships `who_logo.svg` and it is one copy-paste away.
    expect(home).not.toContain("who_logo");
    expect(home).not.toContain(".jpg");
    expect(home.toLowerCase()).not.toContain("emblem.svg");
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
});

describe("the KG-to-portal page keeps its claims honest", () => {
  const page = readFileSync(join(DOCS, "kg-to-portal.html"), "utf-8");

  it("inlines the architecture drawing rather than linking across mount routes", () => {
    // These pages are served from BOTH `/who-iris/` and `/docs/who-iris/`, so
    // a relative path to a file outside this directory resolves under one and
    // 404s under the other. Inlined, there is no path to be wrong.
    expect(page).toContain("<svg");
    expect(page).toContain("did:web");
    expect(page).not.toContain("cat-harness/docs/assets");
  });

  it("names WHO's signing DID via did:web + x5c as the trust anchor, not a GDHCN trust list (#104)", () => {
    expect(page).toContain("WHO signing DID — did:web + x5c chain");
    expect(page).toContain("publicKeyJwk.x5c");
    expect(page).toContain("No GDHCN trust list is assumed.");
    expect(page).not.toContain("The trust anchor is to be <strong>GDHCN</strong>");
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
    // docs/ only: site/ holds nothing but the retired replica's redirects.
    const pages = readdirSync(DOCS).filter((f) => f.endsWith(".html")).map((f) => join(DOCS, f));
    expect(pages.length).toBeGreaterThan(0);
    const missing = pages.filter((p) => !readFileSync(p, "utf-8").includes(":not(pre) > code { overflow-wrap: anywhere; }"));
    expect(missing).toEqual([]);
  });
});

describe("every generated page carries the Do not hand-edit marker — bean `7te5`", () => {
  it("every committed page in docs/ carries the generator banner", () => {
    const pages = readdirSync(DOCS).filter((f) => f.endsWith(".html")).map((f) => join(DOCS, f));
    expect(pages.length).toBeGreaterThan(0);
    const missing = pages.filter((p) => !readFileSync(p, "utf-8").includes("Do not hand-edit: the next run overwrites it"));
    expect(missing).toEqual([]);
  });
});

describe("library/ is the corpus only — bean 2b5s", () => {
  it("holds no page, so no mount copies it", () => {
    // `mount-instance-docs.ts` mounts a directory that carries an index.html
    // and copies all of it. An index.html here is what published 1,367
    // corpus sidecars at two routes; the generator's sweep prunes one, and
    // this is the committed tree agreeing.
    expect(readdirSync(LIB).filter((f) => f.endsWith(".html"))).toEqual([]);
  });
});

describe("library/withheld.json is the catalogue's gates, for the mount — bean cw35", () => {
  const w = JSON.parse(readFileSync(join(LIB, "withheld.json"), "utf-8")) as { paths: { path: string }[] };
  const listed = new Set(w.paths.map((p) => p.path));
  const items = nodesOf(INSTANCE).filter((n) => n.libraryId);
  const originalBlocked = (n: (typeof items)[number]) =>
    (n.bitstreams ?? []).some(
      (b) => b.bundle === "ORIGINAL" && b.materialization?.state === "materialized" && publicationBlockers(b.materialization?.gates).length > 0,
    );

  it("withholds every item whose original's publication gates block, and no other", () => {
    const blocked = items.filter(originalBlocked);
    const open = items.filter((n) => !originalBlocked(n));
    expect(open.length, "no publishable item — the assertion below is vacuous").toBeGreaterThan(0);
    for (const n of blocked) expect(listed.has(`${n.libraryId}/`), `${n.libraryId} should be withheld`).toBe(true);
    for (const n of open) expect(listed.has(`${n.libraryId}/`), `${n.libraryId} is publishable and must not be withheld`).toBe(false);
  });

  it("every withheld path exists under library/ — a stale entry would hide nothing", () => {
    for (const p of listed) expect(existsSync(join(LIB, p)), `${p} is listed but absent`).toBe(true);
  });
});

describe("the replica in the six UN languages — issue #2228", () => {
  it("every catalogue is complete, unfuzzy and keeps its placeholders and markup", () => {
    expect(SITE_STRINGS.length).toBeGreaterThan(0);
    expect(catalogueProblems().problems).toEqual([]);
  });
});

/**
 * The site root the pages derive in the browser, read back out of a page as
 * it ships — not out of the generator's constant, so the test fails if the
 * page and the source ever disagree.
 *
 * The last two rows are the case that broke: this instance's OWN site, served
 * from a repository also named `who-iris`, where a lazy match stopped at the
 * base path and every PDF frame asked the host root for the viewer (a 404 the
 * owner hit on the live site, 2026-10-09). Read from a docs page since the
 * replica's item pages went (2026-10-30); the docs pages carry the same pattern.
 */
describe("the page finds its site root on every host it is served from", () => {
  const html = readFileSync(join(DOCS, "ingestion-notes.html"), "utf-8");
  const m = /new RegExp\(("(?:[^"\\]|\\.)*")\)/.exec(html);
  it("a page carries the pattern", () => expect(m).not.toBeNull());
  const re = new RegExp(JSON.parse(m![1]!) as string);
  const rows: [string, string][] = [
    ["/who-iris/item-x.html", "/"],
    ["/docs/who-iris/ingestion-notes.html", "/"],
    ["/folio-assistant/who-iris/item-x.html", "/folio-assistant/"],
    ["/STAGING/branch/who-iris/item-x.html", "/STAGING/branch/"],
    ["/who-iris/who-iris/item-x.html", "/who-iris/"],
    ["/who-iris/who-iris/fr/item-x.html", "/who-iris/"],
    ["/who-iris/docs/who-iris/ingestion-notes.html", "/who-iris/"],
  ];
  for (const [path, root] of rows) it(`${path} → ${root}`, () => expect(path.match(re)?.[1]).toBe(root));
});

describe("the docs landing page lists the authored pages it does not generate (bean mw5z)", () => {
  it("derives them from the directory: titled by first heading; README and front-matter pages left out", () => {
    const d = mkdtempSync(join(tmpdir(), "iris-docs-"));
    writeFileSync(join(d, "README.md"), "# The directory\n");
    writeFileSync(join(d, "site-home.md"), "---\nlayout: default\n---\n# Home\n");
    writeFileSync(join(d, "style-guide.md"), "# The WHO style guide\n\nText.\n");
    writeFileSync(join(d, "notes.md"), "No heading here.\n");
    writeFileSync(join(d, "index.html"), "<h1>x</h1>");
    expect(authoredDocs(d)).toEqual([
      { file: "notes.md", title: "notes" },
      { file: "style-guide.md", title: "The WHO style guide" },
    ]);
  });

  it("every authored page is rendered, and the committed landing page links the rendering (owner's option 1)", () => {
    const docs = join(import.meta.dir, "..", "..", "docs");
    const index = readFileSync(join(docs, "index.html"), "utf-8");
    for (const d of authoredDocs(docs)) {
      const html = d.file.replace(/\.md$/, ".html");
      expect(existsSync(join(docs, html))).toBe(true);
      expect(index).toContain(`href="${html}"`);
      expect(index).not.toContain(`href="${d.file}"`);
    }
  });

  it("renders GFM tables and points sibling .md links at their renderings, leaving other links alone", () => {
    const html = renderAuthored("# T\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n[s](style-guide.md#x) [o](../library/README.md)\n", new Set(["style-guide.md"]), null);
    expect(html).toContain("<table>");
    expect(html).toContain('href="style-guide.html#x"');
    expect(html).toContain('href="../library/README.md"');
  });

  it("cites a file OUTSIDE docs/ by repository, since only docs/ is published (who-iris's own site)", () => {
    const html = renderAuthored(
      "[o](../library/README.md#a) [v](../skills/voices/) [g](../../AGENTS.md)\n",
      new Set(),
      "example/who-iris",
    );
    expect(html).toContain('href="https://github.com/example/who-iris/blob/HEAD/library/README.md#a"');
    expect(html).toContain('href="https://github.com/example/who-iris/tree/HEAD/skills/voices/"');
    // Climbing out of the instance is a source defect, left for the site's link check to report.
    expect(html).toContain('href="../../AGENTS.md"');
  });
});

describe("the catalogue page (bean kx0p)", () => {
  it("lists the held nodes first, labels each gate count inside its pill, and links no viewer on a site without one", async () => {
    const { catalogueViewer } = await import("../gen-iris-pages.ts");
    const { readdirSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const dir = join(import.meta.dir, "..", "..", "catalogue", "nodes");
    const all = readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(readFileSync(join(dir, f), "utf-8")));
    const page = catalogueViewer(all, { libraryViewer: false });
    const every = page.slice(page.indexOf('id="ic-nodes"'));
    const states = [...every.matchAll(/<td><span class="state ([a-z]+)">/g)].map((m) => m[1]);
    expect(states.length).toBe(all.length);
    const order = ["materialized", "referenced", "unknown"];
    expect(states).toEqual([...states].sort((a, b) => order.indexOf(a!) - order.indexOf(b!)));
    expect(states[0]).toBe("materialized"); // not vacuous: who-iris holds items
    const gates = page.slice(page.indexOf('id="ic-gates"'), page.indexOf('id="ic-nodes"'));
    expect(gates).toMatch(/<span class="state [a-z]+">[a-zA-Z]+: \d+ of \d+<\/span>/);
    expect(gates).not.toMatch(/<\/span> \d/);
    expect(page).not.toContain("library/who-iris/#");
    expect(catalogueViewer(all)).toContain("library/who-iris/#"); // the harness site's build keeps the viewer links
  });
});

describe("the replica keeps only its IRIS-style home page (owner, 2026-10-30)", () => {
  const home = (): string => readFileSync(join(SITE, "index.html"), "utf-8");

  it("each language has a home page and nothing else: the item, collection and community pages are gone", () => {
    expect(readdirSync(SITE).filter((f) => f.endsWith(".html"))).toEqual(["index.html"]);
    for (const loc of SITE_LOCALES) expect(readdirSync(join(SITE, loc)).filter((f) => f.endsWith(".html"))).toEqual(["index.html"]);
  });

  it("each held item links to its library entry page, and no link names a retired page", () => {
    const items = readdirSync(join(INSTANCE, "catalogue", "nodes"))
      .map((f) => JSON.parse(readFileSync(join(INSTANCE, "catalogue", "nodes", f), "utf-8")) as { flavour?: string; libraryId?: string })
      .filter((n) => n.flavour === "item" && n.libraryId && existsSync(join(LIB, n.libraryId)));
    expect(items.length).toBeGreaterThan(0);
    for (const n of items) expect(home()).toContain(`href="../en/cat-harness/library/who-iris/${n.libraryId}/"`);
    expect(home()).not.toMatch(/href="(?:item-|collection-|community-list)/);
    expect(home()).toContain('href="../who-iris/catalogue/"');
  });

  it("written for the instance's own site root, its links are said from there", () => {
    const html = rebaseToOwnSiteRoot('<a href="../who-iris/catalogue/">c</a><a href="index.html">h</a><a href="fr/index.html">fr</a><a href="../en/cat-harness/library/who-iris/x/">x</a><img src="../library/x-cover.png">');
    expect(html).toBe('<a href="catalogue/">c</a><a href="./">h</a><a href="who-iris/fr/index.html">fr</a><a href="en/cat-harness/library/who-iris/x/">x</a><img src="library/x-cover.png">');
  });

  it("re-bases the links the page carries as JSON, so the rail's \"On this page\" list resolves", () => {
    const html = rebaseToOwnSiteRoot(
      '<script type="application/json" data-fa-visualiser-nav>[{"label":"Home","href":"index.html"},' +
        '{"label":"Community List","href":"../who-iris/catalogue/"},{"label":"x","href":"../en/cat-harness/library/who-iris/x/"},' +
        '{"label":"ext","href":"https://example.org/"}]</script>',
    );
    expect(html).toContain('"href":"./"');
    expect(html).toContain('"href":"catalogue/"');
    expect(html).toContain('"href":"en/cat-harness/library/who-iris/x/"');
    expect(html).toContain('"href":"https://example.org/"');
    expect(html).not.toContain('"href":"../');
  });
});
