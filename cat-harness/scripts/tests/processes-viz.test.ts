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
import { ownElementPattern } from "../../schemas/namespaces.ts";

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
      return a + new Set([...text.matchAll(ownElementPattern(text, "bean", String.raw`\s+op="([^"]*)"`))].map((m) => m[1]!)).size;
    }, 0);
    expect(parsed).toBeGreaterThanOrEqual(naive);
  });
});

describe("a skill-less activity is a census entry, not an accusation", () => {
  /**
   * THE SECOND FALSE FINDING THIS PAGE SHIPPED, caught the same way as the
   * first — by checking the claim against what the repository already knew.
   *
   * The first version said *"31 activities carry no `<folio:skill ref>`.
   * `bpmn-processes` requires one on every activity"* and listed them as a
   * defect. Beans `luke` and `uuhu` had already worked this corpus from 90
   * down to that remainder and settled it: `luke` — *"coverage is deliberately
   * NOT gated — a human sign-off step has no skill"*; `uuhu` added the
   * call-activity exemption and recorded that its remainder *"are not gaps"*.
   *
   * So the page was accusing 31 deliberate design decisions, in a section a
   * reader is meant to act on. Same shape as the 11 phantom unrendered SVGs,
   * two hours apart, in the same file.
   */
  const withNone = rows.filter((r) => r.activitiesWithoutSkill.length > 0);
  const html = page(rows);

  it("there are some to reason about", () => {
    expect(withNone.length).toBeGreaterThan(0);
  });

  it("does NOT call them a requirement violation", () => {
    // The exact wording that was wrong. A reader who believes this section is
    // a gap list will go and "fix" a stakeholder sign-off by inventing a skill
    // for it.
    expect(html).not.toContain("requires one on every activity");
  });

  it("names the beans that settled it", () => {
    // Without the provenance the census reads as a softened accusation rather
    // than as a decision somebody already made.
    expect(html).toContain("`luke`");
    expect(html).toContain("`uuhu`");
  });

  it("separates call activities, which delegate rather than omit", () => {
    const calls = withNone.flatMap((r) => r.activitiesWithoutSkill).filter((a) => a.type.endsWith("CallActivity"));
    expect(calls.length).toBeGreaterThan(0);
    expect(html).toContain("call activities, which delegate to a subprocess");
  });

  it("and declines to rule on the rest, saying WHY it cannot", () => {
    // The third state, stated rather than hedged: the lane's actor KIND is
    // what would decide, and a free-text lane name does not carry it.
    expect(html).toContain("No verdict is offered");
    expect(html).toContain("actor KIND");
  });

  it("counts roleRef rather than characterising it", () => {
    // An earlier draft said "few of these" and was counting whether the lane
    // had a NAME — a different question with a different answer. A count in
    // prose is a claim; this asserts the number is derived.
    const rest = withNone.flatMap((r) => r.activitiesWithoutSkill).filter((a) => !a.type.endsWith("CallActivity"));
    const n = rest.filter((a) => a.roleRef).length;
    expect(html).toContain(`present on **${n}** of these **${rest.length}** steps`);
    // The CLAIM form, not the words. The page explains the old mistake using
    // the phrase "few of these", and a bare `not.toContain` for it failed on
    // the very sentence documenting the fix — a guard tripping over its own
    // subject's name. What must not come back is the phrase standing where a
    // NUMBER belongs.
    expect(html).not.toMatch(/present on \*\*(?!\d)/);
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

  it("a process whose file declares an enforcement VALUE is marked declared", () => {
    for (const r of rows) {
      const xml = readFileSync(join(REPO, r.file), "utf-8");
      const declares = ownElementPattern(xml, "policy", String.raw`[^>]*\benforcement\s*=`, "").test(xml);
      expect(r.enforcementDeclared, `${r.file}`).toBe(declares);
    }
  });

  // This test's NAME said "declares a policy" until 2026-09-22 while its
  // assertion read the enforcement value — the same two-readings-of-one-word
  // defect the module doc now carries, restated one layer in (bean `osyc`).
  // The two oracles are not interchangeable, so the relation between them is
  // asserted rather than left to whichever sentence a reader meets first.
  it("declaring a value implies carrying an element, but not the reverse", () => {
    const element = (f: string) => {
      const xml = readFileSync(join(REPO, f), "utf-8");
      return ownElementPattern(xml, "policy", "", "").test(xml);
    };

    // Subset: every file the page calls `declared` has a policy element.
    for (const r of rows.filter((x) => x.enforcementDeclared)) {
      expect(element(r.file), `${r.file} is marked declared`).toBe(true);
    }

    // Proper subset: the corpus contains at least one element carrying no
    // value. If this ever goes empty the two oracles agree by accident, and
    // the distinction above stops being load-bearing — which is worth being
    // told about, because the doc explaining it would then read as pedantry.
    const elementOnly = rows.filter((r) => !r.enforcementDeclared && element(r.file));
    expect(elementOnly.length, "policy elements carrying no enforcement").toBeGreaterThan(0);
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
