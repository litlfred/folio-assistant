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
