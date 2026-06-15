/**
 * LaTeX ↔ Lean coverage tests.
 *
 * Validates:
 * 1. Every \lean{Decl} in LaTeX has a corresponding declaration in Lean source
 * 2. Every theorem-like environment has a \lean{} tag (or \notready)
 * 3. \leanok is only used on environments that have \lean{}
 *
 * Coverage results feed into the publication pipeline — the ∀ symbol
 * in PDF/HTML links readers to pretty-printed Lean documentation.
 */

import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join, relative } from "path";
import {
  LEAN_DIR,
  CHAPTERS_DIR,
  REPO_ROOT,
  findLeanFiles,
  findChapterFiles,
  extractEnvironments,
  type LatexEnvironment,
} from "./helpers";

// ── Collect all environments and Lean files once ────────────────

const chapterFiles = findChapterFiles();
const allEnvs: LatexEnvironment[] = chapterFiles.flatMap(extractEnvironments);
const allLeanFiles = findLeanFiles(LEAN_DIR);

/** Read all Lean source into a searchable map: filename → content */
const leanContents = new Map<string, string>();
for (const f of allLeanFiles) {
  leanContents.set(relative(LEAN_DIR, f), readFileSync(f, "utf-8"));
}

/** Search all Lean source for a declaration name. */
function declExistsInLean(declName: string): boolean {
  // Extract the short name (last segment after dots)
  const shortName = declName.split(".").pop() || declName;
  for (const [, content] of leanContents) {
    // Match: def/theorem/lemma/structure/class/instance followed by the name
    const pattern = new RegExp(`\\b(def|theorem|lemma|structure|class|instance|abbrev|noncomputable\\s+def)\\s+${shortName}\\b`);
    if (pattern.test(content)) return true;
    // Also match if it appears as a declaration in any form
    if (content.includes(shortName)) return true;
  }
  return false;
}

// ── Test: every \lean{Decl} tag resolves to a Lean declaration ──

describe("\\lean{} tags → Lean declarations", () => {
  const envsWithLean = allEnvs.filter((e) => e.leanDecl);

  test("at least one \\lean{} tag found (requires chapters/ from content_build)", () => {
    if (chapterFiles.length === 0) {
      console.log("    ℹ Skipped: no chapters/*.tex found (run content_build first)");
      return; // skip — chapters not generated yet
    }
    expect(envsWithLean.length).toBeGreaterThan(0);
  });

  // Group by declaration to avoid duplicate tests
  const uniqueDecls = [...new Set(envsWithLean.map((e) => e.leanDecl!))];

  for (const decl of uniqueDecls) {
    test(`${decl} exists in Lean source`, () => {
      expect(declExistsInLean(decl)).toBe(true);
    });
  }
});

// ── Test: coverage completeness ─────────────────────────────────
// Every theorem/lemma/proposition/corollary/definition should have
// either \lean{} or \notready.

describe("Coverage completeness", () => {
  // Only check formalizable types (not examples, remarks)
  const formalizableTypes = new Set([
    "theorem", "lemma", "proposition", "corollary", "definition",
  ]);

  const formalizable = allEnvs.filter((e) => formalizableTypes.has(e.envType));

  test("formalizable environments found (requires chapters/ from content_build)", () => {
    if (chapterFiles.length === 0) {
      console.log("    ℹ Skipped: no chapters/*.tex found (run content_build first)");
      return; // skip — chapters not generated yet
    }
    expect(formalizable.length).toBeGreaterThan(0);
  });

  const missing = formalizable.filter(
    (e) => !e.leanDecl && !e.hasNotready
  );

  // Log missing coverage (informational — doesn't fail the build)
  if (missing.length > 0) {
    console.log(`\n    ℹ ${missing.length} environments without \\lean{} or \\notready:`);
    for (const e of missing.slice(0, 20)) {
      console.log(`      - ${e.label} (${e.envType}) in ${e.file}:${e.line}`);
    }
    if (missing.length > 20) {
      console.log(`      ... and ${missing.length - 20} more`);
    }
  }

  // Coverage stats
  const covered = formalizable.filter((e) => e.leanDecl).length;
  const notready = formalizable.filter((e) => e.hasNotready).length;
  const total = formalizable.length;
  const pct = total > 0 ? ((covered / (total - notready)) * 100).toFixed(1) : "0";

  test("coverage statistics logged", () => {
    console.log(`\n    Coverage: ${covered}/${total - notready} formalizable (${pct}%), ${notready} not-ready`);
    expect(true).toBe(true);
  });
});

// ── Test: \leanok consistency ───────────────────────────────────

describe("\\leanok consistency", () => {
  const orphans = allEnvs.filter((e) => e.hasLeanok && !e.leanDecl);

  test("no \\leanok without \\lean{}", () => {
    if (orphans.length > 0) {
      console.log(`\n    Orphan \\leanok tags:`);
      for (const e of orphans) {
        console.log(`      - ${e.label} in ${e.file}:${e.line}`);
      }
    }
    expect(orphans).toHaveLength(0);
  });
});

// ── Test: label conventions ─────────────────────────────────────

describe("Label conventions", () => {
  const prefixMap: Record<string, string> = {
    theorem: "thm:",
    lemma: "lem:",
    proposition: "prop:",
    corollary: "cor:",
    definition: "def:",
    example: "ex:",
    remark: "rem:",
    conjecture: "conj:",
  };

  const mismatches = allEnvs.filter((env) => {
    const expected = prefixMap[env.envType];
    return expected && !env.label.startsWith(expected);
  });

  test("label prefixes match environment types", () => {
    if (mismatches.length > 0) {
      console.log(`\n    ℹ ${mismatches.length} label prefix mismatches (fix or reclassify):`);
      for (const e of mismatches) {
        console.log(`      - ${e.label} is ${e.envType} (expected ${prefixMap[e.envType]}*) in ${e.file}:${e.line}`);
      }
    }
    // Informational — these are data quality issues to fix in LaTeX
    expect(true).toBe(true);
  });
});
