/**
 * The declaration-filename check, and the boundary of what it claims.
 *
 * Bean `jijc`. Ten tests. **Measured by stubbing both halves of the rule to
 * `false`: 5 go red, 5 stay green.** The five that stay green are the
 * false-positive guards — they pass whether or not the rule works, and exist
 * so that narrowing the rule later cannot quietly re-admit a class that was
 * measured and closed.
 *
 * That ratio is deliberate, and it is the one `sfhr` shipped: a check whose
 * tests all assert the happy path is a check whose false positives nobody has
 * looked for. The count here is stated because it was RUN, not estimated — an
 * earlier draft of this header said "three", which is the failure this
 * repository keeps paying for.
 *
 * ## The literals in this file are DATA and must stay literal
 *
 * Every `"harness.json"` below sits inside a fixture's **source text** — the
 * code this checker reads, not code this file executes. Substituting the
 * constant into them makes each test feed the checker a string that no longer
 * contains what the checker looks for, so the suite passes while asserting
 * nothing.
 *
 * Stated because it already happened: the ~100-fixture migration the owner
 * ruled on 2026-09-21 was run as a blanket replace and rewrote exactly these,
 * silently gutting the four detection tests. **A blanket migration cannot tell
 * a literal that IS the code from a literal DESCRIBING code**, and this is the
 * file where the difference lives.
 *
 * @module folio-assistant/scripts/tests/check-declaration-filename
 */

import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  checkDeclarationFilename,
  classifyMarkdownLine,
  classifyWorkflowLine,
  markdownUses,
  workflowUses,
} from "../check-declaration-filename.ts";

/**
 * A tree holding one source file at `<root>/<rel>`.
 *
 * Defaults to placing it **inside the owning instance**, because that is where
 * a failing bypass has to live: a site outside it is classified as
 * cross-instance and counted rather than failed. An earlier draft of this
 * helper wrote to a bare `src/`, and all four detection tests went red for
 * that reason alone — the rule was right and the fixture was modelling a tree
 * this repository does not have.
 */
function fixture(rel: string, src: string, instance = "cat-harness"): string {
  const root = mkdtempSync(join(tmpdir(), "declfile-"));
  const full = join(root, instance, rel);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, src);
  return root;
}

