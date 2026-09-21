/**
 * QA results: one declared home, and two renderings that cannot disagree.
 *
 * The owner's rule, 2026-09-19: *"if the witnesses were generated as a QA
 * reviewer primarily then it should be under `test/results/` as part of a QA
 * process."* Placement follows PROVENANCE — what produced an artefact and why
 * — not its file family and not who fetches it afterwards.
 */
import { describe, expect, it, test } from "bun:test";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { buildQaResult, sourceHashOf, writeQaResult, QA_RESULTS_DIR } from "../qa-results.js";
import { readDeclaration, repoRootFor } from "../../schemas/cat-harness.js";
import { siteDirFor } from "../../schemas/cat-harness.ts";
import { exitCodeFor, verifySiteLinks, type CheckableLink } from "../site-links.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("the results directory is DECLARED, not merely created", () => {
  it("`cat-harness.json` declares `test/results/` as a `qa` graph", () => {
    // The 134 witnesses under `docs/assets/qa/` spent their whole existence
    // undeclared: committed files no declaration mentioned, so a consumer
    // scanning the declared directories saw none of them and reported a clean
    // run over the lot — the `dh4f` defect in reverse. Declaring a directory
    // on the day it is created is the remedy, and this asserts it happened.
    const decl = readDeclaration(ROOT);
    expect(decl).toBeDefined();
    const entry = decl!.directories.find((d) => d.path.replace(/\/+$/, "") === QA_RESULTS_DIR);
    expect(entry).toBeDefined();
    expect(entry!.graphKinds).toContain("qa");
  });

  it("...and the directory it declares actually exists", () => {
    // `AGENTS.md`: "Declare only what exists — a declared-but-absent directory
    // is the bean `dh4f` defect, where a consumer scans nothing and reports a
    // clean run over it." The declaration above is only true if this holds.
    expect(existsSync(join(ROOT, QA_RESULTS_DIR))).toBe(true);
  });
});

describe("the result and the document are two renderings of ONE computation", () => {
  it("every family in the committed result matches the export's own field", async () => {
    // Two computations can disagree; two renderings of one cannot. This is the
    // rule `feature-staging.yml` follows when it copies the `.json` alias AFTER
    // the staging stamp, and the reason `stagingStamp` is one function rather
    // than one per exporter. Asserted against the COMMITTED file, so a drift
    // between what the exporter computes and what was last written is caught.
    const f = join(ROOT, QA_RESULTS_DIR, "kg-export.qa-results.json");
    expect(existsSync(f)).toBe(true);
    const result = JSON.parse(readFileSync(f, "utf-8")) as {
      $schema: string;
      total: number;
      families: Record<string, { count: number; entries: unknown[] }>;
    };
    expect(result.$schema).toBe("qa-results/v1");

    const { buildExport } = await import("../kg-export.js");
    const doc = await buildExport();
    for (const [family, field] of [
      ["undeclaredTerms", doc.undeclaredTerms],
      ["undeclaredSchemaModules", doc.undeclaredSchemaModules],
      ["danglingLinks", doc.danglingLinks],
      ["problems", doc.problems],
    ] as const) {
      expect(result.families[family]).toBeDefined();
      expect(result.families[family]!.entries).toEqual(field as unknown[]);
    }
  });

  it("`total` is the sum, and `count` is never derived on read", () => {
    // A consumer asking only "is this clean" should not have to parse entries
    // whose shape differs per family.
    const r = buildQaResult({
      script: "scripts/demo.ts",
      scriptAbsPath: join(ROOT, "scripts", "kg-export.ts"),
      subject: { kind: "graph", id: "demo.jsonld" },
      families: { a: { summary: "s", entries: [1, 2] }, b: { summary: "s", entries: [] } },
    });
    expect(r.families.a!.count).toBe(2);
    // A determined empty, not an absent answer.
    expect(r.families.b!.count).toBe(0);
    expect(r.total).toBe(2);
  });

  it("families are emitted in sorted order, so a rerun does not churn the diff", () => {
    const r = buildQaResult({
      script: "s", scriptAbsPath: join(ROOT, "scripts", "kg-export.ts"),
      subject: { kind: "graph", id: "d" },
      families: { zeta: { summary: "s", entries: [] }, alpha: { summary: "s", entries: [] } },
    });
    expect(Object.keys(r.families)).toEqual(["alpha", "zeta"]);
  });
});

