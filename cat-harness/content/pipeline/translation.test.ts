/**
 * Tests for pot-extract.ts and po-inject.ts — the TypeScript port of
 * smart-base's markdown extraction/injection pipeline.
 *
 * Run: bun test content/pipeline/translation.test.ts
 */

import { describe, test, expect } from "bun:test";
import {
  cleanMarkdownText,
  extractMarkdown,
  extractFromManifest,
  formatPot,
} from "./pot-extract";
import { parsePo, injectMarkdown } from "./po-inject";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { publishedPairs } from "./derive-po.ts";
import { siteRoot, sourceLocale, supportedLocales } from "./translation-index.ts";

// ── cleanMarkdownText ───────────────────────────────────────────

describe("cleanMarkdownText", () => {
  test("strips bold markers", () => {
    expect(cleanMarkdownText("**bold text**")).toBe("bold text");
  });

  test("strips italic markers (asterisk)", () => {
    expect(cleanMarkdownText("*italic text*")).toBe("italic text");
  });

  test("strips italic markers (underscore)", () => {
    expect(cleanMarkdownText("_italic text_")).toBe("italic text");
  });

  // ── bean `o29r`: CommonMark's intraword rule ──────────────────
  //
  // `_` cannot OPEN emphasis after an alphanumeric, nor CLOSE before one. The
  // regex had no such guard, so ANY TWO underscores in one string paired up and
  // both were deleted. One subscript alone was safe, because the pattern needs a
  // second `_` to close on — so TWO is the threshold, and two is the ordinary
  // case in mathematical prose.
  //
  // Measured over the real corpora, current extractor against the same one with
  // only that line changed: 229 corrupted msgids of 46306 here, 13251 of 211139
  // in `litlfred/qou`. Each case below is a shape taken from those, not invented.

  test("a LaTeX subscript survives, alone or beside another", () => {
    // `$a_1$` alone already passed before the fix; the pair is the regression.
    expect(cleanMarkdownText("$a_1$")).toBe("$a_1$");
    expect(cleanMarkdownText("$a_1$ and $b_2$")).toBe("$a_1$ and $b_2$");
    expect(cleanMarkdownText("x_1 y_2")).toBe("x_1 y_2");
  });

  test("a subscripted LaTeX command is not turned into a different expression", () => {
    // The case that sets the severity. Losing these underscores does not flatten
    // a subscript, it rewrites the mathematics: `\sum{\lambdai}` is not valid
    // LaTeX, so the msgid cannot be reconstructed by a translator who knows the
    // convention.
    expect(cleanMarkdownText("weighted by $w_\\lambda = dq$")).toBe("weighted by $w_\\lambda = dq$");
    expect(cleanMarkdownText("the subspace $G^+ = \\sum_{\\lambda_i}$")).toBe(
      "the subspace $G^+ = \\sum_{\\lambda_i}$",
    );
  });

  test("a snake_case identifier is not a word with emphasis inside it", () => {
    // Not a maths-only concern: this shape broke BPMN ids in this repo's own
    // `prov-qaqc` page, where `Process_CodeChangeReview/Task_ClaimBean` extracted
    // as `ProcessCodeChangeReview/TaskClaimBean` — a msgid no translator can
    // round-trip.
    expect(cleanMarkdownText("snake_case_name stays")).toBe("snake_case_name stays");
    expect(cleanMarkdownText("perform-task for Process_CodeChangeReview/Task_ClaimBean")).toBe(
      "perform-task for Process_CodeChangeReview/Task_ClaimBean",
    );
  });

  test("real emphasis is still stripped, including two spans in one string", () => {
    // The guard must not buy subscript safety by giving up emphasis. Without
    // this, deleting the emphasis branch outright would pass every case above.
    expect(cleanMarkdownText("say _this_ and _that_")).toBe("say this and that");
    expect(cleanMarkdownText("a _multi word_ span")).toBe("a multi word span");
    expect(cleanMarkdownText("(_parenthesised_)")).toBe("(parenthesised)");
  });

  test("replaces links with link text", () => {
    expect(cleanMarkdownText("[click here](https://example.com)")).toBe(
      "click here"
    );
  });

  test("replaces images with alt text", () => {
    expect(cleanMarkdownText("![alt text](image.png)")).toBe("alt text");
  });

  test("removes inline code", () => {
    expect(cleanMarkdownText("use `foo()` function")).toBe("use  function");
  });

  test("removes HTML comments", () => {
    expect(cleanMarkdownText("text <!-- comment --> more")).toBe("text  more");
  });

  test("removes HTML tags", () => {
    expect(cleanMarkdownText("<br/>text<div>more</div>")).toBe("textmore");
  });

  test("removes angle-bracket autolinks", () => {
    expect(cleanMarkdownText("see <https://example.com> for info")).toBe(
      "see  for info"
    );
  });

  test("transforms Liquid output to gettext brace vars", () => {
    expect(cleanMarkdownText("There are {{ count }} items")).toBe(
      "There are {lqd_count} items"
    );
  });

  test("removes Liquid control tags", () => {
    expect(cleanMarkdownText("{% if true %}text{% endif %}")).toBe("text");
  });

  test("preserves underscores in Liquid variables", () => {
    // The Liquid tokenisation must protect underscores from the italic regex
    expect(cleanMarkdownText("{{ cell_var }}")).toBe("{lqd_cell_var}");
  });
});

