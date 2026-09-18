/**
 * What the block-level translation sweep may and may not claim.
 *
 * Two of these tests are about a verdict NOT being written. That is the whole
 * design question here: a round trip cannot be run offline, and a block that
 * was never translated is not a block whose translation failed. Both gaps are
 * easy to fill with a plausible number, and a plausible number is what stops
 * anyone asking again.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildReport, invariantTokens, measureBlock } from "./translation-block-qa.ts";

function inTmp(run: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), "trans-qa-"));
  try {
    run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function po(pairs: Array<[string, string]>): string {
  return (
    'msgid ""\nmsgstr ""\n"Language: fr\\n"\n\n' +
    pairs.map(([id, str]) => `msgid "${id}"\nmsgstr "${str}"\n`).join("\n")
  );
}

describe("invariantTokens — what a translation may not silently drop", () => {
  test("acronyms, numbers and URLs", () => {
    const t = invariantTokens("The CRDM gate ran 3 times; see https://phii.org/x for QA notes.");
    expect(t).toContain("CRDM");
    expect(t).toContain("QA");
    expect(t).toContain("3");
    expect(t).toContain("https://phii.org/x");
  });

  test("an ordinary capitalised word is not an acronym", () => {
    // Proper nouns are translated or transliterated all the time; requiring
    // them verbatim would make the criterion fire on correct translations.
    expect(invariantTokens("Public Health Informatics Institute")).toEqual([]);
  });
});

describe("measureBlock", () => {
  const md = "The CRDM gate is a checkpoint.\n";

  test("an empty msgstr is untranslated, not translated-to-nothing", () => {
    const m = measureBlock(md, "b.md", new Map([["The CRDM gate is a checkpoint.", "   "]]));
    expect(m.total).toBe(1);
    expect(m.translated).toBe(0);
  });

  test("a msgstr identical to its msgid is counted as an echo", () => {
    const m = measureBlock(
      md,
      "b.md",
      new Map([["The CRDM gate is a checkpoint.", "The CRDM gate is a checkpoint."]]),
    );
    expect(m.translated).toBe(1);
    expect(m.echoed).toBe(1);
  });

  test("a dropped acronym is a finding that quotes the translation", () => {
    const m = measureBlock(
      md,
      "b.md",
      new Map([["The CRDM gate is a checkpoint.", "La barrière est un point de contrôle."]]),
    );
    expect(m.missingTerms).toHaveLength(1);
    expect(m.missingTerms[0]).toContain("CRDM");
    expect(m.missingTerms[0]).toContain("barrière");
  });

  test("a real translation that keeps its terms is clean", () => {
    const m = measureBlock(
      md,
      "b.md",
      new Map([["The CRDM gate is a checkpoint.", "La barrière CRDM est un point de contrôle."]]),
    );
    expect(m.translated).toBe(1);
    expect(m.echoed).toBe(0);
    expect(m.missingTerms).toEqual([]);
  });
});

describe("buildReport — absence is absence", () => {
  test("no PO source at all: no report", () => {
    inTmp((dir) => {
      const md = join(dir, "b.md");
      writeFileSync(md, "The CRDM gate is a checkpoint.\n");
      expect(buildReport(md, "sec:b", "fr", [])).toBeUndefined();
    });
  });

  test("a PO that holds none of this block's strings: no report, NOT a 0% failure", () => {
    inTmp((dir) => {
      // The chapter-level PO resolves for every block on the page. A block whose
      // strings are not in it has not been translated — writing `fail` there
      // paints a 3%-translated site red and buries the translations that exist
      // and are broken.
      const md = join(dir, "b.md");
      writeFileSync(md, "The CRDM gate is a checkpoint.\n");
      const p = join(dir, "other.po");
      writeFileSync(p, po([["Some other sentence.", "Une autre phrase."]]));
      expect(buildReport(md, "sec:b", "fr", [p])).toBeUndefined();
    });
  });

  test("a translated block reports coverage, terms and echo — and NO round-trip verdict", () => {
    inTmp((dir) => {
      const md = join(dir, "b.md");
      writeFileSync(md, "The CRDM gate is a checkpoint.\n");
      const p = join(dir, "fr.po");
      writeFileSync(
        p,
        po([["The CRDM gate is a checkpoint.", "La barrière CRDM est un point de contrôle."]]),
      );
      const doc = buildReport(md, "sec:b", "fr", [p])!;

      expect(doc.label).toBe("trans:fr/b");
      // The block's own label is a DIFFERENT identity and is kept separately.
      expect(doc.block).toBe("sec:b");
      expect(doc.criteria["translation-coverage"]![0]!.result).toBe("pass");
      expect(doc.criteria["translation-coverage"]![0]!.metrics).toMatchObject({ pct: 100 });
      expect(doc.criteria["translation-terms-preserved"]![0]!.result).toBe("pass");
      expect(doc.criteria["translation-not-echo"]![0]!.result).toBe("pass");

      // The one that matters: declared, and deliberately unwitnessed. The only
      // offline back-translation is the PO read backwards, which returns the
      // source exactly and would score 1.0 on any similarity measure — a verdict
      // about the lookup table with a script's name on it.
      expect(doc.criteria["translation-semantic-roundtrip"]).toEqual([]);
    });
  });

  test("the PO is a hashed input, so editing the translation stales the verdict", () => {
    inTmp((dir) => {
      const md = join(dir, "b.md");
      writeFileSync(md, "The CRDM gate is a checkpoint.\n");
      const p = join(dir, "fr.po");
      writeFileSync(p, po([["The CRDM gate is a checkpoint.", "La barrière CRDM."]]));
      const first = buildReport(md, "sec:b", "fr", [p])!;
      writeFileSync(p, po([["The CRDM gate is a checkpoint.", "La barrière CRDM revue."]]));
      const second = buildReport(md, "sec:b", "fr", [p])!;
      expect(first.source_hashes.po).not.toBe(second.source_hashes.po);
      expect(first.criteria["translation-coverage"]![0]!.field_hash.po).not.toBe(
        second.criteria["translation-coverage"]![0]!.field_hash.po,
      );
    });
  });

  test("a partial translation warns, and says how much is missing", () => {
    inTmp((dir) => {
      const md = join(dir, "b.md");
      writeFileSync(md, "First sentence here.\n\nSecond sentence here.\n");
      const p = join(dir, "fr.po");
      writeFileSync(p, po([["First sentence here.", "Première phrase ici."]]));
      const doc = buildReport(md, "sec:b", "fr", [p])!;
      const cov = doc.criteria["translation-coverage"]![0]!;
      expect(cov.result).toBe("warn");
      expect(cov.metrics).toMatchObject({ translated: 1, total: 2, pct: 50 });
      expect(cov.notes).toContain("1 of 2");
    });
  });
});