describe("a path to the declaration is built from the constant", () => {
  test("a whole-value string literal is a bypass", () => {
    const r = checkDeclarationFilename(fixture("src/a.ts", 'const p = join(root, "harness.json");\n'));
    expect(r.bypasses).toHaveLength(1);
    expect(r.bypasses[0]!.kind).toBe("literal");
    expect(r.bypasses[0]!.line).toBe(1);
  });

  test("a single-quoted literal is the same bypass — the repo's quote style is not the rule", () => {
    const r = checkDeclarationFilename(fixture("src/a.ts", "const p = join(root, 'harness.json');\n"));
    expect(r.bypasses).toHaveLength(1);
  });

  test("a map KEY is a bypass too — it is still the filename, not a sentence", () => {
    const r = checkDeclarationFilename(fixture("src/a.ts", 'out.set("harness.json", "the root declaration");\n'));
    expect(r.bypasses).toHaveLength(1);
  });

  test("an interpolated template builds a path, so it is a bypass", () => {
    // Measured at ZERO on the real corpus. Implemented and tested anyway: the
    // class is reachable the moment somebody writes it, and a rule that has
    // never fired cannot be distinguished from a rule that cannot fire.
    const r = checkDeclarationFilename(fixture("src/a.ts", "const p = `${dir}/harness.json`;\n"));
    expect(r.bypasses).toHaveLength(1);
    expect(r.bypasses[0]!.kind).toBe("template");
  });

  // ── False-positive guards. Each one closes a class that was MEASURED on the
  // real corpus, and each must keep passing if the rule is ever narrowed. ──

  test("GUARD: prose in a message string is counted, never failed", () => {
    const src = "console.error(`no harness.json at ${root}; nothing to resolve.`);\n";
    const r = checkDeclarationFilename(fixture("src/a.ts", src));
    expect(r.bypasses).toHaveLength(0);
    expect(r.counted.prose).toBe(1);
  });

  test("GUARD: a STATIC path inside backticks is prose, not construction", () => {
    // The first draft of the template rule accepted a bare `/` before the
    // filename and reported this shape out of a tool description. Only an
    // INTERPOLATION is something a constant substitutes into.
    const src = 'const d = "a repo carrying `cat-harness/harness.json` is not blank";\n';
    const r = checkDeclarationFilename(fixture("src/a.ts", src));
    expect(r.bypasses).toHaveLength(0);
  });

  test("GUARD: `docs/_data/harness.json` is a DIFFERENT FILE and must not be reported", () => {
    // Found by that same false positive, and worth more than the rule it
    // corrected: the Jekyll data file shares the basename, is not an instance
    // declaration, and must NOT be renamed under the REPLACE ruling.
    const src = "const msg = `docs/_data/harness.json is stale.`;\n";
    const r = checkDeclarationFilename(fixture("src/a.ts", src));
    expect(r.bypasses).toHaveLength(0);
  });

  test("GUARD: a doc comment naming the file is prose", () => {
    const r = checkDeclarationFilename(fixture("src/a.ts", " * An instance carries `harness.json`.\n"));
    expect(r.bypasses).toHaveLength(0);
    expect(r.counted.prose).toBe(1);
  });

  test("GUARD: a test fixture is counted and does NOT fail the gate", () => {
    // An open judgement on `jijc`, not a finding. A fixture writing the file
    // the code under test looks for has a real argument for staying pinned:
    // route it through the constant and it passes vacuously after a rename.
    const r = checkDeclarationFilename(
      fixture("src/a.test.ts", 'writeFileSync(join(root, "harness.json"), "{}");\n'),
    );
    expect(r.bypasses).toHaveLength(0);
    expect(r.counted.tests).toBe(1);
  });

  test("GUARD: a bypass OUTSIDE the owning instance is counted, not failed", () => {
    // Measured on the real corpus: two, both in folio-assistant-core, which
    // imports nothing from cat-harness. Using the constant there would be this
    // repo's first cross-instance import; a second copy would be two
    // constants. That is the split's decision, not this check's — but it is
    // REPORTED with its locations, because silently excluding it would be the
    // `dh4f` shape this repository keeps paying for.
    const r = checkDeclarationFilename(
      fixture("schemas/a.ts", 'const p = join(root, "harness.json");\n', "folio-assistant-core"),
    );
    expect(r.bypasses).toHaveLength(0);
    expect(r.crossInstance).toHaveLength(1);
    expect(r.crossInstance[0]!.file).toBe("folio-assistant-core/schemas/a.ts");
  });

  test("examining nothing is not a pass", () => {
    const empty = mkdtempSync(join(tmpdir(), "declfile-empty-"));
    expect(checkDeclarationFilename(empty).filesRead).toBe(0);
    // The runner exits non-zero on filesRead === 0 — see the module's main.
  });
});

// ── The YAML half. It was one bucket until the workflow half of `jijc`. ─────
//
// These literals are DATA too — see this module's header. Each is a workflow
// line the classifier reads, not a line this file executes.

describe("a workflow line is classified, not merely counted", () => {
  test("a step that READS the retired declaration fails", () => {
    // Falsified by planting exactly this in `health-check.yml` before any of
    // the classifier existed: the check printed "✓ no call site names the
    // retired name" and exited 0.
    expect(classifyWorkflowLine("        run: cat cat-harness/harness.json")).toBe("use");
  });

  test("a comment naming it is prose — a rename REWORDS these", () => {
    expect(classifyWorkflowLine("      # the `stub` in harness.json")).toBe("prose");
    expect(classifyWorkflowLine("# Declared in `harness.json` as the `health` graph.")).toBe("prose");
  });

  test("the Jekyll data file is its own class, and outranks prose", () => {
    // Both a comment AND an exemption. The exemption is the part a rename
    // needs to hear: `docs/_data/harness.json` must NOT be renamed.
    expect(classifyWorkflowLine("          # and `docs/_data/harness.json` is a")).toBe("jekyll-data");
    expect(classifyWorkflowLine("        run: cat cat-harness/docs/_data/harness.json")).toBe("jekyll-data");
  });

  test("a line not naming it at all classifies as null, not as clean", () => {
    expect(classifyWorkflowLine("      - name: Checkout")).toBeNull();
  });
});