// ── extractMarkdown ─────────────────────────────────────────────

// ── bean `3mo4`: a code span WRAPPED in emphasis ──────────────────
//
// The code span was removed before emphasis was stripped, so the emphasis pair
// was left with nothing between its markers. `MD_BOLD_RE` requires `[^*]+`
// there, so it did not match and the asterisks survived into the msgid — noise
// the translator is asked to reproduce, and part of the catalogue key. The
// repair tokenises code spans the way Liquid expressions were already
// tokenised, so emphasis sees something opaque rather than nothing.
//
// The four rows the bean tabulated are pinned below, plus a fifth it did not
// list and the case that proves the fix cannot reach inside a code span.

describe("cleanMarkdownText — emphasis around a code span (bean `3mo4`)", () => {
  test("bold wrapping a code span leaves no asterisks", () => {
    // Was `"**** — fail if x"`. Now identical to the bare-code-span row below,
    // which is the point: one construct, one answer.
    expect(cleanMarkdownText("**`clarity-defn-single`** — fail if x")).toBe("— fail if x");
  });

  test("italic wrapping a code span leaves no asterisks", () => {
    // Not in the bean's table — found while reproducing it. Was `"** trailing"`.
    expect(cleanMarkdownText("*`italic-code`* trailing")).toBe("trailing");
  });

  test("bold around ordinary text is unaffected", () => {
    expect(cleanMarkdownText("**bold** — fail if x")).toBe("bold — fail if x");
  });

  test("a bare code span is unaffected", () => {
    expect(cleanMarkdownText("`code` — fail if x")).toBe("— fail if x");
  });

  test("the construct TWICE in one string — and the double space is deliberate", () => {
    // The bean asked for this row's spacing to be fixed as well. It is not, on
    // purpose. The double space is not specific to this defect — removing ANY
    // code span leaves one — and 8188 of this instance's 46780 msgids already
    // contain a double space. Collapsing would rewrite 17.5 % of the corpus and
    // obsolete that many catalogue entries, which is a reformatting decision for
    // the owner rather than part of a bug fix. Pinned as it is so the choice is
    // visible rather than forgotten.
    expect(cleanMarkdownText("**`a`** and **`b`** both")).toBe("and  both");
  });

  test("TWO bold runs, the first wrapping a code span, left the markers asymmetric", () => {
    // The shape the bean did not have, and 19 of the 209 msgids this changed. It
    // needs two emphasis runs to reproduce, which is why this fixture is the real
    // line rather than a constructed one: my first attempt used a single run and
    // produced identical output before and after, so it pinned nothing while its
    // comment claimed to pin the defect. Taken verbatim from
    // `docs/reference/skill-instructions/kg-navigation.md:70`.
    //
    // Emptying the FIRST run to `****` let `MD_BOLD_RE` start one character late
    // and pair its opening `**` with the SECOND run's closing one, so it consumed
    // the text between and left a single `*` at the front and `**` before the
    // comma. Measured before the fix:
    //   "* — every servable skill with its one-line summary**,"
    const real = "**`skill_list`** — every servable skill **with its one-line summary**,";
    expect(cleanMarkdownText(real)).toBe("— every servable skill with its one-line summary,");
  });

  test("a glob INSIDE a code span is never reached by the emphasis regexes", () => {
    // Why the repair tokenises rather than reordering. Stripping emphasis first
    // would point `MD_BOLD_RE` at the inside of code spans, where
    // `content/**/*.lean` lives. A token containing no `*` is unreachable by
    // construction — a property, not a case that happens to pass.
    //
    // This passes on the OLD code too, and that is expected rather than a
    // weakness: the old order removed the span whole, so the glob was safe there
    // as well. It guards the repair that was NOT chosen — reordering the regexes —
    // which is the one a later reader is most likely to reach for.
    expect(cleanMarkdownText("see `content/**/*.lean` glob")).toBe("see  glob");
    expect(cleanMarkdownText("`a/**/b` and `c/**/d`")).toBe("and");
  });

  test("over the REAL corpus: no msgid carries a run of four asterisks", () => {
    // Measured before the fix: 190 did, across 660 files and 46780 msgids, and
    // the defect had already reached the translations — a translator copied the
    // asterisks into `es/skills.md` and `ru/architecture.md`.
    //
    // Asserted as ZERO rather than as a reduction, and separately from the 95
    // msgids that carry `**` WITHOUT `****`: those are prose emphasis spanning a
    // construct boundary, a different question that this must not touch.
    const root = resolve(import.meta.dir, "..", "..");
    const docs = siteRoot(root);
    expect(docs).toBeDefined();
    const files: string[] = [];
    const walk = (d: string): void => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) {
          if (!e.name.startsWith("_")) walk(p);
        } else if (e.name.endsWith(".md")) files.push(p);
      }
    };
    walk(docs!);
    let msgids = 0;
    const offenders: string[] = [];
    for (const f of files) {
      for (const e of extractMarkdown(readFileSync(f, "utf-8"), relative(docs!, f))) {
        msgids++;
        if (/\*{4}/.test(e.msgid)) offenders.push(`${relative(docs!, f)}:${e.line}`);
      }
    }
    expect(offenders).toEqual([]);
    // Anti-vacuity: a walk that found nothing would satisfy the line above.
    expect(files.length).toBeGreaterThan(500);
    expect(msgids).toBeGreaterThan(40000);
  });
});

