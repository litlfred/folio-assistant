/**
 * The DTH terminology findings page is generated, every authored quote matches
 * what it cites, and no conflicting term is dropped.
 *
 * Calibrated: changing one word of any quote in dth-term-alternatives.json
 * fails "every quote matches its source" (and `smart-base:dth-terms:check`);
 * the matcher's own negative case is the second test.
 */
import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { allQuotes, conflictingTerms, quoteProblem, quoteUnverifiable, render, sectionText, TermFindingsSchema } from "./gen-dth-term-findings.ts";

const root = join(import.meta.dir, "..", "..");
const findings = TermFindingsSchema.parse(JSON.parse(readFileSync(join(root, "smart-base", "findings", "dth-term-alternatives.json"), "utf8")));
const candidates = JSON.parse(readFileSync(join(root, findings.candidates), "utf8"));
const terms = conflictingTerms(candidates);

describe("DTH term findings", () => {
  it("every quote matches its source, except one citing a file built at publish that is not built here", () => {
    expect(allQuotes(findings).filter((q) => quoteUnverifiable(q) === null).map((q) => quoteProblem(q)).filter(Boolean)).toEqual([]);
  });
  it("a quote citing a built-at-publish file that is absent is not checked, and says so", () => {
    const q = { path: "smart-base/fhir-artifact-index/index.json", locator: "x", quote: "y" };
    const built = new Set([q.path]);
    expect(quoteUnverifiable(q, "/nonexistent-root", built)).toContain("built at publish");
    expect(quoteUnverifiable(q, "/nonexistent-root", new Set())).toBeNull();
    expect(quoteProblem(q, "/nonexistent-root")).toContain("no such file");
  });
  it("a quote that is not in its source is reported", () => {
    // A source this checkout holds: the first one may be an example held by
    // another repository (EXAMPLE_POINTERS), which is not checked here.
    const held = allQuotes(findings).find((s) => quoteUnverifiable(s) === null && quoteProblem(s) === null)!;
    expect(held).toBeDefined();
    const q = { ...held, quote: "An actor is a concrete participant" };
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
  it("covers the Substandard and Falsified Medical Products DTH (9789240120747-eng) 35 glossary terms, RA conflicts, and internal alternatives", () => {
    expect(findings.sfp.libraryId).toBe("9789240120747-eng");
    expect(findings.sfp.terms.length).toBe(35);
    expect(findings.sfp.raConflicts.length).toBe(5);
    expect(findings.sfp.internalConflicts.some((c) => c.id === "sfp-f1-substandard")).toBe(true);
    expect(findings.figure.reproductions.some((r) => !("path" in r) && r.libraryId === "9789240120747-eng" && r.sectionId === "sec-006-how-to-use-this-handbook")).toBe(true);
    const page = render(findings, terms);
    for (const t of findings.sfp.terms) {
      expect(page).toContain(`| **${t.term}** |`);
    }
  });
  it("one proposal per layer, each naming artefacts that exist", () => {
    expect(findings.actor.proposals.map((p) => p.layer).sort()).toEqual(["F-A", "RA", "SG"]);
    for (const p of findings.actor.proposals) for (const a of p.artefacts ?? []) expect(existsSync(join(root, a))).toBe(true);
  });
  it("only the folio-assistant mapping is applied; RA and SG are drafted for the owner, never sent", () => {
    // Owner, 2026-10-03: "1. F-A mapping, 2. Draft RA comment, 3. SMART Base proposal".
    const by = Object.fromEntries(findings.actor.proposals.map((p) => [p.layer, p.status]));
    expect(by).toEqual({ "F-A": "applied", RA: "drafted", SG: "drafted" });
  });
  it("the committed page is what the generator writes", () => {
    expect(readFileSync(join(root, "smart-base", "findings", "dth-terms.md"), "utf8")).toBe(render(findings, terms));
  });
});