describe("GUARD: `cat-harness.json` CONTAINS `harness.json`", () => {
  test("the CURRENT declaration is not a reference to the retired one", () => {
    // Load-bearing, and found by writing the fix rather than by foresight: the
    // corrected `docs-site.yml` comment names `cat-harness/cat-harness.json`,
    // and a bare indexOf counted the correction as the defect. Same collision
    // class as `docs/_data`, one character further left.
    expect(classifyWorkflowLine("      # the `stub` in cat-harness/cat-harness.json")).toBeNull();
    expect(classifyWorkflowLine("        run: cat cat-harness/cat-harness.json")).toBeNull();
  });

  test("...and the boundary does not swallow the real thing", () => {
    // The direction that matters: narrowing for the collision must not make
    // the case the gate exists for invisible.
    expect(classifyWorkflowLine("        run: cat cat-harness/harness.json")).toBe("use");
    expect(classifyWorkflowLine("        run: cat harness.json")).toBe("use");
  });

  test("a second occurrence in an already-seen file is its own finding", () => {
    // The old counter counted FILES, so a bypass added to a file already on
    // the list did not move the number either.
    const a = classifyWorkflowLine("        run: cat cat-harness/harness.json");
    const b = classifyWorkflowLine("        run: cat folio-assistant/harness.json");
    expect([a, b]).toEqual(["use", "use"]);
  });
});

/**
 * ONE scan of this repository, shared by the three tests that need it.
 *
 * Each of them called `checkDeclarationFilename()` itself, so the same walk of
 * ~4,100 markdown files and every workflow ran three times, at roughly five
 * seconds each — against bun's five-second per-test budget. It passed on a
 * quiet machine and failed on a busy one, and which of the three went red
 * varied between identical runs.
 *
 * It tipped over on 2026-09-24 when promoting `arxiv-2510.21603v1` added that
 * paper's 22 sections to the corpus (4,071 → 4,093 files). That is the point
 * worth recording: NOTHING WAS WRONG WITH THE SCAN OR THE PROMOTION. The cost
 * grows with the corpus, every promotion adds to it, and three copies of one
 * pure read is what made an ordinary increment look like a regression.
 *
 * Lazy rather than top-level so the fixture tests above still run instantly
 * when this file is filtered to one of them.
 *
 * The three tests that use it also carry {@link SCAN_TIMEOUT}. Hoisting cut
 * the file from 15.2s to 4.6s in isolation, and 4.6s under bun's 5s default is
 * a test that passes alone and fails inside the full suite — which is what it
 * then did, at 6.3s. An explicit budget is the honest fix: this is a whole-repo
 * read whose cost grows with the corpus, so five seconds was never the right
 * number for it, and raising it weakens no assertion.
 */
/** Generous on purpose. A timeout here must mean "wedged", not "the repo grew". */
const SCAN_TIMEOUT = 60_000;
let REPO_SCAN: ReturnType<typeof checkDeclarationFilename> | undefined;
const repoScan = () => (REPO_SCAN ??= checkDeclarationFilename());

describe("the workflow scan reports unknown, never zero", () => {
  test("a checkout with no .github/workflows gives null, and null is not clean", () => {
    const empty = mkdtempSync(join(tmpdir(), "declfile-noyml-"));
    mkdirSync(join(empty, "src"), { recursive: true });
    writeFileSync(join(empty, "src", "a.ts"), "export const x = 1;\n");
    const r = checkDeclarationFilename(empty);
    expect(r.workflows).toBeNull();
    // `workflowUses` must not turn unknown into an empty finding list that a
    // caller reads as a pass; the runner exits 2 on null before it gets here.
    expect(workflowUses(r)).toEqual([]);
  });

  test("this repository's own workflows carry no USE", () => {
    const r = repoScan();
    expect(workflowUses(r).map((w) => `${w.file}:${w.line}`)).toEqual([]);
  }, SCAN_TIMEOUT);
});