describe("extractMarkdown", () => {
  test("extracts headings", () => {
    const entries = extractMarkdown("# Main Title\n\nSome text.\n", "test.md");
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(entries[0].msgid).toBe("Main Title");
  });

  test("extracts paragraphs", () => {
    const entries = extractMarkdown(
      "First paragraph text.\n\nSecond paragraph text.\n",
      "test.md"
    );
    expect(entries.length).toBe(2);
    expect(entries[0].msgid).toBe("First paragraph text.");
    expect(entries[1].msgid).toBe("Second paragraph text.");
  });

  test("accumulates continuation lines into one paragraph", () => {
    const entries = extractMarkdown(
      "This is a long\nparagraph that spans\nmultiple lines.\n\nNext para.\n",
      "test.md"
    );
    expect(entries[0].msgid).toBe(
      "This is a long paragraph that spans multiple lines."
    );
  });

  test("skips YAML front matter", () => {
    const entries = extractMarkdown(
      "---\ntitle: Test\nlayout: default\n---\n\nActual content here.\n",
      "test.md"
    );
    expect(entries.length).toBe(1);
    expect(entries[0].msgid).toBe("Actual content here.");
  });

  test("skips fenced code blocks", () => {
    const entries = extractMarkdown(
      "Before code.\n\n```typescript\nconst x = 1;\n```\n\nAfter code.\n",
      "test.md"
    );
    const msgids = entries.map((e) => e.msgid);
    expect(msgids).toContain("Before code.");
    expect(msgids).toContain("After code.");
    expect(msgids).not.toContain("const x = 1;");
  });

  test("skips HTML style blocks", () => {
    const entries = extractMarkdown(
      "Before.\n\n<style>\n.foo { color: red; }\n</style>\n\nAfter.\n",
      "test.md"
    );
    const msgids = entries.map((e) => e.msgid);
    expect(msgids).toContain("Before.");
    expect(msgids).toContain("After.");
    expect(msgids).not.toContain(".foo { color: red; }");
  });

  test("extracts list items", () => {
    const entries = extractMarkdown(
      "- First item\n- Second item\n- Third item\n",
      "test.md"
    );
    expect(entries.length).toBe(3);
    expect(entries[0].msgid).toBe("First item");
  });

  test("extracts blockquote text", () => {
    const entries = extractMarkdown(
      "> This is a quote.\n",
      "test.md"
    );
    expect(entries[0].msgid).toBe("This is a quote.");
  });

  test("extracts table cells", () => {
    const entries = extractMarkdown(
      "| Header One | Header Two |\n|---|---|\n| Cell one | Cell two |\n",
      "test.md"
    );
    const msgids = entries.map((e) => e.msgid);
    expect(msgids).toContain("Header One");
    expect(msgids).toContain("Cell one");
  });

  test("skips table separator rows", () => {
    const entries = extractMarkdown(
      "| A | B |\n|---|---|\n| C | D |\n",
      "test.md"
    );
    const msgids = entries.map((e) => e.msgid);
    expect(msgids).not.toContain("---");
  });

  test("skips kramdown attributes", () => {
    const entries = extractMarkdown(
      "# Title\n{: .no_toc }\n\nContent.\n",
      "test.md"
    );
    const msgids = entries.map((e) => e.msgid);
    expect(msgids).not.toContain(".no_toc");
  });

  // ── `{:toc}` consumes its list — bean `lrbx` ──────────────────────
  //
  // Every case below is asserted in BOTH directions, because the failure mode
  // of a fix like this is deleting prose a reader does see. `{: .no_toc }` is
  // the near miss: it is about the table of contents, it sits beside a heading
  // that renders, and a rule matching on "toc" rather than on the exact
  // directive would silently drop that heading from every catalogue.

  test("the list a `{:toc}` replaces is not offered to translators", () => {
    // The measured cost: the ar and ru translators rendered `1. TOC` as a
    // heading (ar `جدول المحتويات`), which is the correct reading of a string
    // that should never have been shown to them.
    const entries = extractMarkdown("Intro line.\n\n1. TOC\n{:toc}\n", "test.md");
    expect(entries.map((e) => e.msgid)).toEqual(["Intro line."]);
  });

  test("`{: .no_toc }` keeps the heading it attaches to", () => {
    const entries = extractMarkdown("## Subgraph viewers\n{: .no_toc }\n\nBody.\n", "test.md");
    expect(entries.map((e) => e.msgid)).toEqual(["Subgraph viewers", "Body."]);
  });

  test("an ordinary list is untouched", () => {
    const entries = extractMarkdown("- first item\n- second item\n\nA paragraph.\n", "test.md");
    expect(entries.map((e) => e.msgid)).toEqual(["first item", "second item", "A paragraph."]);
  });

  test("a `{:toc}` further down the page does not reach back to an earlier list", () => {
    // The run must END at the first line that is neither an item nor a blank,
    // or one directive would delete a list nobody asked it to touch.
    const entries = extractMarkdown(
      "- keep me\n- keep me too\n\nA paragraph.\n\n1. TOC\n{:toc}\n",
      "test.md",
    );
    expect(entries.map((e) => e.msgid)).toEqual(["keep me", "keep me too", "A paragraph."]);
  });

  test("a multi-item placeholder goes entirely, because the directive takes the LIST", () => {
    // Conventionally one item, but kramdown replaces the whole list — so a
    // rule that dropped only the last item would leak the rest.
    const entries = extractMarkdown("- TOC\n- Contents\n{:toc}\n", "test.md");
    expect(entries).toEqual([]);
  });

  test("an attribute list that attaches to prose keeps the prose", () => {
    const entries = extractMarkdown("Some real prose.\n{: .note }\n", "test.md");
    expect(entries.map((e) => e.msgid)).toEqual(["Some real prose."]);
  });

  test("skips horizontal rules", () => {
    const entries = extractMarkdown(
      "Before.\n\n---\n\nAfter.\n",
      "test.md"
    );
    const msgids = entries.map((e) => e.msgid);
    expect(msgids).toContain("Before.");
    expect(msgids).toContain("After.");
  });

  test("skips strings with fewer than two LETTERS, not fewer than three characters", () => {
    // Changed 2026-09-26, bean `6b8u`. The old rule was `text.length >= 3`, which
    // made translatability a property of the locale's script: `否` ("no") is one
    // character and was dropped where `non` and `нет` were kept, and an Arabic
    // cell's `"، و"` was kept where the English `", "` it translates was not.
    //
    // `OK` is the case that moved. It is two characters, so the old rule dropped
    // it — and it is a word with real translations (`Vale`, `Хорошо`), so dropping
    // it was wrong in the same direction as the rest of the defect.
    const entries = extractMarkdown("OK\n\nReal content here.\n", "test.md");
    expect(entries.map((e) => e.msgid)).toEqual(["OK", "Real content here."]);
  });

  test("a string with no letters is never translatable", () => {
    // What the threshold is actually FOR: skipping things that are not prose.
    // The old rule let 432 letterless msgids into this corpus's catalogues,
    // because it counted characters and punctuation is characters.
    const entries = extractMarkdown("| ... | — | 1.2.3 | Real words here |\n", "test.md");
    expect(entries.map((e) => e.msgid)).toEqual(["Real words here"]);
  });
});

