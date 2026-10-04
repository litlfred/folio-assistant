import { describe, expect, it } from "bun:test";
import { leakingLinesIn, markdownSources, GENERATED_SEGMENTS, MARKDOWN_HTML_NAMES } from "../check-escaped-markup.ts";

/**
 * The SOURCE side of `check:escaped-markup` — bean `7pp6`.
 *
 * Every must-not-fire case below is a REAL line from this corpus, found by the
 * sweep that preceded the check: of 6 column-0 matches across 2314 markdown
 * files, FOUR were not the defect. They are tests rather than comments because
 * the failure mode of this check is firing on valid documentation, and
 * `BLOCK_TAGS`' own note says what that costs — *"a check that fires on
 * documentation is a check that gets switched off."*
 */
describe("leakingLinesIn — must fire", () => {
  it("catches the #1730 defect: a code span wrapped so a line begins <slide>", () => {
    // Verbatim shape of the line that reddened `Docs site` nine times.
    const src = [
      "shape a paged PDF gets — one section per slide, `page_start == page_end ==",
      '<slide>`, `granularity: "slide"` — so `l1-blocks.ts`, the manifest and',
    ].join("\n");
    const found = leakingLinesIn("library-ingestion.md", src);
    expect(found).toHaveLength(1);
    expect(found[0]!.tag).toBe("slide");
    expect(found[0]!.line).toBe(2);
  });

  it("catches a DOTTED placeholder, which is never an element", () => {
    // `7w1a` recorded this spelling on two pages: <file.json>, <name>.config.json.
    expect(leakingLinesIn("x.md", "<file.json> is the sidecar")).toHaveLength(1);
  });

  it("catches a close tag too — kramdown reads either as a block", () => {
    expect(leakingLinesIn("x.md", "</agentId> ends it")).toHaveLength(1);
  });
});

describe("leakingLinesIn — must NOT fire (all four are real corpus lines)", () => {
  it("an autolink is valid markdown, not a tag", () => {
    // bootstrap/LICENSE-CONTENT.md:48 and its bootstrap-tools twin.
    const src = "<https://creativecommons.org/licenses/by/3.0/legalcode>, or send a letter to";
    expect(leakingLinesIn("LICENSE-CONTENT.md", src)).toEqual([]);
    expect(leakingLinesIn("x.md", "<mailto:someone@example.org>")).toEqual([]);
  });

  it("a REAL html element is allowed to open a line", () => {
    // cat-harness/docs/harnessed-kg-overview.md:78 opens with <caption>.
    expect(leakingLinesIn("x.md", "<caption>Bars under the SMART levels</caption>")).toEqual([]);
    // `7w1a` DELIBERATELY introduced this one to make tables parse inside details.
    expect(leakingLinesIn("x.md", '<details markdown="1">')).toEqual([]);
  });

  it("a placeholder inside a code span, mid-line, is the safe spelling", () => {
    // This is how the corpus writes placeholders everywhere, and it must stay free.
    expect(leakingLinesIn("x.md", "written to `library/<slug>/` by the ingester")).toEqual([]);
  });

  it("a fenced region is not markdown, so its contents cannot trip this", () => {
    const src = ["```yaml", "<slide>: 3", "```", "after the fence"].join("\n");
    expect(leakingLinesIn("x.md", src)).toEqual([]);
  });

  it("a tilde fence closes only on a tilde fence", () => {
    const src = ["~~~", "<slide>", "~~~"].join("\n");
    expect(leakingLinesIn("x.md", src)).toEqual([]);
  });

  it("front matter is YAML and kramdown never sees it", () => {
    const src = ["---", "title: <slide> something", "---", "body"].join("\n");
    expect(leakingLinesIn("x.md", src)).toEqual([]);
  });

  it("an html comment is not a tag", () => {
    expect(leakingLinesIn("x.md", "<!-- marker:begin -->")).toEqual([]);
  });

  it("an INDENTED code block cannot trip it — the column-0 rule pays for itself", () => {
    expect(leakingLinesIn("x.md", "    <slide> inside an indented block")).toEqual([]);
  });
});

describe("scope", () => {
  it("excludes the generated trees, because those must never be hand-edited", () => {
    // AGENTS.md: "Never hand-edit either generated dir." A finding there names a
    // file nobody may fix while the source that produced it goes unreported.
    expect(GENERATED_SEGMENTS).toContain("/reference/skill-instructions/");
    const files = markdownSources("cat-harness/docs").map((p) => p.replace(/\\/g, "/"));
    expect(files.length).toBeGreaterThan(50);
    expect(files.some((f) => f.includes("docs/reference/skill-instructions/"))).toBe(false);
  });

  it("the html allow-list carries the elements this corpus actually opens lines with", () => {
    for (const t of ["caption", "details", "summary", "div", "table", "figure"]) {
      expect(MARKDOWN_HTML_NAMES.has(t)).toBe(true);
    }
    expect(MARKDOWN_HTML_NAMES.has("slide")).toBe(false);
  });
});