/**
 * The markdown half. Bean `vzur`, turned on once its backlog was cleared.
 *
 * Prose was exempt on the TypeScript side because "a rename REWORDS these",
 * which is sound for a doc comment and not for a skill — a skill's whole job
 * is telling a reader where to look, and a REVERSAL rewords nothing.
 */
describe("markdown lines are classified, not matched", () => {
  const NO_RECORDS: string[] = [];
  const md = (rel: string, line: string, para?: string) =>
    classifyMarkdownLine(rel, line, NO_RECORDS, para ?? line);

  test("a current-path claim in a skill FAILS", () => {
    expect(md("skills/x.md", "declared in `harness.json` at the root")).toBe("use");
  });

  test("a line naming no declaration is not a finding at all", () => {
    expect(md("skills/x.md", "nothing to see here")).toBeNull();
  });

  test("`docs/_data/harness.json` is Jekyll's and must NOT be renamed", () => {
    expect(md("docs/x.md", "see `docs/_data/harness.json` for the nav")).toBe("jekyll-data");
  });

  test("a declared record directory is correct history", () => {
    expect(classifyMarkdownLine("beans/defs/x.md", "we used `harness.json`", ["beans/"])).toBe("record");
  });

  test("a generated reference follows its source rather than failing", () => {
    // The prefixes are DERIVED from each instance's `siteDirFor()`, so the
    // test supplies one rather than assuming this repo's layout.
    const gen = ["cat-harness/docs/reference/skill-instructions/"];
    expect(
      classifyMarkdownLine(
        "cat-harness/docs/reference/skill-instructions/x.md",
        "`harness.json`",
        NO_RECORDS,
        "`harness.json`",
        gen,
      ),
    ).toBe("generated");
  });

  test("history is recognised by a CURRENT name in the paragraph, not by tense", () => {
    const para = "It is `<name>.json` now.\nThat argument ran: the file stays `harness.json`.";
    expect(md("skills/x.md", "That argument ran: the file stays `harness.json`.", para)).toBe("historical");
  });

  test("...and a paragraph naming ONLY the retired word cannot excuse itself", () => {
    const para = "Open `harness.json`.\nIt lists the directories `harness.json` declares.";
    expect(md("skills/x.md", "It lists the directories `harness.json` declares.", para)).toBe("use");
  });

  test("a concrete sibling declaration counts as the current name", () => {
    const para = "`cat-harness/cat-harness.json` replaced `harness.json`.";
    expect(md("skills/x.md", para, para)).toBe("historical");
  });
});

/**
 * `harness.jsonld` is not `harness.json`, and the bean that added the LEFT
 * boundary named it in the same sentence as `cat-harness.json` before
 * guarding only the side it had a failing example for. The markdown scanner
 * found it on its first run.
 */
describe("the retired name is matched as a FILENAME, on both sides", () => {
  const md = (line: string) => classifyMarkdownLine("skills/x.md", line, []);

  test("a published rendering is not the retired declaration", () => {
    expect(md("So `…/folio-assistant/harness.jsonld` is this instance's rendering")).toBeNull();
  });

  test("the CURRENT declaration is not the retired one either", () => {
    expect(md("open `cat-harness/cat-harness.json` first")).toBeNull();
  });

  test("...but the retired name itself still matches, bounded either side", () => {
    expect(md("open `harness.json` first")).toBe("use");
    expect(md("open `cat-harness/harness.json` first")).toBe("use");
  });
});

describe("the markdown corpus, on this repository", () => {
  test("carries no STALE PATH", () => {
    const r = repoScan();
    expect(markdownUses(r).map((m) => `${m.file}:${m.line}`)).toEqual([]);
  }, SCAN_TIMEOUT);

  test("and was actually examined — an empty corpus is not a pass", () => {
    const r = repoScan();
    expect(r.markdown).not.toBeNull();
    expect(r.markdown!.length).toBeGreaterThan(0);
  }, SCAN_TIMEOUT);
});