// ── extractFromManifest ─────────────────────────────────────────

describe("extractFromManifest", () => {
  test("extracts title from manifest", () => {
    const entries = extractFromManifest(
      { label: "def:foo", title: "My Definition", kind: "definition" },
      "block.ts"
    );
    expect(entries.length).toBe(1);
    expect(entries[0].msgid).toBe("My Definition");
    expect(entries[0].comment).toContain("definition");
  });

  test("returns empty for manifest without title", () => {
    const entries = extractFromManifest(
      { label: "def:foo" },
      "block.ts"
    );
    expect(entries.length).toBe(0);
  });
});

// ── formatPot ───────────────────────────────────────────────────

describe("formatPot", () => {
  test("formats valid POT with header", () => {
    const pot = formatPot(
      [{ source: "test.md", line: 1, msgid: "Hello world" , kind: "paragraph" }],
      { projectName: "test-folio" }
    );
    expect(pot).toContain('msgid "Hello world"');
    expect(pot).toContain('msgstr ""');
    expect(pot).toContain("Project-Id-Version: test-folio");
    expect(pot).toContain("#: test.md:1");
  });

  test("deduplicates entries with same msgid", () => {
    const pot = formatPot([
      { source: "a.md", line: 1, msgid: "Same text" , kind: "paragraph" },
      { source: "b.md", line: 5, msgid: "Same text" , kind: "paragraph" },
    ]);
    // Should appear once as msgid, but with two #: references
    const matches = pot.match(/msgid "Same text"/g);
    expect(matches?.length).toBe(1);
    expect(pot).toContain("#: a.md:1");
    expect(pot).toContain("#: b.md:5");
  });

  test("adds python-brace-format flag for Liquid vars", () => {
    const pot = formatPot([
      { source: "t.md", line: 1, msgid: "Count: {lqd_count}" , kind: "paragraph" },
    ]);
    expect(pot).toContain("#, python-brace-format");
  });
});