describe("provenance is never fabricated", () => {
  it("an unreadable producer hashes to `unknown`, not to the empty string", () => {
    // A hash of nothing compares unequal to everything and would read as "the
    // script changed" on every run. Same rule the export follows for a source
    // commit it cannot determine, and the staging stamp for a build that is
    // not happening.
    expect(sourceHashOf(join(ROOT, "no", "such", "file.ts"))).toBe("unknown");
    expect(sourceHashOf(join(ROOT, "scripts", "kg-export.ts"))).toMatch(/^[0-9a-f]{12}$/);
  });
});

describe("the witnesses are committed in one place and published in another", () => {
  const WITNESS_DIR = join(ROOT, QA_RESULTS_DIR, "witnesses");

  it("they live under the declared results tree, not under docs/", () => {
    // Provenance, not consumption: a witness is `qa-witness.ts`'s projection of
    // what a checker found. It sat in `docs/` only because that is where Jekyll
    // could reach it, which is a fact about the build, not about the artefact.
    expect(existsSync(WITNESS_DIR)).toBe(true);

    // NARROWED 2026-09-21. This asserted that `docs/assets/qa/` does not exist
    // AT ALL, as a proxy for "no witnesses under docs/". The proxy stopped
    // being equivalent when bean `py74` published the qa graph's projection
    // there — one generated file, the same shape and the same home as
    // `assets/beans/index.json` and `assets/todos/index.json`, and not a
    // witness.
    //
    // So the guard now asserts what it always meant. A committed witness is
    // any of the three shapes the results tree holds, and finding one here
    // would mean the move had been undone.
    const qaAssets = join(ROOT, siteDirFor(ROOT), "assets", "qa");
    const here = existsSync(qaAssets) ? readdirSync(qaAssets) : [];
    expect(here.filter((f) => f !== "index.json")).toEqual([]);
    expect(here.some((f) => /\.(block|qa|qa-results)\.json$/.test(f))).toBe(false);
  });

  it("BOTH publishing workflows copy them into the site", () => {
    // The failure this exists to prevent is silent and asymmetric. Jekyll
    // builds only `docs/`, so a workflow missing this copy publishes a site
    // where every `data-qa-src` 404s — and an empty QA panel looks exactly
    // like "nothing has been audited", which is the false pass the badges
    // were built to remove. Missing it in ONE workflow is worse still: the
    // docs site and the staging preview would disagree, and the preview is
    // where a reviewer checks.
    for (const wf of ["docs-site.yml", "feature-staging.yml"]) {
      const text = readFileSync(join(repoRootFor(ROOT), ".github", "workflows", wf), "utf-8");
      // Two facts rather than one command line: `-T` so the CONTENTS land in
      // `assets/qa/`, and the destination both workflows must agree on. The
      // SOURCE path moved with the instance and is not what this is about —
      // pinning the whole string made it fail on a correct relocation, the
      // same way `site-links.test.ts` did an hour earlier.
      expect(text).toContain("cp -rT ");
      expect(text).toContain("test/results/witnesses ./_site/assets/qa");
      // The RESULTS too, since bean `2634` took the findings out of the
      // published graph: this file is now the only place a consumer can see
      // what the QA pass found about the document it just fetched.
      expect(text).toContain("*.qa-results.json");
    }
  });

  it("the badges still point at `/assets/qa/`, unchanged by the move", () => {
    // Where a file LIVES and where it is SERVED FROM are different questions.
    // Moving the URL as well would have rewritten every badge in every
    // generated page and the browser code that fetches them, for no gain.
    const page = readFileSync(join(ROOT, siteDirFor(ROOT), "agentic-harness.md"), "utf-8");
    expect(page).toContain("data-qa-src=\"{{ '/assets/qa/");
  });
});

