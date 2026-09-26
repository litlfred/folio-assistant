/**
 * The methodology evidence axis, against THIS corpus rather than fixtures.
 *
 * Fixtures would prove the branches; this proves the claim that matters — that
 * the five real methodology nodes validate, and that the one with an ingested
 * source resolves to it. The measurement this axis exists for (six citations,
 * zero ingested sources) was only visible because the real corpus was read.
 */
import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  checkMethodologyEvidence,
  frontMatterOf,
  resolveEvidence,
} from "../check-methodology-evidence.ts";
import { MethodologyFrontMatterSchema, METHODOLOGY_SCHEMA_TAG } from "../../schemas/methodology.ts";

const INSTANCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const VALID = {
  $schema: METHODOLOGY_SCHEMA_TAG,
  name: "kepner-tregoe",
  title: "Kepner-Tregoe Decision Analysis",
  origin: "Kepner and Tregoe, The Rational Manager (1965)",
  "applies-when": "A one-off choice among candidate options.",
};

describe("the schema that did not exist", () => {
  it("accepts a node with no `evidence`, because most have none", () => {
    // Optional on purpose. Requiring it would have invalidated every existing
    // methodology on the day the schema landed, which is the gate-that-cries-
    // wolf failure. The absence is a QA finding, not a schema error.
    expect(MethodologyFrontMatterSchema.safeParse(VALID).success).toBe(true);
  });

  it("requires `origin`, which is the line between an adoption and a house method", () => {
    const { origin: _drop, ...without } = VALID;
    expect(MethodologyFrontMatterSchema.safeParse(without).success).toBe(false);
  });

  it("requires `applies-when`, so the selection question can reach the node", () => {
    const { "applies-when": _drop, ...without } = VALID;
    expect(MethodologyFrontMatterSchema.safeParse(without).success).toBe(false);
  });

  it("REJECTS a misspelled key rather than ignoring it", () => {
    // The whole reason for `strict()`. `applies_when` beside a correct
    // `applies-when` would otherwise validate, and the node would be
    // unreachable by the selection question — indistinguishable from a
    // methodology nobody picks because it genuinely does not apply.
    const typo = { ...VALID, applies_when: "..." };
    expect(MethodologyFrontMatterSchema.safeParse(typo).success).toBe(false);
  });

  it("refuses a URL as `evidence` — the point is that it resolves HERE", () => {
    const url = { ...VALID, evidence: ["https://doi.org/10.17719/jisr.2017.1832"] };
    expect(MethodologyFrontMatterSchema.safeParse(url).success).toBe(false);
    const ref = { ...VALID, evidence: ["library/gurel-tat-2017-swot-analysis"] };
    expect(MethodologyFrontMatterSchema.safeParse(ref).success).toBe(true);
  });

  it("takes SEVERAL sources — a methodology may rest on more than one", () => {
    // `swot` is rendered from a theoretical review AND an encyclopedia
    // chapter. They agree on the method and differ in coverage, so forcing a
    // choice would make the node cite less than it rests on.
    const two = {
      ...VALID,
      evidence: ["library/gurel-tat-2017-swot-analysis", "library/sammut-bonnici-galea-2015-swot-analysis"],
    };
    expect(MethodologyFrontMatterSchema.safeParse(two).success).toBe(true);
  });

  it("refuses `evidence: []` — an empty list is not `no evidence`", () => {
    // Absent means nobody has ingested a source. An empty array reads as
    // answered while saying nothing, which is the third-state collapse this
    // corpus spends most of its length preventing.
    expect(MethodologyFrontMatterSchema.safeParse({ ...VALID, evidence: [] }).success).toBe(false);
  });

  it("refuses a BARE STRING, so the one-source case cannot fork the shape", () => {
    // It was a string until a second source arrived. Accepting both spellings
    // would leave every consumer branching on the field's type, and the
    // one-element case is the one that would silently become the default.
    expect(
      MethodologyFrontMatterSchema.safeParse({ ...VALID, evidence: "library/gurel-tat-2017-swot-analysis" })
        .success,
    ).toBe(false);
  });
});

describe("the real corpus", () => {
  const report = checkMethodologyEvidence(INSTANCE_ROOT);

  it("finds the methodology graph at all — undetermined is a third state", () => {
    // An empty sweep and a clean sweep must not share a spelling (`dh4f`). If
    // this ever flips, the axis reports nothing and exits 2 rather than
    // printing a clean run over a corpus it never located.
    expect(report.undetermined).toBe(false);
    expect(report.nodes).toBeGreaterThan(0);
  });

  it("every node in the corpus validates", () => {
    expect(report.invalid).toEqual([]);
  });

  it("no node cites an `evidence` that resolves nowhere", () => {
    // The one evidence finding that DOES gate. A pointer claiming to resolve
    // and failing to is worse than no pointer: every listing reads it as
    // backed.
    expect(report.unresolved).toEqual([]);
  });

  it("reaches `diig` in the repository-scoped smart-base graph, not just the harness's", () => {
    // `smart-base/methodologies/` is repository-scoped so it lifts out whole.
    // A sweep resolving only instance-relative directories would miss it and
    // report a smaller, cleaner corpus than exists. (This read `grade` in
    // `smart-kg/` until GRADE became a skill, bean `wg7r`.)
    const names = [...report.resolved.map((r) => r.name), ...report.noEvidence.map((f) => f.name)];
    expect(names).toContain("diig");
  });

  it("swot is backed by BOTH its sources, and each is really on disk", () => {
    const swot = report.resolved.filter((r) => r.name === "swot");
    expect(swot.map((r) => r.evidence).sort()).toEqual([
      "library/gurel-tat-2017-swot-analysis",
      "library/sammut-bonnici-galea-2015-swot-analysis",
    ]);
    for (const r of swot) expect(existsSync(join(INSTANCE_ROOT, r.at))).toBe(true);
  });

  it("a node is backed only when EVERY source it cites resolves", () => {
    // Half-backed must not read as backed. `resolved` holds one entry per
    // (node, source) pair, so counting it as a count of METHODOLOGIES reported
    // 2 of 5 the moment swot gained a second source — the count bug this
    // assertion pins shut.
    const backed = new Set(report.resolved.map((r) => r.name));
    const unresolved = new Set(report.unresolved.map((f) => f.name));
    for (const name of backed) expect(unresolved.has(name)).toBe(false);
    expect(backed.size).toBeLessThanOrEqual(report.nodes);
  });

  it("does NOT descend into a methodology's own subgraph directory", () => {
    // `x4v4`: a subgraph's nodes are its own. `methodologies/crdm/` is declared
    // separately as a `skills` graph, so collecting `crdm-detect.md` here would
    // attribute a CRDM skill to the methodology graph and make every count
    // computed from it wrong.
    const all = [...report.resolved, ...report.noEvidence, ...report.invalid, ...report.untagged];
    expect(all.map((n) => ("node" in n ? n.node : "")).filter((p) => /methodologies\/[^/]+\//.test(p))).toEqual([]);
  });
});

describe("the helpers", () => {
  it("returns undefined for a file with no front matter", () => {
    expect(frontMatterOf("# just a heading\n")).toBeUndefined();
  });

  it("resolves a bib-slug across EVERY declared library, not just one", () => {
    // Bean `a02m`. Several instances declare a library; resolving against one
    // would report a present document as missing.
    expect(resolveEvidence(INSTANCE_ROOT, "library/gurel-tat-2017-swot-analysis")).toBeDefined();
    expect(resolveEvidence(INSTANCE_ROOT, "library/not-a-real-slug")).toBeUndefined();
  });
});