// ── parsePo ─────────────────────────────────────────────────────

describe("parsePo", () => {
  test("parses simple PO file", () => {
    const po = `
msgid ""
msgstr ""
"Language: fr\\n"

msgid "Hello world"
msgstr "Bonjour le monde"

msgid "Goodbye"
msgstr "Au revoir"
`;
    const translations = parsePo(po);
    expect(translations.get("Hello world")).toBe("Bonjour le monde");
    expect(translations.get("Goodbye")).toBe("Au revoir");
  });

  test("skips fuzzy entries", () => {
    const po = `
msgid "Clear"
msgstr "Clair"

#, fuzzy
msgid "Uncertain"
msgstr "Incertain"
`;
    const translations = parsePo(po);
    expect(translations.get("Clear")).toBe("Clair");
    expect(translations.has("Uncertain")).toBe(false);
  });

  test("skips entries with empty msgstr", () => {
    const po = `
msgid "Translated"
msgstr "Traduit"

msgid "Untranslated"
msgstr ""
`;
    const translations = parsePo(po);
    expect(translations.get("Translated")).toBe("Traduit");
    expect(translations.has("Untranslated")).toBe(false);
  });
});

// ── injectMarkdown ──────────────────────────────────────────────

describe("injectMarkdown", () => {
  test("injects heading translations", () => {
    const translations = new Map([["Main Title", "Titre principal"]]);
    const result = injectMarkdown("# Main Title\n\nContent.\n", translations);
    expect(result.translated).toContain("# Titre principal");
    expect(result.changed).toBe(true);
  });

  test("injects paragraph translations", () => {
    const translations = new Map([
      ["First paragraph.", "Premier paragraphe."],
      ["Second paragraph.", "Deuxième paragraphe."],
    ]);
    const result = injectMarkdown(
      "First paragraph.\n\nSecond paragraph.\n",
      translations
    );
    expect(result.translated).toContain("Premier paragraphe.");
    expect(result.translated).toContain("Deuxième paragraphe.");
  });

  test("preserves untranslated content", () => {
    const translations = new Map([["Known", "Connu"]]);
    const result = injectMarkdown(
      "Known\n\nUnknown text here.\n",
      translations
    );
    expect(result.translated).toContain("Connu");
    expect(result.translated).toContain("Unknown text here.");
  });

  test("preserves code blocks", () => {
    const translations = new Map([
      ["Before code.", "Avant le code."],
      ["After code.", "Après le code."],
    ]);
    const result = injectMarkdown(
      "Before code.\n\n```\nconst x = 1;\n```\n\nAfter code.\n",
      translations
    );
    expect(result.translated).toContain("Avant le code.");
    expect(result.translated).toContain("const x = 1;");
    expect(result.translated).toContain("Après le code.");
  });

  test("restores Liquid variables", () => {
    const translations = new Map([
      ["There are {lqd_count} items", "Il y a {lqd_count} éléments"],
    ]);
    const result = injectMarkdown(
      "There are {{ count }} items\n",
      translations
    );
    expect(result.translated).toContain("Il y a {{ count }} éléments");
  });

  test("reports statistics", () => {
    const translations = new Map([["Hello", "Bonjour"]]);
    const result = injectMarkdown(
      "Hello\n\nWorld is big.\n",
      translations
    );
    expect(result.stats.translatedSpans).toBe(1);
    expect(result.stats.untranslatedSpans).toBe(1);
  });
});