describe("a generated page carries structure, never a verdict", () => {
  /** Every page `gen-docs-pages.ts` writes, read from disk. */
  const pages = () => {
    const dir = join(ROOT, siteDirFor(ROOT));
    const out: Array<{ path: string; text: string }> = [];
    const walk = (d: string, depth: number) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        // `docs/` and `docs/guides/` only — the generator writes nowhere else,
        // and `docs/reference/` holds 153 hand-generated instruction bodies
        // this rule has nothing to say about.
        if (e.isDirectory() && e.name === "guides" && depth === 0) walk(p, depth + 1);
        else if (e.isFile() && e.name.endsWith(".md")) {
          const text = readFileSync(p, "utf-8");
          if (text.includes("fa-qa-badge")) out.push({ path: p, text });
        }
      }
    };
    walk(dir, 0);
    return out;
  };

  it("finds the generated pages at all", () => {
    // The guard on the guard. Every assertion below is a `for` over this list,
    // so an empty one would report a clean run over nothing — the `dh4f`
    // defect this file opens by describing.
    expect(pages().length).toBeGreaterThan(5);
  });

  it("no page names a verdict state", () => {
    // `fa-qa-pass` and friends were written into the markup until bean `d2kp`.
    // A page carrying a verdict goes stale whenever a sweep changes its mind,
    // which made `gen-docs-pages.ts --check` a gate on the CORPUS rather than
    // on whether anybody regenerated — and, because nobody had, published a
    // page saying a knowledge-graph check FAILED on `publication-workflow.md`
    // when it passed.
    //
    // `fa-qa-unswept` is deliberately NOT in this list: whether a sidecar
    // exists is file existence, which is structure, and deferring it to the
    // browser would collapse "nobody checked" into "the fetch found nothing".
    for (const { path, text } of pages()) {
      for (const verdict of ["fa-qa-pass", "fa-qa-fail", "fa-qa-warn", "fa-qa-empty"]) {
        expect({ page: path, carries: verdict, found: text.includes(verdict) }).toEqual({
          page: path,
          carries: verdict,
          found: false,
        });
      }
    }
  });

  it("no page names a count, and every openable badge says it is still loading", () => {
    // The counts line — "0 fail, 0 warn, 10 pass, 0 n/a" — was the other half
    // of the baked-in verdict, and it lived in `title` and `aria-label` where
    // a class-name check would not see it.
    for (const { path, text } of pages()) {
      expect({ page: path, counts: / \d+ fail, \d+ warn,/.test(text) }).toEqual({
        page: path,
        counts: false,
      });
      // Every button starts `pending`, so the state a reader sees before the
      // fetch lands is "not yet known" rather than a guess.
      const buttons = text.match(/<button type="button" class="fa-qa-badge [^"]*"/g) ?? [];
      for (const b of buttons) expect({ page: path, b, pending: b.includes("fa-qa-pending") })
        .toEqual({ page: path, b, pending: true });
    }
  });

  it("every badge that opens names the index it is painted from", () => {
    // The badge and its page's verdict index are emitted together; a button
    // with no `data-qa-index` would sit at `pending` forever, which reads as
    // "loading" and never resolves.
    for (const { path, text } of pages()) {
      for (const m of text.matchAll(/<button type="button" class="fa-qa-badge[\s\S]*?>/g)) {
        for (const attr of ["data-qa-key=", "data-qa-index=", "data-qa-label=", "data-qa-src="]) {
          expect({ page: path, attr, present: m[0].includes(attr) }).toEqual({
            page: path,
            attr,
            present: true,
          });
        }
      }
    }
  });

  it("each page's verdict index exists, and holds a row for every badge on it", () => {
    // The three-state rule, checked where it is cheapest: a badge whose row is
    // missing paints `unknown` — honest, but it is honest about an omission
    // nobody meant to make. `--check` gates the index on existence; this gates
    // its COVERAGE, which existence cannot.
    for (const { path, text } of pages()) {
      const slug = /assets\/qa\/([^/]+)\/qa-index\.json/.exec(text)?.[1];
      if (!slug) continue;
      const idx = join(ROOT, "test", "results", "witnesses", slug, "qa-index.json");
      expect({ page: path, index: idx, there: existsSync(idx) }).toEqual({
        page: path,
        index: idx,
        there: true,
      });
      const badges = JSON.parse(readFileSync(idx, "utf-8")).badges as Record<string, unknown>;
      for (const m of text.matchAll(/data-qa-key="([^"]+)"/g)) {
        expect({ page: path, key: m[1], inIndex: m[1]! in badges }).toEqual({
          page: path,
          key: m[1],
          inIndex: true,
        });
      }
    }
  });
});

