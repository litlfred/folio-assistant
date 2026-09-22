/**
 * The processes index must be true before it is useful.
 *
 * Bean `prhr`. Owner, 2026-09-21: *"we also need a processes/ visualization as
 * it is controlled.... its basically a bpmn searcher tool or so."*
 *
 * ## Three defects this file pins, all committed during its own construction
 *
 * 1. **It swept nothing and called that success.** `workflowFiles` takes an
 *    INSTANCE root; handed the repository root it returns `[]`. The first run
 *    printed *"Wrote processes-index.md — 0 diagram(s)"* and exited 0, over a
 *    corpus of 62. The `dh4f` shape, produced by the generator written to
 *    report it.
 * 2. **It claimed a gap that was not there.** The SVG path was composed from
 *    each `.bpmn`'s own location rather than from the docs layer
 *    `render:bpmn` writes to, so it reported **11 of 62** diagrams as
 *    unrendered — all 8 CRDM and all 3 bootstrap. Every one of those SVGs
 *    exists, and `render:bpmn:check` was green throughout. A finding that
 *    contradicts a passing gate is a finding to verify, not to publish.
 * 3. **It measured with a regex.** The first corpus pass found **30**
 *    `folio:bean` ops; there are **49**. Two legal markup variants were
 *    missed: a `store=` attribute before `op=`, and attributes wrapped onto
 *    the next line. The generator now consumes `loadProcessModel`, the same
 *    bpmn-moddle parse the engine runs.
 *
 * @module cat-harness/scripts/tests/processes-viz.test
 */
import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { docsLayers } from "../compose-docs.js";
import { page, pageRelPath, processRows, skillToProcesses } from "../gen-processes-viz.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");
/** The base docs layer — asked, never spelled; `site-dir-single-answer` refuses a literal. */
const DOCS = docsLayers(REPO).layers.find((l) => !l.repositoryScoped)!.dir;

const rows = await processRows(REPO);

describe("the sweep actually swept", () => {
  it("finds diagrams at all", () => {
    // DEFECT 1, pinned. This is the assertion whose absence let a generator
    // report a clean run over 62 files it never opened.
    expect(rows.length).toBeGreaterThan(0);
  });

  it("reaches MORE THAN ONE instance", () => {
    // `workflowFiles` resolves one instance's declared graph plus its
    // dependencies'. `bootstrap` declares its own diagrams and `cat-harness`
    // does not reach them, so a single-root index omits them silently — which
    // is a quieter version of the same defect.
    expect(new Set(rows.map((r) => r.group.split("/")[0])).size).toBeGreaterThan(1);
  });

  it("indexes no decision tables", () => {
    // `.dmn` is a different kind — a table a gateway computes from, with no
    // lanes, skills or activities. Counting them would inflate every number.
    for (const r of rows) expect(r.file.endsWith(".bpmn")).toBe(true);
  });
});

describe("a gap it reports is a gap that exists", () => {
  it("every diagram named as unrendered really has no SVG", () => {
    // DEFECT 2, pinned, in the direction that went wrong. Claiming a missing
    // SVG that is present teaches a reader to discount the whole Findings
    // section.
    for (const r of rows.filter((x) => x.svg === undefined)) {
      const guess = join(DOCS, "assets/img/workflows", `${basename(r.file, ".bpmn")}.svg`);
      expect(existsSync(guess), `${r.file}: reported unrendered, but ${guess} exists`).toBe(false);
    }
  });

  it("and every SVG it names is on disk", () => {
    for (const r of rows) {
      if (r.svg === undefined) continue;
      expect(existsSync(join(REPO, r.svg)), `${r.file}: names ${r.svg}, which is absent`).toBe(true);
    }
  });

  it("a diagram that will not load is reported, never dropped", () => {
    // Omission shrinks every denominator on the page and makes a broken
    // diagram read as one that does not exist.
    for (const r of rows.filter((x) => x.loadError !== undefined)) {
      expect(r.loadError!.length).toBeGreaterThan(0);
      expect(page(rows)).toContain(basename(r.file));
    }
  });
});

describe("the joins are the point", () => {
  const join_ = skillToProcesses(rows);

  it("every skill named by an activity is reachable from the index", () => {
    expect(join_.size).toBeGreaterThan(0);
    const named = new Set(rows.flatMap((r) => r.skills));
    expect([...named].filter((s) => !join_.has(s))).toEqual([]);
  });

  it("the reverse join names files, so two processes running one skill both show", () => {
    const shared = [...join_.values()].filter((fs) => fs.length > 1);
    expect(shared.length, "no skill is run by more than one process — is the join collapsing?").toBeGreaterThan(0);
  });

  it("bean ops come from the parser, not a regex over the text", () => {
    // DEFECT 3, pinned by its consequence: the regex undercounted by 19, so a
    // parser-backed total must EXCEED what a naive `<folio:bean op=` scan finds
    // across the same corpus.
    const parsed = rows.reduce((a, r) => a + r.beanOps.length, 0);
    const naive = rows.reduce((a, r) => {
      const text = readFileSync(join(REPO, r.file), "utf-8");
      return a + new Set([...text.matchAll(/<folio:bean\s+op="([^"]*)"/g)].map((m) => m[1]!)).size;
    }, 0);
    expect(parsed).toBeGreaterThanOrEqual(naive);
  });
});

describe("declared and defaulted are different facts", () => {
  it("reports both, and does not merge them", () => {
    // `loadProcessModel` reads an undeclared policy as `strict`, correctly for
    // the engine. A reader wants to know which of those 22-plus-24 was
    // somebody's decision.
    const html = page(rows);
    expect(html).toContain("| enforcement | declared | defaulted |");
    expect(rows.some((r) => !r.enforcementDeclared)).toBe(true);
    expect(rows.some((r) => r.enforcementDeclared)).toBe(true);
  });

  it("a process whose file declares a policy is marked declared", () => {
    for (const r of rows) {
      const declares = /<folio:policy[^>]*\benforcement\s*=/.test(readFileSync(join(REPO, r.file), "utf-8"));
      expect(r.enforcementDeclared, `${r.file}`).toBe(declares);
    }
  });
});

describe("the committed page is current", () => {
  it("resolves its path from the declaration", () => {
    const rel = pageRelPath(REPO);
    expect(rel).toBeDefined();
    expect(existsSync(join(DOCS, rel!))).toBe(true);
  });

  it("and matches what the generator produces now", () => {
    // A stale page fails the unit suite rather than only the gate, which is
    // where it is noticed first.
    expect(readFileSync(join(DOCS, pageRelPath(REPO)!), "utf-8")).toBe(page(rows));
  });
});