// ── The blank line is part of the document (bean `rmor`) ────────
//
// Every test in the block above asserts with `toContain`, and that is exactly
// why this defect lived: `toContain` cannot see a blank line that is gone. The
// final filter read `outLines.filter((line) => line !== "")` under a comment
// saying it removed blank lines "introduced by paragraph collapse", and it
// removed every empty line in the document. `src/tools/translation.ts` writes
// the result to disk, so `translation_inject` could not produce a usable page
// for any document with more than one block.
//
// Structure is asserted here rather than substrings, in both directions: the
// blanks must survive, AND the paragraph must still collapse. A fix that
// preserved blank lines by not collapsing at all would satisfy the first and
// silently remove the feature.

describe("injectMarkdown preserves document structure", () => {
  test("the author's blank lines survive — all three of them", () => {
    // The bean's own fixture, byte for byte. Measured before the fix: 3 blank
    // lines in, 0 out; the heading ran into the paragraph, the paragraph into
    // the list, and the trailing paragraph was absorbed by the list.
    const source = "# Title\n\nFirst paragraph here.\n\n- item one\n- item two\n\nSecond paragraph here.";
    const result = injectMarkdown(source, new Map([["Title", "Titre"]]));
    const blanks = (s: string): number => s.split("\n").filter((l) => l.trim() === "").length;
    expect(blanks(source)).toBe(3);
    expect(blanks(result.translated)).toBe(3);
    // And the whole document, so nothing else moved either.
    expect(result.translated).toBe(
      "# Titre\n\nFirst paragraph here.\n\n- item one\n- item two\n\nSecond paragraph here.",
    );
  });

  test("a wrapped paragraph STILL collapses to one line", () => {
    // The other half of the falsifier. Preserving blank lines by not collapsing
    // would pass the test above and remove the feature.
    const source = "A sentence that was\nhard wrapped across\nthree source lines.";
    const result = injectMarkdown(
      source,
      new Map([["A sentence that was hard wrapped across three source lines.", "Une phrase repliée."]]),
    );
    expect(result.translated).toBe("Une phrase repliée.");
    expect(result.translated.split("\n")).toHaveLength(1);
    expect(result.changed).toBe(true);
  });

  test("collapsing a multi-line continuation leaves no blank line inside the list", () => {
    // The second defect the same mechanism caused, and the two INTERACTED in a way
    // worth writing down: blanking put a blank line inside the list, and the global
    // filter then swept it away. So the list damage was MASKED by the blank-line
    // destruction, and fixing only the filter would have exposed it.
    //
    // Measured on this exact fixture with blanking kept and the global filter
    // removed: `"- an item\nsuite traduite\n\n- second item"` — a blank line inside
    // the list, which makes the list LOOSE and changes how every item renders.
    //
    // **This test does not discriminate against the old code as a whole**, and
    // saying so is the point: with both defects present the final output matches,
    // because the second hid the first. What it guards is a future "fix" that makes
    // the filter precise while still emptying lines — the obvious half-repair.
    const source = "- an item\n  continued line one\n  continued line two\n- second item";
    const result = injectMarkdown(
      source,
      new Map([["continued line one continued line two", "suite traduite"]]),
    );
    expect(result.translated).toBe("- an item\nsuite traduite\n- second item");
    expect(result.translated).not.toContain("\n\n");
  });

  test("a document with NO translation is returned unchanged, byte for byte", () => {
    // The cheapest guard against the whole class: if nothing is translated,
    // nothing may move.
    const source = "# Heading\n\nA paragraph.\n\n- one\n- two\n\n\nDouble blank above.\n";
    const result = injectMarkdown(source, new Map());
    expect(result.translated).toBe(source);
    expect(result.changed).toBe(false);
  });

  test("over the REAL corpus: injection never changes the blank-line count", () => {
    // 62 (catalogue, source) pairs in this instance. A fixture proves the
    // mechanism; only the corpus says whether any real page trips it. Measured
    // before the fix: the old filter would have destroyed 3,871 blank lines
    // across these same pairs.
    const root = resolve(import.meta.dir, "..", "..");
    const docs = siteRoot(root);
    expect(docs).toBeDefined();
    const { pages, locales } = publishedPairs(docs!, supportedLocales(root), sourceLocale(root), {
      instanceRoot: root,
    });
    const blanks = (s: string): number => s.split("\n").filter((l) => l.trim() === "").length;
    let pairs = 0;
    let collapsed = 0;
    for (const page of pages) {
      const srcFile = join(docs!, `${page}.md`);
      if (!existsSync(srcFile)) continue;
      const source = readFileSync(srcFile, "utf-8");
      for (const locale of locales) {
        // Catalogues are addressed by basename today; see bean `9rnf` on why
        // that is a separate open question from this one.
        const po = join(root, "translations", locale, `${page.split("/").pop()}.po`);
        if (!existsSync(po)) continue;
        pairs++;
        const result = injectMarkdown(source, parsePo(readFileSync(po, "utf-8")));
        expect(blanks(result.translated)).toBe(blanks(source));
        if (result.translated.split("\n").length < source.split("\n").length) collapsed++;
      }
    }
    // Anti-vacuity, both ways: the loop must have run, and it must have actually
    // collapsed something on every pair rather than passing by doing nothing.
    expect(pairs).toBeGreaterThanOrEqual(60);
    expect(collapsed).toBe(pairs);
  });
});

