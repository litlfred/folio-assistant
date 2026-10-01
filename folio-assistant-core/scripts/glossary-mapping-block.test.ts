/**
 * The glossary page SHOWS the three mapping states, and says when nobody asked.
 *
 * @module scripts/glossary-mapping-block.test
 * @graphNode none — a test
 *
 * Bean `7wou`. The page renders what `check:term-mapping` found; it does not
 * recompute it. What must not regress is the distinction the whole check
 * exists for: an `undetermined` count is not an `unmapped` one, and a missing
 * result is neither.
 */
import { describe, expect, test } from "bun:test";

import { codeSpans, mappingBlock, mappingStates } from "./glossary-page.ts";

describe("codeSpans — bean `mylx`, no raw backticks on a rendered page", () => {
  test("backticks become code spans", () => {
    expect(codeSpans("a `b` c")).toBe("a <code>b</code> c");
  });

  test("escaping happens FIRST, so a reason cannot smuggle markup in", () => {
    const out = codeSpans("<script>alert(1)</script> and `x`");
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
    expect(out).toContain("<code>x</code>");
  });

  test("an unpaired backtick is left alone rather than opening a tag", () => {
    expect(codeSpans("a ` b")).toBe("a ` b");
  });
});

describe("the committed result, read the way the page reads it", () => {
  const states = mappingStates();

  test("there is one, and it carries both targets", () => {
    // If this goes undefined the page silently switches to "not checked",
    // which is correct behaviour and a broken corpus — so assert it here.
    expect(states).toBeDefined();
    expect(new Set(states!.map((s) => s.target))).toEqual(new Set(["skos", "fhir"]));
  });

  test("every row carries all three counts, and they sum to that scheme's candidates", () => {
    for (const s of states!) {
      expect(s.mapped + s.unmapped + s.undetermined).toBeGreaterThan(0);
      expect(s.mapped).toBeGreaterThanOrEqual(0);
    }
  });

  test("an undetermined row states WHY, and an unmapped one does not need to", () => {
    // The load-bearing distinction: silence is not a negative answer.
    for (const s of states!) {
      if (s.undetermined > 0) expect(s.reason).toBeTruthy();
    }
  });

  test("the two targets cover the same schemes — neither is quietly skipped", () => {
    const of = (t: string) => new Set(states!.filter((s) => s.target === t).map((s) => s.scheme));
    expect(of("skos")).toEqual(of("fhir"));
  });

  test("a mapped row names its terms, so the page can badge exactly those", () => {
    for (const s of states!) {
      expect(s.mappedTerms.length).toBe(s.mapped);
    }
  });
});

describe("the rendered pages say it", () => {
  const read = async (p: string) => await Bun.file(p).text();

  test("every glossary page carries the mapping table", async () => {
    for (const p of [
      "cat-harness/docs/glossary/index.md",
      "cat-harness/docs/glossary/dmn-decisions/index.md",
      "cat-harness/docs/glossary/skills/index.md",
    ]) {
      const html = await read(p);
      expect(html, `${p} has no mapping table`).toContain('class="fa-gloss-mapping"');
      expect(html).toContain("why undetermined");
      // Said in WORDS, not only by a column heading.
      expect(html).toContain("Undetermined is never");
    }
  });

  test("a per-type page scopes its counts to its own terms", async () => {
    // dmn-decisions holds 9 terms; the index covers every scheme. If the
    // block ignored its `schemes` argument both would print the same total,
    // which is the bug this catches.
    const dmn = await read("cat-harness/docs/glossary/dmn-decisions/index.md");
    const idx = await read("cat-harness/docs/glossary/index.md");
    const total = (html: string) =>
      Number(/<td><code>skos<\/code><\/td><td>(\d+)<\/td><td>(\d+)<\/td>/.exec(html)?.[2] ?? "-1");
    expect(total(dmn)).toBeGreaterThan(0);
    expect(total(idx)).toBeGreaterThan(total(dmn));
  });

  test("no raw backtick survives inside the mapping table", async () => {
    const html = await read("cat-harness/docs/glossary/index.md");
    const table = /<table class="fa-gloss-mapping">[\s\S]*?<\/table>/.exec(html)?.[0] ?? "";
    expect(table.length).toBeGreaterThan(0);
    expect(table).not.toContain("`");
  });
});

describe("the third state at the PAGE level — nobody asked", () => {
  const row = (over: Record<string, unknown> = {}) => ({
    scheme: "kg-skills", target: "skos", mapped: 0, unmapped: 3, undetermined: 0,
    mappedTerms: [], ...over,
  }) as never;

  test("no result at all says NOT CHECKED, and never renders as zero found", () => {
    // The `dh4f` guard. A page that printed "0 mapped" over a file nobody
    // wrote would present could-not-determine as a determined empty.
    const html = mappingBlock(undefined, ["kg-skills"]);
    expect(html).toContain("Not checked");
    expect(html).toContain("unknown");
    expect(html).toContain("bun run term:mapping");
    expect(html).not.toContain("<table");
  });

  test("a result that covers none of this page's schemes renders nothing", () => {
    // Not "0 of 0" — there is no question to answer for this page.
    expect(mappingBlock([row()], ["kg-tools"])).toBe("");
  });

  test("counts are summed across the page's schemes, per target", () => {
    const html = mappingBlock(
      [row({ scheme: "a", unmapped: 2 }), row({ scheme: "b", unmapped: 5 })],
      ["a", "b"],
    );
    expect(html).toContain("<td>7</td>");
  });

  test("a reason on any scheme is surfaced for the target", () => {
    const html = mappingBlock(
      [row({ target: "fhir", unmapped: 0, undetermined: 4, reason: "host refused" })],
      ["kg-skills"],
    );
    expect(html).toContain("host refused");
  });
});
