/**
 * `translation-quotation-verbatim`: a quotation kept in its own language must
 * survive every translation byte-for-byte, and its record must not drift.
 */
import { describe, expect, it } from "bun:test";
import type { PoEntry } from "./po-inject.ts";
import { hasDirective, localeFindings, quotationHash, sourceFindings, verdicts, type Quotation } from "./translation-quotation-verbatim.ts";

const original = "Le cœur a ses raisons que la raison ne connaît point.";
const q: Quotation = { id: "q:pascal", block: "a.md", lang: "fr", original, sha256: quotationHash(original) };
const md = `Pascal wrote:\n\n:::quotation{#q:pascal lang=fr}\n${original}\n:::\n`;
const entry = (msgstr: string, comments = ["verbatim quotation q:pascal, do not translate"]): PoEntry => ({
  references: ["a.md:3"], comments, flags: [], msgid: original, msgstr,
});

describe("translation-quotation-verbatim", () => {
  it("hashes the NFC form, so a decomposed é hashes the same", () => {
    expect(quotationHash("é")).toBe(quotationHash("é"));
  });

  it("passes a quotation kept verbatim, with directive and comment", () => {
    expect(sourceFindings(q, md)).toEqual([]);
    expect(localeFindings(q, "ar", [entry(original)])).toEqual([]);
  });

  it("fails when the record's hash no longer matches its original", () => {
    const f = sourceFindings({ ...q, sha256: quotationHash("autre") }, md);
    expect(f.map((x) => x.result)).toEqual(["fail"]);
  });

  it("fails a translated quotation", () => {
    const f = localeFindings(q, "es", [entry("El corazón tiene razones que la razón no conoce.")])!;
    expect(f.map((x) => x.result)).toEqual(["fail"]);
  });

  it("warns when the directive or the PO comment is missing", () => {
    expect(hasDirective(original, q.id)).toBe(false);
    expect(sourceFindings(q, original).map((x) => x.result)).toEqual(["warn"]);
    expect(localeFindings(q, "ar", [entry(original, [])])!.map((x) => x.result)).toEqual(["warn"]);
  });

  it("gives no verdict for a locale that has not translated the block", () => {
    expect(localeFindings(q, "zh", [entry("")])).toBeUndefined();
    expect(verdicts([q], () => md, new Map([["zh", [entry("")]], ["ru", [entry(original)]]]))).toEqual([
      { block: "a.md", locale: "ru", result: "pass", notes: [], quotations: ["q:pascal"] },
    ]);
  });

  it("does not match a longer id that shares a prefix", () => {
    expect(hasDirective(":::quotation{#q:pascal-1657 lang=fr}", "q:pascal")).toBe(false);
  });
});