// ── Round-trip: extract → format → parse → inject ───────────────

describe("round-trip", () => {
  test("extract → format → parse → inject preserves structure", () => {
    const source = [
      "---",
      "title: Test Page",
      "---",
      "",
      "# Introduction",
      "",
      "This is the first paragraph of the test page.",
      "",
      "## Details",
      "",
      "- First item in the list",
      "- Second item in the list",
      "",
      "```typescript",
      "const x = 42;",
      "```",
      "",
      "> A blockquote for emphasis.",
      "",
      "| Column A | Column B |",
      "|---|---|",
      "| Cell one | Cell two |",
      "",
      "Final paragraph.",
      "",
    ].join("\n");

    // Step 1: Extract
    const entries = extractMarkdown(source, "test-page.md");
    expect(entries.length).toBeGreaterThan(0);

    // Step 2: Format POT
    const pot = formatPot(entries, { projectName: "test" });
    expect(pot).toContain("msgid");

    // Step 3: Create a fake PO with French translations
    const frTranslations = new Map<string, string>();
    for (const entry of entries) {
      frTranslations.set(entry.msgid, `[FR] ${entry.msgid}`);
    }

    // Step 4: Inject
    const result = injectMarkdown(source, frTranslations);
    expect(result.changed).toBe(true);

    // Verify structure preserved
    expect(result.translated).toContain("```"); // code block preserved
    expect(result.translated).toContain("const x = 42;"); // code content preserved
    expect(result.translated).toContain("---"); // front matter preserved
    expect(result.translated).toContain("[FR] Introduction"); // heading translated
    expect(result.translated).toContain("[FR] First item in the list"); // list item translated
    expect(result.translated).toContain("[FR] A blockquote for emphasis."); // blockquote translated
  });
});
