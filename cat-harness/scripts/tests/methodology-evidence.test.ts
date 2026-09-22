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
    const url = { ...VALID, evidence: "https://doi.org/10.17719/jisr.2017.1832" };
    expect(MethodologyFrontMatterSchema.safeParse(url).success).toBe(false);
    const ref = { ...VALID, evidence: "library/gurel-tat-2017-swot-analysis" };
    expect(MethodologyFrontMatterSchema.safeParse(ref).success).toBe(true);
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

  it("reaches `grade` in the repository-scoped smart-kg graph, not just the harness's", () => {
    // `smart-kg/methodologies/` is repository-scoped so it lifts out whole.
    // A sweep resolving only instance-relative directories would miss it and
    // report a smaller, cleaner corpus than exists.
    const names = [...report.resolved.map((r) => r.name), ...report.noEvidence.map((f) => f.name)];
    expect(names).toContain("grade");
  });

  it("swot is backed, and its source is really on disk", () => {
    const swot = report.resolved.find((r) => r.name === "swot");
    expect(swot).toBeDefined();
    expect(existsSync(join(INSTANCE_ROOT, swot!.at))).toBe(true);
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
