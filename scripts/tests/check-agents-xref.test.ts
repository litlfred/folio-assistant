/**
 * The cross-reference audit, and in particular that its middle state fires.
 *
 * The first implementation scanned `AGENTS.md` line by line and reported zero
 * folio-attributed citations, because the one attribution in the live file
 * wraps across two lines. A three-state check whose middle state can never
 * fire is a two-state check with a longer description — so that case is the
 * first thing asserted here, on a fixture that wraps exactly as the real file
 * does.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  SKILL_ROOTS,
  auditXrefs,
  folioAttributedSections,
  headingsOf,
  normalise,
} from "../check-agents-xref.js";

function repo(agentsMd: string, skills: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "xref-"));
  writeFileSync(join(root, "AGENTS.md"), agentsMd);
  for (const [rel, body] of Object.entries(skills)) {
    const p = join(root, "skills", rel);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, body);
  }
  return root;
}

describe("heading and name matching", () => {
  test("headings are read at every level", () => {
    expect(headingsOf("# a\n## b\n#### d\ntext\n")).toEqual(["a", "b", "d"]);
  });

  test("a cited name matches a heading that carries a gloss after it", () => {
    // Citations write the section's NAME; headings here nearly always append a
    // dash and an explanation. Exact matching would report almost everything
    // broken, which is a checker nobody runs twice.
    const md = "## Commit early, commit often, always PR (STRICT)\n";
    const found = auditXrefs(
      repo(md, { "s.md": 'See AGENTS.md §"Commit early, commit often".\n' }),
      SKILL_ROOTS,
    );
    expect(found.map((c) => c.verdict)).toEqual(["resolves"]);
  });

  test("normalise strips the formatting a citation and a heading disagree on", () => {
    expect(normalise('  `Foo` — “Bar”  ')).toBe("foo — bar");
  });
});

describe("the third state — a section this file hands to a folio", () => {
  // Verbatim shape of the live paragraph: the repository name ends one line and
  // the section reference begins the next.
  const WRAPPED = [
    "## Cross-references, so these do not drift",
    "",
    "`litlfred/qou`'s `AGENTS.md` carries the same first two rules for that folio —",
    '§"Branch + PR workflow" rule 0 (commit early / often / push) and rule 2.',
  ].join("\n");

  test("an attribution that WRAPS across lines is still found", () => {
    expect(folioAttributedSections(WRAPPED)).toContain("branch + pr workflow");
  });

  test("a citation of it is `folio`, not `unresolved`", () => {
    const found = auditXrefs(
      repo(WRAPPED, { "s.md": 'Operationalises AGENTS.md "Branch + PR workflow" rule 2.\n' }),
      SKILL_ROOTS,
    );
    expect(found.map((c) => c.verdict)).toEqual(["folio"]);
  });

  test("a section named in a paragraph with no folio in it is NOT attributed", () => {
    // Otherwise every `§` in the file would be waved through as somebody
    // else's, which is the silencing failure the audit exists to prevent.
    const md = '## Real\n\nSee §"Some Other Thing" for detail.\n';
    expect(folioAttributedSections(md).size).toBe(0);
  });
});

describe("unresolved", () => {
  test("a citation naming nothing here and nothing attributed is unresolved", () => {
    const found = auditXrefs(
      repo("## Real heading\n", { "s.md": 'Per AGENTS.md §"Critical-distance license".\n' }),
      SKILL_ROOTS,
    );
    expect(found).toEqual([
      { file: "skills/s.md", section: "Critical-distance license", verdict: "unresolved" },
    ]);
  });

  test("a bare mention of AGENTS.md naming no section is not a citation", () => {
    // The file is mentioned in 54 places and cited with a section in 20. Only
    // the latter can break when a section moves.
    const found = auditXrefs(
      repo("## Real\n", { "s.md": "AGENTS.md is the bootstrap pointer. Read it.\n" }),
      SKILL_ROOTS,
    );
    expect(found).toEqual([]);
  });

  test("a missing AGENTS.md throws rather than reporting a clean run", () => {
    // Could-not-check is never rendered as green; the CLI turns this into
    // exit 2, distinct from exit 1 for real findings.
    expect(() => auditXrefs(mkdtempSync(join(tmpdir(), "empty-")), SKILL_ROOTS)).toThrow();
  });
});

describe("the live corpus", () => {
  test("this repo's own citations are found and every one gets a verdict", () => {
    const found = auditXrefs(join(import.meta.dir, "..", ".."), SKILL_ROOTS);
    expect(found.length).toBeGreaterThan(10);
    expect(found.filter((c) => !c.verdict)).toEqual([]);
  });

  // WHAT THIS DELIBERATELY DOES NOT ASSERT, and why the first version was wrong.
  //
  // It required the live corpus to hold at least one `folio` and one `resolves`
  // citation, as a regression guard for the line-vs-paragraph scanning bug. It
  // failed within the hour — not because the detector broke, but because the
  // `1hsf` migration removed both: `todo-manager` stopped citing AGENTS.md for
  // its own rule, and `continual-progress` stopped naming a folio section.
  //
  // Both were improvements, and the test called them regressions. Pinning a
  // COVERAGE COUNT of the live corpus as a guard makes the corpus getting
  // better indistinguishable from the tool getting worse — the same mistake as
  // gating on `skill-in-role-or-process`, which this repo already declines to
  // make. The wrapping guard belongs on a fixture that pins the SHAPE, and it
  // is above: "an attribution that WRAPS across lines is still found".

});
