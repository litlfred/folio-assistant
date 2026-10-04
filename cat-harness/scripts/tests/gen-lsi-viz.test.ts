/**
 * The LSI viewer page works for its reader: every unit it names is a file in
 * this checkout, every index it reads has its section, every declared prose
 * graph has a verdict row, and every table row has the columns its header
 * promises.
 *
 * Drawn over a FIXTURE index, never over the committed `test/results/lsi/`
 * (bean `cxcn`, reader audit F7 R69): that corpus is leaving `main` for the
 * `qa-reports` branch, and a test that reads it fails for a reason that is not
 * a defect once it has gone. Whether the committed PAGE matches the committed
 * indexes is `lsi:viz:check`'s question — a gate, which reads the checkout or
 * the branch and says UNKNOWN on a miss — and it is not re-asked here.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderCommitted, renderFrom, type IndexesRead } from "../gen-lsi-viz.ts";
import { INDEX_DIR, proseGraphs, sourceFromFiles, type LsiSidecar } from "../lsi.ts";

const REPO = resolve(import.meta.dir, "../../..");

/** Two real skill files, so "every unit it names is a file" has something true to check. */
const UNIT_A = "cat-harness/skills/sdlc/sdlc-core/qa-reports.md";
const UNIT_B = "cat-harness/skills/sdlc/sdlc-core/qa-witness.md";

const FIXTURE: LsiSidecar = {
  $schema: "folio-lsi-index/v1",
  method: "cat-harness/methodologies/lsi.md",
  instance: "fixture-instance",
  graph: "fixture-graph",
  path: "cat-harness/skills",
  docs: null,
  fingerprint: "0".repeat(64),
  options: { k: 2, weighting: "log-entropy", minDf: 2, maxDfShare: 0.5, powerIterations: 4, seed: 1990 },
  units: 2,
  terms: 3,
  k: 2,
  retained: 0.5,
  dimensions: [
    { dim: 1, sigma: 2.5, positive: ["qa", "branch"], negative: [] },
    { dim: 2, sigma: 1.25, positive: ["witness"], negative: ["store|pipe"] },
  ],
  findings: {
    nearDuplicates: [{ a: UNIT_A, b: UNIT_B, cosine: 0.97 }],
    narrowDimensions: [{ dim: 2, units: [UNIT_B] }],
  },
  neighbours: {},
};

const FIXTURE_PATH = `${INDEX_DIR}/fixture-instance/fixture-graph.lsi.json`;
const read: IndexesRead = {
  state: "hit",
  from: "a fixture",
  files: [join(REPO, FIXTURE_PATH)],
  src: sourceFromFiles(new Map([[FIXTURE_PATH, JSON.stringify(FIXTURE)]])),
};
const drawn = renderFrom(read);
const page = drawn.state === "hit" ? drawn.page : "";

describe("the LSI viewer page", () => {
  test("a miss is returned with its reason, never drawn as an empty page", () => {
    const miss = renderFrom({ state: "miss", reason: "no lsi/ in this entry" });
    expect(miss).toEqual({ state: "miss", reason: "no lsi/ in this entry" });
  });

  test("a hit is drawn", () => {
    expect(drawn.state).toBe("hit");
    expect(page.length).toBeGreaterThan(0);
  });

  test("has a section for every index it read", () => {
    expect(page).toContain("## " + FIXTURE.instance + " / " + FIXTURE.graph);
  });

  // Bean `tqjj`. The "committed indexes" and "units indexed" tiles are GONE:
  // both moved whenever any file was added to any indexed graph, which is the
  // `y7b3` class and cost 319 of the last 400 commits on `main`. What is
  // asserted instead is the property that replaced them — the committed page
  // is a function of the TREE, so it reads the same with and without an index
  // to hand, and only `--detail` adds anything that an index's content moves.
  test("the committed page carries no value an index's content moves", () => {
    const committed = renderCommitted();
    for (const n of [FIXTURE.units, FIXTURE.terms].map(String)) {
      expect(committed).not.toContain("<b>" + n + "</b>");
    }
    expect(committed).not.toContain("committed indexes");
    expect(committed).not.toContain("units indexed");
    expect(committed).not.toContain("## " + FIXTURE.instance + " / " + FIXTURE.graph);
    expect(committed).not.toContain(FIXTURE.fingerprint);
  });

  test("the committed page is the same whether or not an index is to hand", () => {
    // `renderCommitted` takes no source, which is the point: there is no
    // argument by which a container holding a working copy could get a
    // different page from a fresh CI checkout (module docblock, bean `in5a`).
    expect(renderCommitted()).toBe(renderCommitted());
    expect(renderCommitted().length).toBeLessThan(page.length);
  });

  test("the freshness column exists only with --detail", () => {
    expect(page).toContain("| graph | needs one | verdict | detail |");
    expect(renderCommitted()).toContain("| graph | needs one |");
    expect(renderCommitted()).not.toContain("| verdict |");
  });

  test("has a verdict row for every declared prose graph", () => {
    const graphs = proseGraphs();
    expect(graphs.length).toBeGreaterThan(0);
    for (const t of graphs) expect(page).toContain("| `" + t.instance + "/" + t.id + "` |");
  });

  test("every unit it names is a file in this checkout", () => {
    const named = [...page.matchAll(/`([^`\s]+\/sections\/[^`\s]+\.md|[^`\s]+\.md)`/g)].map((m) => m[1]).filter((p) => p.includes("/"));
    expect(named).toContain(UNIT_A);
    for (const p of named) if (!p.startsWith("scripts/")) expect(existsSync(join(REPO, p!))).toBe(true);
  });

  test("a dimension with no negative pole is flagged as a margin, not a theme", () => {
    expect(page).toContain("Dimension 1 has **no negative pole**");
  });

  test("every table row has as many cells as its header — a `|` in a term is escaped", () => {
    expect(page).toContain("store\\|pipe");
    let cols = 0;
    for (const line of page.split("\n")) {
      if (!line.startsWith("|")) { cols = 0; continue; }
      const cells = line.replace(/\\\|/g, "").split("|").length - 2;
      if (cols === 0) cols = cells;
      else expect(cells).toBe(cols);
    }
  });
});
