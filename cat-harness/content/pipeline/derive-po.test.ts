/**
 * Tests for `.po` recovery from an already-translated page (issue #206).
 *
 * The falsifier this file is built around is the one that nearly shipped: **a
 * count match is not an alignment.** Two of the nine count-matching pairs in the
 * real corpus diverge in kind partway through, and a count-only check would have
 * written catalogues pairing a source paragraph's msgid with a table cell's
 * text. A `.po` is well-formed whatever it claims, so nothing downstream would
 * have caught it.
 */
import { describe, it, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import { derive, write, formatReport, firstKindDivergence, formatDerivedPo, LOCALE_NAMES } from "./derive-po.ts";
import { extractMarkdown } from "./pot-extract.ts";

/** A throwaway instance with a source page and whichever translations are given. */
function fixture(source: string, translations: Record<string, string>): { root: string; cleanup: () => void } {
  const root = mkdtempSync(join(tmpdir(), "derive-po-"));
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "docs", "page.md"), source);
  for (const [locale, text] of Object.entries(translations)) {
    mkdirSync(join(root, "docs", locale), { recursive: true });
    writeFileSync(join(root, "docs", locale, "page.md"), text);
  }
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

const SRC = ["# Heading one", "", "A paragraph of prose that is long enough.", "", "- first item", "- second item"].join("\n");
const OK = ["# Titre un", "", "Un paragraphe de prose suffisamment long.", "", "- premier élément", "- second élément"].join("\n");

describe("a faithful translation is derivable", () => {
  it("derives one catalogue per aligned locale", () => {
    const { root, cleanup } = fixture(SRC, { fr: OK });
    const r = derive(root, ["page"], ["fr"]);
    expect(r.refused).toEqual([]);
    expect(r.derived).toHaveLength(1);
    expect(r.derived[0].entries).toBe(extractMarkdown(SRC, "x").length);
    cleanup();
  });

  it("pairs each msgid with the translation at the SAME position", () => {
    const { root, cleanup } = fixture(SRC, { fr: OK });
    const po = derive(root, ["page"], ["fr"]).derived[0].po;
    // The heading must map to the heading and the list item to the list item —
    // not merely both appear somewhere in the file.
    expect(po).toContain('msgid "Heading one"\nmsgstr "Titre un"');
    expect(po).toContain('msgid "first item"\nmsgstr "premier élément"');
    cleanup();
  });

  it("marks every catalogue UNOFFICIAL in its header", () => {
    // #206: official means human sign-off. A script's output is not that, and a
    // reader should not have to infer it from provenance.
    const { root, cleanup } = fixture(SRC, { fr: OK });
    const po = derive(root, ["page"], ["fr"]).derived[0].po;
    expect(po).toContain("UNOFFICIAL");
    expect(po).toContain("No human has adjudicated it");
    cleanup();
  });
});

describe("it REFUSES rather than guesses", () => {
  it("a different construct count is refused, with both counts named", () => {
    const short = ["# Titre un", "", "Un paragraphe de prose suffisamment long."].join("\n");
    const { root, cleanup } = fixture(SRC, { fr: short });
    const r = derive(root, ["page"], ["fr"]);
    expect(r.derived).toEqual([]);
    expect(r.refused[0].reason).toBe("count-differs");
    expect(r.refused[0].detail).toContain("4");
    expect(r.refused[0].detail).toContain("2");
    cleanup();
  });

  it("SAME COUNT but a divergent kind is refused — the case that nearly shipped", () => {
    // THE DEFECT THIS PINS. Measured on the real corpus: `fr/accessibility` and
    // `ru/getting-started` both match their source's count exactly and both
    // diverge at a construct where the source is a paragraph and the translation
    // is a table cell. Here the second construct is a heading instead of a
    // paragraph — same count, wrong shape.
    const swapped = ["# Titre un", "", "## Un titre au lieu du paragraphe", "", "- premier élément", "- second élément"].join("\n");
    const { root, cleanup } = fixture(SRC, { fr: swapped });
    const r = derive(root, ["page"], ["fr"]);
    expect(r.derived).toEqual([]);
    expect(r.refused[0].reason).toBe("kind-diverges");
    expect(r.refused[0].detail).toContain("paragraph");
    expect(r.refused[0].detail).toContain("heading");
    cleanup();
  });

  it("an absent translation is refused as missing, not as divergent", () => {
    // The two are different findings: one is "nobody has translated this", the
    // other is "somebody has, and it drifted". Collapsing them would send a
    // reader looking for drift in a page that does not exist.
    const { root, cleanup } = fixture(SRC, {});
    const r = derive(root, ["page"], ["fr"]);
    expect(r.refused[0].reason).toBe("translation-missing");
    cleanup();
  });

  it("an absent source refuses every locale, rather than reporting none", () => {
    const root = mkdtempSync(join(tmpdir(), "derive-po-nosrc-"));
    const r = derive(root, ["page"], ["fr", "es"]);
    expect(r.refused.map((f) => f.reason)).toEqual(["source-missing", "source-missing"]);
    expect(r.derived).toEqual([]);
    rmSync(root, { recursive: true, force: true });
  });

  it("a refusal reaches the report, and says it is a finding about the CORPUS", () => {
    const { root, cleanup } = fixture(SRC, {});
    const out = formatReport(derive(root, ["page"], ["fr"]));
    expect(out).toContain("REFUSED");
    expect(out).toContain("not a tool limit");
    cleanup();
  });
});

