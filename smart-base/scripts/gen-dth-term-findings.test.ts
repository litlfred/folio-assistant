/**
 * The DTH terminology findings page is generated, every authored quote matches
 * what it cites, and no conflicting term is dropped.
 *
 * Calibrated: changing one word of any quote in dth-term-alternatives.json
 * fails "every quote matches its source" (and `smart-base:dth-terms:check`);
 * the matcher's own negative case is the second test.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { allQuotes, conflictingTerms, quoteProblem, render, sectionText, TermFindingsSchema } from "./gen-dth-term-findings.ts";

const root = join(import.meta.dir, "..", "..");
const findings = TermFindingsSchema.parse(JSON.parse(readFileSync(join(root, "smart-base", "findings", "dth-term-alternatives.json"), "utf8")));
const candidates = JSON.parse(readFileSync(join(root, findings.candidates), "utf8"));
const terms = conflictingTerms(candidates);

describe("DTH term findings", () => {
  it("every quote matches its source", () => {
    expect(allQuotes(findings).map((q) => quoteProblem(q)).filter(Boolean)).toEqual([]);
  });
  it("a quote that is not in its source is reported", () => {
    const q = { ...findings.actor.meanings[0].sources[0], quote: "An actor is a concrete participant" };
    expect(quoteProblem(q)).toContain("quote not found");
  });
  it("matches across the RA draft's number-only line markers", () => {
    expect(sectionText("---\na: 1\n---\nAn actor is an abstract\n64\ninformation-processing role")).toBe("An actor is an abstract information-processing role");
  });
  it("lists every conflicting candidate term, each with all its alternatives", () => {
    const page = render(findings, terms);
    for (const t of terms) {
      expect(page).toContain(`#### ${t.term}\n`);
      for (const c of t.conflictsWith) expect(page).toContain(c.definition.replace(/\|/g, "\\|").replace(/\n+/g, " "));
    }
  });
  it("records every approach with at least two alternatives and picks none", () => {
    for (const a of findings.approaches) expect(a.alternatives.length).toBeGreaterThanOrEqual(2);
  });
  it("one proposal per layer, none applied", () => {
    expect(findings.actor.proposals.map((p) => p.layer).sort()).toEqual(["F-A", "RA", "SG"]);
  });
  it("the committed page is what the generator writes", () => {
    expect(readFileSync(join(root, "smart-base", "findings", "dth-terms.md"), "utf8")).toBe(render(findings, terms));
  });
});
