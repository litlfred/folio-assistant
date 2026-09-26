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
import { extractMarkdown, MD_CODE_FENCE_RE } from "./pot-extract.ts";
import { SITE_DIR } from "./translation-index.ts";
import { injectMarkdown } from "./po-inject.ts";

/** A throwaway instance with a source page and whichever translations are given. */
function fixture(source: string, translations: Record<string, string>): { root: string; cleanup: () => void } {
  const root = mkdtempSync(join(tmpdir(), "derive-po-"));
  mkdirSync(join(root, SITE_DIR), { recursive: true });
  // `siteRoot` CONFIRMS a site by finding `_config.yml` rather than trusting the
  // path, so the fixture has to carry one — which is the point: a tree that only
  // looks like a site is reported as no site at all.
  writeFileSync(join(root, SITE_DIR, "_config.yml"), "title: fixture\n");
  writeFileSync(join(root, SITE_DIR, "page.md"), source);
  for (const [locale, text] of Object.entries(translations)) {
    mkdirSync(join(root, SITE_DIR, locale), { recursive: true });
    writeFileSync(join(root, SITE_DIR, locale, "page.md"), text);
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
    mkdirSync(join(root, SITE_DIR), { recursive: true });
    writeFileSync(join(root, SITE_DIR, "_config.yml"), "title: fixture\n");
    const r = derive(root, ["page"], ["fr", "es"]);
    expect(r.refused.map((f) => f.reason)).toEqual(["source-missing", "source-missing"]);
    expect(r.derived).toEqual([]);
    rmSync(root, { recursive: true, force: true });
  });

  it("a tree with NO site is refused for every pair, not reported as nothing to do", () => {
    // `dh4f` from the other side: a consumer that resolves no directory and
    // exits clean reads as coverage. There is no `_config.yml` here, so there is
    // no site — and the refusal says so in its detail rather than claiming the
    // pages are missing from a directory it never found.
    const root = mkdtempSync(join(tmpdir(), "derive-po-nosite-"));
    const r = derive(root, ["a", "b"], ["fr", "es"]);
    expect(r.derived).toEqual([]);
    expect(r.refused).toHaveLength(4);
    expect(r.refused[0].detail).toContain("no site root");
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

  it("NO pair diverges by kind any more — both that did were threshold artefacts", () => {
    // History, because it is the whole reason `kind` exists on `PotEntry`. Before
    // `6b8u`, `fr/accessibility` (construct 32) and `ru/getting-started`
    // (construct 53) matched their source's count EXACTLY and each paired a
    // source paragraph against a translated table cell. A count-only check would
    // have written two catalogues that were well-formed and wrong.
    //
    // Both were the character threshold, not the translators: with
    // `isTranslatable` counting letters they align exactly. So the kind check now
    // finds nothing — and that is the point of keeping this test. It fails if a
    // future extractor change reintroduces a shape divergence, which is the case
    // no count check can see.
    const root = resolve(import.meta.dir, "..", "..");
    const r = derive(root, PAGES, LOCALES);
    const byKind = r.refused.filter((f) => f.reason === "kind-diverges").map((f) => `${f.locale}/${f.page}`);
    expect(byKind).toEqual([]);
  });

  it("the extractor fixes moved alignment from 7 to 10, and no further — measured, not hoped", () => {
    // Pins the number the PR claims. The first account of these fixes said they
    // would unlock 9 more pairs; that came from stitching a count measurement
    // and a kind measurement taken separately, and measuring the two together
    // gives THREE. This test is here so the claim cannot drift back.
    const root = resolve(import.meta.dir, "..", "..");
    const r = derive(root, PAGES, LOCALES);
    expect(r.derived).toHaveLength(10);
    expect(r.refused).toHaveLength(15);
    // Every remaining refusal is a count difference — a fact about the
    // translation, now that the extractor's own asymmetries are gone. Bean `7x8o`.
    expect(new Set(r.refused.map((f) => f.reason))).toEqual(new Set(["count-differs"]));
  });

  it("the same table cell is now translatable in the same way in every script (`6b8u`)", () => {
    // THE REGRESSION THIS PINS, and it is the reason `isTranslatable` counts
    // letters. These are the real cells from `docs/installation.md` and its
    // Arabic translation. Under the old `text.length >= 3`, stripping the code
    // spans left `", "` (2 characters, dropped) in English and `"، و"` (3, kept)
    // in Arabic — so an identical 4x7 table yielded 66 constructs in `ar` against
    // 65 in English, and translatability was a property of the script.
    const en = extractMarkdown("| `pandoc`, `ripgrep` | conversions, search |", "en");
    const ar = extractMarkdown("| `pandoc`، و`ripgrep` | التحويلات، والبحث |", "ar");
    expect(en).toHaveLength(1);
    expect(ar).toHaveLength(1);
    expect(en[0].kind).toBe("table-cell");
    expect(ar[0].kind).toBe("table-cell");
  });

  it("a letterless string is never offered to a translator", () => {
    // The measure that actually settled the predicate: the old rule put 432
    // msgids with NO LETTER IN THEM into this corpus's catalogues. There is
    // nothing in such a string for a translator to do, and every candidate
    // considered removed all of them — so this is the floor, not a preference.
    for (const junk of [", ", " | ", "...", "—", "\u060c \u0648"]) {
      expect(extractMarkdown(`| ${junk} | real words here |`, "x").map((e) => e.msgid)).not.toContain(
        junk.trim(),
      );
    }
  });

  it("an INDENTED code fence is a code fence (`ig4a`)", () => {
    // Anchored at column 0, the fence inside a list item was invisible and its
    // body was extracted as prose — `docs/contributing.md` yielded "````" as a
    // PARAGRAPH, twice. Corpus-wide that was 74 msgids of code offered to
    // translators, 48 of them a bare fence run.
    const md = [
      "- A list item introducing a command:",
      "",
      "  ```sh",
      "  bun run scripts/gen-schema-docs.ts",
      "  ```",
      "",
      "- A second item with real prose in it.",
    ].join("\n");
    const ids = extractMarkdown(md, "x").map((e) => e.msgid);
    expect(ids.some((m) => /^[`~]{2,}$/.test(m))).toBe(false);
    expect(ids.some((m) => m.includes("gen-schema-docs"))).toBe(false);
    expect(ids).toContain("A second item with real prose in it.");
  });

  it("nothing is derived for a pair whose counts differ", () => {
    const root = resolve(import.meta.dir, "..", "..");
    const r = derive(root, PAGES, LOCALES);
    const derivedKeys = new Set(r.derived.map((d) => `${d.locale}/${d.page}`));
    for (const f of r.refused) expect(derivedKeys.has(`${f.locale}/${f.page}`)).toBe(false);
  });
});

describe("the two halves of the round trip agree about where the code is (`ig4a`)", () => {
  // `po-inject.ts` carried its OWN copy of `MD_CODE_FENCE_RE`, also anchored at
  // column 0, so fixing the extractor alone would have left the two halves of a
  // round trip using different definitions of a fence.
  //
  // **What this does NOT pin, having checked.** The first version of this block
  // asserted that the old injector would substitute a translation into an
  // indented code block and corrupt the command. Measured against the old anchor
  // on this exact input, and on a fence whose body is ordinary prose: it
  // substitutes NOTHING inside an indented fence either way. Something else
  // already protects the injector, so that test would have passed before the fix
  // as well — a test that cannot fail is not evidence, and the claim is withdrawn
  // rather than left standing because it read well.
  //
  // What is left is worth pinning: the extractor's behaviour, the injector's
  // behaviour, and that there is one definition rather than two.
  const MD = [
    "- An item introducing a command:",
    "",
    "  ```sh",
    "  bun run scripts/gen-schema-docs.ts",
    "  ```",
    "",
    "- Real prose in the second item.",
  ].join("\n");

  it("the extractor offers nothing from inside an indented fence", () => {
    const ids = extractMarkdown(MD, "x").map((e) => e.msgid);
    expect(ids.some((m) => m.includes("gen-schema-docs"))).toBe(false);
    expect(ids).toContain("Real prose in the second item.");
  });

  it("the injector leaves an indented fence alone while translating the prose beside it", () => {
    // Not a claim about the fix — a claim about the CONTRACT, which must keep
    // holding through `lvk9` and whatever follows it. The hostile catalogue names
    // the command on purpose, as a catalogue written before `ig4a` would.
    const hostile = new Map([
      ["bun run scripts/gen-schema-docs.ts", "CORRUPTED"],
      ["Real prose in the second item.", "Prose traduite."],
    ]);
    const out = injectMarkdown(MD, hostile).translated;
    expect(out).toContain("bun run scripts/gen-schema-docs.ts");
    expect(out).not.toContain("CORRUPTED");
    expect(out).toContain("Prose traduite.");
  });

  it("both halves read ONE definition of a fence", () => {
    // The finding that survives. A duplicated regex is a fact free to drift, and
    // this one had drifted within a single change.
    const inject = readFileSync(new URL("./po-inject.ts", import.meta.url).pathname, "utf-8");
    expect(MD_CODE_FENCE_RE).toBeInstanceOf(RegExp);
    expect(inject).toContain('MD_CODE_FENCE_RE } from "./pot-extract"');
    expect(inject).not.toMatch(/const MD_CODE_FENCE_RE\s*=/);
  });
});
