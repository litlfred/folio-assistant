/**
 * The ingest rung decision, and the L1 completeness gate.
 *
 * Both are written against fixtures rather than `library/`, because the real
 * corpus is complete and passing: a test that only asserted "the repo is fine"
 * would keep passing if either checker were gutted to return nothing. The one
 * assertion that DOES read the corpus is pinned to what the four entries
 * already record, so it fails if the shape drifts.
 *
 * @module scripts/tests/ingest-and-l1
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { NOT_DERIVABLE, checkAll, checkEntry } from "../check-l1-complete.ts";
import { OCR_THRESHOLD_CHARS, planFor } from "../ingest-document.ts";

const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("which rung a document needs", () => {
  test("an embedded outline selects pdf-structure — the structure is READ", () => {
    const p = planFor("x.pdf", { outline: 258, chars: 90_000 });
    expect(p.rung).toBe("pdf-structure");
    expect(p.steps[0]).toContain("scripts/pdf-structure.py");
    expect(p.why).toContain("258");
  });

  test("no outline but a text layer selects pdf-pages, and says it infers nothing", () => {
    const p = planFor("x.pdf", { outline: 0, chars: 50_000 });
    expect(p.rung).toBe("pdf-pages");
    expect(p.steps).toHaveLength(1);
    // The whole point of bean 6xaz: absence of an outline selects PAGE
    // granularity, it never selects "infer a chapter tree".
    expect(p.why).toContain("NOT inferred");
  });

  test("no outline and almost no text selects OCR FIRST, then pages", () => {
    const p = planFor("x.pdf", { outline: 0, chars: OCR_THRESHOLD_CHARS - 1 });
    expect(p.rung).toBe("pdf-ocr+pdf-pages");
    expect(p.steps.map((s) => s[1])).toEqual(["scripts/pdf-ocr.py", "scripts/pdf-pages.py"]);
    expect(p.steps[1]).toContain("--from-ocr");
  });

  test("the OCR threshold is a boundary, not a vibe", () => {
    expect(planFor("x.pdf", { outline: 0, chars: OCR_THRESHOLD_CHARS }).rung).toBe("pdf-pages");
    expect(planFor("x.pdf", { outline: 0, chars: OCR_THRESHOLD_CHARS - 1 }).rung).toBe("pdf-ocr+pdf-pages");
  });

  test("a PDF that cannot be probed is UNDETERMINED and runs nothing", () => {
    // Never "no outline". A document filed under the wrong rung reads as
    // ingested while its structure is wrong -- the 6xaz failure mode.
    for (const probe of [
      { outline: null, chars: null, error: "no PDF backend" },
      { outline: null, chars: 10 },
      { outline: 3, chars: null },
    ]) {
      const p = planFor("x.pdf", probe);
      expect({ rung: p.rung, steps: p.steps.length }).toEqual({ rung: "undetermined", steps: 0 });
    }
  });
});

/** A library entry with every derivable requirement satisfied. */
function entry(over: Partial<Record<"structure" | "manifest", unknown>> = {}, opts: { sections?: number; blocks?: number } = {}): string {
  const root = mkdtempSync(join(tmpdir(), "l1-"));
  made.push(root);
  const dir = join(root, "doc");
  mkdirSync(join(dir, "sections"), { recursive: true });
  mkdirSync(join(dir, "blocks"), { recursive: true });
  for (let i = 0; i < (opts.sections ?? 2); i++) writeFileSync(join(dir, "sections", `s${i}.md`), "x");
  for (let i = 0; i < (opts.blocks ?? 1); i++) writeFileSync(join(dir, "blocks", `b${i}.json`), "{}");
  writeFileSync(
    join(dir, "structure.json"),
    JSON.stringify(over.structure ?? { _schema: "pdf-structure/v1", toc_source: "none", sections: [1, 2] }),
  );
  writeFileSync(
    join(dir, "manifest.jsonld"),
    JSON.stringify(over.manifest ?? { "@id": "x", "@type": ["folio:SourceDocument"], contains: ["a"], provenance: {} }),
  );
  return dir;
}

const states = (d: string) =>
  Object.fromEntries(checkEntry(d).requirements.filter((r) => r.state !== "not-derivable").map((r) => [r.name, r.state]));

describe("L1 completeness", () => {
  test("a full entry is complete", () => {
    expect(Object.values(states(entry())).every((s) => s === "met")).toBe(true);
  });

  test("each missing artefact is reported unmet, not skipped", () => {
    expect(states(entry({}, { sections: 0 })).sections).toBe("unmet");
    expect(states(entry({}, { blocks: 0 })).blocks).toBe("unmet");
    expect(states(entry({ manifest: { "@id": "x" } })).manifest).toBe("unmet");
    expect(states(entry({ manifest: { "@id": "x", "@type": [], contains: [] } })).provenance).toBe("unmet");
    expect(states(entry({ structure: { _schema: "pdf-structure/v1", sections: [] } })).structure).toBe("unmet");
  });

  test("unparseable JSON is unmet rather than an exception", () => {
    const d = entry();
    writeFileSync(join(d, "structure.json"), "{ not json");
    expect(states(d).structure).toBe("unmet");
  });

  test("an empty structure with NO note is unmet — nothing says the emptiness was determined", () => {
    const d = entry({ structure: { _schema: "pdf-structure/v1", sections: [] } });
    expect(states(d)["structure-note"]).toBe("unmet");
    const noted = entry({
      structure: { _schema: "pdf-structure/v1", sections: [], structure_note: "no outline; none claimed" },
    });
    expect(states(noted)["structure-note"]).toBeUndefined();
  });

  test("what no arm can produce is NOT-DERIVABLE, never met", () => {
    // The third state is the reason this gate can ship before the nine INGEST
    // arms exist. If any of these ever reads `met`, the gate is lying.
    const nd = checkEntry(entry()).requirements.filter((r) => r.state === "not-derivable");
    expect(nd.map((r) => r.name).sort()).toEqual(NOT_DERIVABLE.map(([n]) => n).sort());
    expect(nd.every((r) => /bean \w+/.test(r.detail))).toBe(true);
  });

  test("no library/ is 'nothing to check', not 'complete'", () => {
    const root = mkdtempSync(join(tmpdir(), "l1-empty-"));
    made.push(root);
    expect(checkAll(root)).toEqual([]);
  });

  test("the real corpus passes every derivable requirement", () => {
    const reports = checkAll(join(import.meta.dir, "../.."));
    expect(reports.length).toBeGreaterThan(0);
    const bad = reports.flatMap((r) =>
      r.requirements.filter((q) => q.state === "unmet").map((q) => `${r.slug}: ${q.name} — ${q.detail}`),
    );
    expect(bad).toEqual([]);
  });
});