describe("the badge URLs resolve against a tree built the way the site is", () => {
  /**
   * `_site` as the publishing workflows assemble it, for the `assets/qa/` part.
   *
   * Both workflows run `cp -rT test/results/witnesses ./_site/assets/qa` AFTER
   * Jekyll, because Jekyll builds only `docs/`. Reproduced here rather than
   * asserted about, because "the workflow contains this string" (which the
   * test above already checks) says nothing about whether the paths the badges
   * ask for land where they ask for them.
   */
  const build = (): string | undefined => {
    const src = join(ROOT, "test", "results", "witnesses");
    if (!existsSync(src)) return undefined;
    const site = mkdtempSync(join(tmpdir(), "qa-site-"));
    cpSync(src, join(site, "assets", "qa"), { recursive: true });
    return site;
  };

  it("every URL a badge fetches is present in the built tree", () => {
    const site = build();
    // Three states. An absent witness tree is `unknown` — `exitCodeFor` maps
    // that to 2, distinct from the 1 it gives a link positively established as
    // dead, and a checkout with no build in it must not read as a wall of dead
    // links. Here it is a hard failure because the tree IS committed; the
    // distinction is kept so the reason a run failed is legible.
    expect({ builtTree: site !== undefined }).toEqual({ builtTree: true });

    // `CheckableLink`, not `SiteLink`. `SiteLink.id` is a closed union of the
    // three navbar tile keys `docs-ui.js` looks a tile up by, and a QA badge
    // URL is not a tile — tsc said so, correctly, and the fix was to split the
    // checker's input type out rather than to cast past it. A cast would have
    // made this file compile while asserting against a value the production
    // type says cannot occur, which is the same shape as the defect this whole
    // PR removes.
    const links: CheckableLink[] = [];
    const seen = new Set<string>();
    const dir = join(ROOT, siteDirFor(ROOT));
    const scan = (d: string, depth: number) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory() && e.name === "guides" && depth === 0) scan(p, depth + 1);
        else if (e.isFile() && e.name.endsWith(".md")) {
          const text = readFileSync(p, "utf-8");
          // The Liquid the generator emits, resolved the way Jekyll resolves
          // it: `relative_url` prepends the baseurl, and `_site` IS the
          // baseurl's root, so the path under `_site` is what is inside the
          // quotes with its leading slash dropped.
          for (const m of text.matchAll(/data-qa-(?:index|src)="\{\{ '\/([^']+)' \| relative_url \}\}"/g)) {
            if (seen.has(m[1]!)) continue;
            seen.add(m[1]!);
            links.push({ id: `${e.name}:${m[1]}`, target: m[1]! });
          }
        }
      }
    };
    scan(dir, 0);

    // Named, not counted: `toHaveLength(279)` breaks on the next page added
    // and says nothing about what is missing.
    expect(seen.has("assets/qa/publication-workflow/qa-index.json")).toBe(true);
    expect(seen.has("assets/qa/publication-workflow/overview.block.json")).toBe(true);
    expect(links.length).toBeGreaterThan(100);

    const verdicts = verifySiteLinks(site!, links);
    const bad = verdicts.filter((v) => v.verdict !== "ok").map((v) => v.detail);
    expect(bad).toEqual([]);
    expect(exitCodeFor(verdicts)).toBe(0);

    rmSync(site!, { recursive: true, force: true });
  });

  it("no published path is `_`-prefixed, which Pages strips without `.nojekyll`", () => {
    // The index was `_qa-index.json` for exactly one commit. GitHub Pages
    // removes `_`-prefixed paths unless `.nojekyll` is present, and this tree
    // is copied into `_site` after Jekyll has run — so a strip would 404 every
    // index and paint every badge on the site `could not determine`. Honest,
    // and useless. `.nojekyll` is on `gh-pages` today; not depending on it is
    // cheaper than depending on it.
    const walk = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(d, e.name)) : [e.name],
      );
    const underscored = walk(join(ROOT, "test", "results", "witnesses")).filter((n) =>
      n.startsWith("_"),
    );
    expect(underscored).toEqual([]);
  });
});

