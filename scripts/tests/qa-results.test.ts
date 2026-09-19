/**
 * QA results: one declared home, and two renderings that cannot disagree.
 *
 * The owner's rule, 2026-09-19: *"if the witnesses were generated as a QA
 * reviewer primarily then it should be under `test/results/` as part of a QA
 * process."* Placement follows PROVENANCE — what produced an artefact and why
 * — not its file family and not who fetches it afterwards.
 */
import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { buildQaResult, sourceHashOf, QA_RESULTS_DIR } from "../qa-results.js";
import { readDeclaration } from "../../schemas/cat-harness.js";

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
    expect(entry!.graphs).toContain("qa");
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
    expect(existsSync(join(ROOT, "docs", "assets", "qa"))).toBe(false);
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
      const text = readFileSync(join(ROOT, ".github", "workflows", wf), "utf-8");
      expect(text).toContain("cp -rT test/results/witnesses ./_site/assets/qa");
    }
  });

  it("the badges still point at `/assets/qa/`, unchanged by the move", () => {
    // Where a file LIVES and where it is SERVED FROM are different questions.
    // Moving the URL as well would have rewritten every badge in every
    // generated page and the browser code that fetches them, for no gain.
    const page = readFileSync(join(ROOT, "docs", "agentic-harness.md"), "utf-8");
    expect(page).toContain("data-qa-src=\"{{ '/assets/qa/");
  });
});