describe("firstKindDivergence", () => {
  it("returns -1 when the sequences agree", () => {
    const a = extractMarkdown(SRC, "x");
    expect(firstKindDivergence(a, extractMarkdown(OK, "y"))).toBe(-1);
  });

  it("returns the INDEX, so the report can name where", () => {
    const a = extractMarkdown(SRC, "x");
    const b = extractMarkdown(SRC, "y").map((e, i) => (i === 1 ? { ...e, kind: "heading" as const } : e));
    expect(firstKindDivergence(a, b)).toBe(1);
  });
});

describe("the catalogue is well-formed", () => {
  it("a repeated msgid is emitted once — gettext permits only one", () => {
    const dup = ["# Same text here", "", "Some other prose that is long enough.", "", "# Same text here"].join("\n");
    const dupFr = ["# Même texte ici", "", "Une autre prose assez longue.", "", "# Même texte ici"].join("\n");
    const { root, cleanup } = fixture(dup, { fr: dupFr });
    const po = derive(root, ["page"], ["fr"]).derived[0].po;
    expect((po.match(/msgid "Same text here"/g) ?? []).length).toBe(1);
    cleanup();
  });

  it("quotes and backslashes are escaped", () => {
    const q = ['# A "quoted" heading', "", "Prose with a \\ backslash in it here."].join("\n");
    const qf = ['# Un titre "cité"', "", "Prose avec une \\ barre oblique inverse."].join("\n");
    const { root, cleanup } = fixture(q, { fr: qf });
    const po = derive(root, ["page"], ["fr"]).derived[0].po;
    expect(po).toContain('\\"quoted\\"');
    expect(po).not.toMatch(/msgid "A "quoted"/);
    cleanup();
  });

  it("names the locale the way the existing catalogues do", () => {
    // `Language-Team: Arabic`, matching translations/ar/index.po rather than a
    // runtime-derived display name that would rewrite the file on an ICU update.
    expect(LOCALE_NAMES.ar).toBe("Arabic");
    const po = formatDerivedPo("p", "ar", extractMarkdown(SRC, "x"), extractMarkdown(OK, "y"), "docs/p.md");
    expect(po).toContain("Language-Team: Arabic");
    expect(po).toContain("Language: ar");
  });
});

describe("write", () => {
  it("writes each catalogue to translations/<locale>/<page>.po", () => {
    const { root, cleanup } = fixture(SRC, { fr: OK });
    const paths = write(root, derive(root, ["page"], ["fr"]));
    expect(paths).toHaveLength(1);
    expect(paths[0]).toContain(join("translations", "fr", "page.po"));
    expect(readFileSync(paths[0], "utf-8")).toContain("UNOFFICIAL");
    cleanup();
  });

  it("writes nothing when everything was refused", () => {
    const { root, cleanup } = fixture(SRC, {});
    expect(write(root, derive(root, ["page"], ["fr"]))).toEqual([]);
    cleanup();
  });
});

describe("this repository's five uncatalogued pages", () => {
  const PAGES = ["accessibility", "content-types", "contributing", "getting-started", "installation"];
  const LOCALES = ["ar", "es", "fr", "ru", "zh"];

  it("splits 25 pairs into derivable and refused, and every pair is accounted for", () => {
    // Against the REAL corpus rather than a fixture: the point of this tool is
    // what it says about these pages, and a fixture would keep passing if the
    // extractor stopped seeing one of them.
    const root = resolve(import.meta.dir, "..", "..");
    const r = derive(root, PAGES, LOCALES);
    expect(r.derived.length + r.refused.length).toBe(PAGES.length * LOCALES.length);
    expect(r.derived.length).toBeGreaterThan(0);
  });

  it("the two count-matching-but-divergent pairs are refused BY KIND", () => {
    // The measured justification for checking kinds at all. If either of these
    // ever reports `count-differs` instead, the extractor's segmentation moved
    // and this tool's guarantee needs re-deriving rather than trusting.
    const root = resolve(import.meta.dir, "..", "..");
    const r = derive(root, PAGES, LOCALES);
    const byKind = r.refused.filter((f) => f.reason === "kind-diverges").map((f) => `${f.locale}/${f.page}`);
    expect(byKind.sort()).toEqual(["fr/accessibility", "ru/getting-started"]);
  });

  it("a refusal is about the SHAPE, and on this corpus that is mostly the extractor's threshold", () => {
    // Guards the docblock's claim against the reading it displaced. A refusal
    // looks like "the translator restructured the page", and for 9 of the 18 it
    // is instead `MD_MIN_TEXT_LEN` being a minimum in CHARACTERS: measured by
    // re-running both sides at a minimum of 1, 7 of the 16 count mismatches and
    // BOTH kind divergences disappear.
    //
    // The mechanism, pinned here against the shipped extractor rather than
    // asserted in prose — this is the actual cell from docs/installation.md, and
    // the Arabic row is what makes that page 66 constructs against 65.
    const en = extractMarkdown("| `pandoc`, `ripgrep` | conversions, search |", "en");
    const ar = extractMarkdown("| `pandoc`، و`ripgrep` | التحويلات، والبحث |", "ar");
    // Same table, same two cells, one more extracted string — because stripping
    // the code spans leaves `", "` (2 characters, under the minimum) in English
    // and `"، و"` (3, over it) in Arabic. The localised comma and conjunction are
    // correct; the threshold is what is not script-neutral.
    expect(en).toHaveLength(1);
    expect(ar).toHaveLength(2);
    expect(ar.map((e) => e.kind)).toEqual(["table-cell", "table-cell"]);
  });

  it("nothing is derived for a pair whose counts differ", () => {
    const root = resolve(import.meta.dir, "..", "..");
    const r = derive(root, PAGES, LOCALES);
    const derivedKeys = new Set(r.derived.map((d) => `${d.locale}/${d.page}`));
    for (const f of r.refused) expect(derivedKeys.has(`${f.locale}/${f.page}`)).toBe(false);
  });
});