/**
 * A result whose findings did not change is not rewritten.
 *
 * `updated_at` moves on every run, so an unconditional write made EVERY QA
 * producer dirty the working tree whenever anybody ran it. That is not a
 * tidiness complaint: these sidecars exist so a reviewer can tell "this
 * finding is new" from "this finding was already there", and a file that
 * always appears changed has given up the property it was created to have.
 */
describe("writeQaResult does not churn", () => {
  function result(entries: unknown[], when: string) {
    return buildQaResult({
      script: "scripts/x.ts",
      scriptAbsPath: join(import.meta.dir, "../../package.json"),
      subject: { kind: "t", id: "t" },
      families: { f: { summary: "s", entries } },
      now: new Date(when),
    });
  }

  test("identical findings leave the file untouched, timestamp and all", () => {
    const root = mkdtempSync(join(tmpdir(), "qa-churn-"));
    const p = writeQaResult(root, "x", result([], "2026-01-01T00:00:00.000Z"));
    const first = readFileSync(p, "utf-8");

    // A LATER timestamp, same findings. The whole point: a re-run must not
    // rewrite, and must not quietly rewrite with the old timestamp either —
    // that would be equally clean and would misreport the bytes as
    // reconsidered.
    writeQaResult(root, "x", result([], "2026-06-01T00:00:00.000Z"));
    expect(readFileSync(p, "utf-8")).toBe(first);
    expect(first).toContain("2026-01-01");
  });

  test("CHANGED findings do rewrite, and the timestamp moves with them", () => {
    // The guard must not be a freeze. The timestamp answers "when were these
    // findings established", so it moves when they do.
    const root = mkdtempSync(join(tmpdir(), "qa-churn-"));
    const p = writeQaResult(root, "x", result([], "2026-01-01T00:00:00.000Z"));
    writeQaResult(root, "x", result([{ finding: "new" }], "2026-06-01T00:00:00.000Z"));
    const after = readFileSync(p, "utf-8");
    expect(after).toContain("2026-06-01");
    expect(after).toContain("new");
  });

  test("an unreadable previous result is replaced, not skipped", () => {
    // "Could not tell" resolves to WRITE here, which is the opposite of the
    // log sweep's rule and right for the same reason: the risk is a stale
    // verdict surviving, not a good one being lost.
    const root = mkdtempSync(join(tmpdir(), "qa-churn-"));
    const p = writeQaResult(root, "x", result([], "2026-01-01T00:00:00.000Z"));
    writeFileSync(p, "{ not json");
    writeQaResult(root, "x", result([], "2026-06-01T00:00:00.000Z"));
    expect(readFileSync(p, "utf-8")).toContain("2026-06-01");
  });
});
