/**
 * BPMN label extraction and injection.
 *
 * The `bpmn` format was declared in schemas/translation-tools.ts with no
 * extractModule, no injectModule and no code — so these tests pin the
 * behaviour the declaration implied, and in particular the things a
 * translation pass must NOT touch. Translating an id disconnects the graph;
 * translating a `folio:skill ref` manufactures exactly the dangling
 * reference that `check:workflow-refs` exists to catch.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { extractBpmn, injectBpmn, decodeLabel } from "../../content/pipeline/bpmn-translate.ts";

const ROOT = join(import.meta.dir, "../..");
const XML = readFileSync(join(ROOT, "docs/workflows/crdm-requirements.bpmn"), "utf-8");

describe("extractBpmn", () => {
  test("finds the labels a reader sees", () => {
    const entries = extractBpmn(XML, "docs/workflows/crdm-requirements.bpmn");
    const msgids = entries.map((e) => e.msgid);
    expect(msgids).toContain("BA / Feature Requestor");
    expect(msgids).toContain("Detect feature request (crdm-detect skill)");
    expect(entries.length).toBeGreaterThan(20);
  });

  test("authored line breaks become spaces, because a translator never sees them", () => {
    expect(decodeLabel("Describe the need&#10;(chat, issue, discussion)")).toBe(
      "Describe the need (chat, issue, discussion)",
    );
  });

  test("never offers an id, a skill ref or a bean op for translation", () => {
    const msgids = extractBpmn(XML, "x.bpmn").map((e) => e.msgid);
    for (const forbidden of [
      "BA_Submit", "A_Detect", "Process_CRDM", "Lane_Agent",
      "crdm-detect", "crdm-requirements-workflow", "todo-manager",
      "note", "claim", "resolve",
    ]) {
      expect({ forbidden, present: msgids.includes(forbidden) }).toEqual({ forbidden, present: false });
    }
  });

  test("de-duplicates, because a repeated label is one translation", () => {
    const msgids = extractBpmn(XML, "x.bpmn").map((e) => e.msgid);
    expect(msgids.length).toBe(new Set(msgids).size);
  });
});

describe("injectBpmn", () => {
  test("translates a label and leaves the structure alone", () => {
    const out = injectBpmn(XML, new Map([["BA / Feature Requestor", "BA / Demandeur"]]));
    expect(out).toContain('name="BA / Demandeur"');
    // Every structural handle survives untouched.
    expect(out).toContain('id="Lane_BA"');
    expect(out).toContain("<bpmn:flowNodeRef>BA_Submit</bpmn:flowNodeRef>");
    expect(out).toContain('<folio:skill ref="crdm-detect"/>');
    expect(out).toContain('<folio:bean op="note"/>');
  });

  test("an untranslated msgid keeps its source text", () => {
    // A half-finished PO must leave a half-English diagram, not a blank one.
    const out = injectBpmn(XML, new Map([["BA / Feature Requestor", "BA / Demandeur"]]));
    expect(out).toContain('name="Agent"');
  });

  test("round-trips: inject then re-extract sees the translation", () => {
    const fr = new Map([["Agent", "Agent (fr)"], ["Stakeholders", "Parties prenantes"]]);
    const out = injectBpmn(XML, fr);
    const msgids = extractBpmn(out, "x.bpmn").map((e) => e.msgid);
    expect(msgids).toContain("Agent (fr)");
    expect(msgids).toContain("Parties prenantes");
  });

  test("escapes a translation containing XML metacharacters", () => {
    const out = injectBpmn(XML, new Map([["Agent", 'A & B "quoted" <tag>']]));
    expect(out).toContain('name="A &amp; B &quot;quoted&quot; &lt;tag&gt;"');
    // ...and the result is still parseable as the same document shape.
    expect(out).toContain('id="Lane_Agent"');
  });
});
