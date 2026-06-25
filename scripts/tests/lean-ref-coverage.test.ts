/**
 * Regression tests for §7c Lean library-tree QA coverage.
 *
 * Locks in three properties so they cannot silently regress:
 *
 *   1. Candidate-1 (sibling) → candidate-2 (library/Lake tree) `lean.ref`
 *      resolution via the SINGLE resolver `resolveCanonicalLean`, and that
 *      the q-usage / wall-side checkers audit the *resolved* library file
 *      (not just a chapter-dir sibling). This is the coverage the
 *      `2026-06-25-lean-library-tree-7c-coverage-gap` audit feared was
 *      missing — it is present and proven here.
 *   2. Orphan library-tree coverage: Lean files referenced by no block are
 *      audited with content-based, chapter-INDEPENDENT checkers only
 *      (CLAUDE.md §7c — never infer the regime from the lean-tree path).
 *   3. Hygiene guards: no imports reference the non-existent
 *      `folio-assistant/schemas/...` path, and `q-usage-audit` carries no
 *      private re-implementation of the resolver/walker (single source of
 *      truth lives in `qa-utils`).
 *
 * Deliberately does NOT import `./helpers` (it pulls an optional
 * `@unified-latex` dep absent in some envs); these tests are self-contained.
 *
 *     cd scripts/tests && bun test lean-ref-coverage.test.ts
 */

import { describe, test, expect } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readdirSync,
  readFileSync,
  statSync,
} from "fs";
import { tmpdir } from "os";
import { join, resolve, relative } from "path";

import {
  walkBlocks,
  resolveCanonicalLean,
  listPackageLeanFiles,
} from "../../content/pipeline/qa-utils.ts";
import { checkWallSide } from "../../content/pipeline/qa-checkers-voice.ts";
import { checkQUsageArchimedeanInCategoricalChapter } from "../../content/pipeline/qa-checkers-q-usage.ts";
import { scanOrphanLeanFiles } from "../../content/pipeline/q-usage-audit.ts";
import { configureLeanPackages } from "../../schemas/lean-packages.ts";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");

// ── Fixture helpers ─────────────────────────────────────────────

/** Create a throwaway workspace with a `content/<paper>` tree + a `lean/` Lake tree. */
function makeWorkspace(): { tmp: string; content: string; lake: string } {
  const tmp = mkdtempSync(join(tmpdir(), "leancov-"));
  const content = join(tmp, "content", "quantum-observable-universe");
  const lake = join(tmp, "lean");
  mkdirSync(content, { recursive: true });
  mkdirSync(lake, { recursive: true });
  // Register the qou package pointing at this workspace's Lake tree.
  // lakeRoot is absolute, so resolve() ignores any repoRoot prefix.
  configureLeanPackages([
    { name: "qou", paperDir: "quantum-observable-universe", lakeRoot: lake, lib: "QOU" },
  ]);
  return { tmp, content, lake };
}

function writeLake(lake: string, modRelPath: string, body: string): string {
  const abs = join(lake, modRelPath);
  mkdirSync(join(abs, ".."), { recursive: true });
  writeFileSync(abs, body, "utf-8");
  return abs;
}

function writeBlock(
  content: string,
  chapter: string,
  name: string,
  opts: { ref?: string; sibling?: string; md?: string },
): { ts: string } {
  const dir = join(content, chapter);
  mkdirSync(dir, { recursive: true });
  const ts = join(dir, `${name}.ts`);
  const leanClause = opts.ref ? `\n  lean: { ref: "${opts.ref}" },` : "";
  writeFileSync(
    ts,
    `export default theorem({\n  label: "thm:${name}",${leanClause}\n});\n`,
    "utf-8",
  );
  if (opts.md) writeFileSync(join(dir, `${name}.md`), opts.md, "utf-8");
  if (opts.sibling) writeFileSync(join(dir, `${name}.lean`), opts.sibling, "utf-8");
  return { ts };
}

// A gratuitously-archimedean algebraic lemma (the §7c smell): det=1 is
// CommRing-universal, the [2]_q identity is over ℚ(q), yet typed over ℝ.
const ARCHIMEDEAN_BODY = [
  "import Mathlib",
  "/-- det = 1 is CommRing-universal -/",
  "theorem barEven_two (q : ℝ) : q + q = 2 * q := by ring",
  "theorem det_one (q : ℝ) : True := by linarith [sq_nonneg q]",
].join("\n");

// A clean generic-R lemma — correctly stated over a type variable.
const GENERIC_R_BODY = [
  "import Mathlib",
  "variable {R : Type*} [CommRing R]",
  "theorem genId (q : R) : q = q := rfl",
].join("\n");

// A genuinely mixed file: BOTH generic-R AND archimedean in one module.
const MIXED_BODY = [
  "import Mathlib",
  "variable {R : Type*} [CommRing R]",
  "theorem gen (q : R) : q = q := rfl",
  "theorem arch (q : ℝ) : 0 < q + 1 := by linarith [sq_nonneg q]",
].join("\n");

// ── 1. Candidate-2 resolution + audit of the resolved file ──────

describe("lean.ref candidate-2 (library tree) resolution", () => {
  test("sibling-less block resolves to the Lake-tree file and is audited", () => {
    const { tmp, content, lake } = makeWorkspace();
    try {
      writeLake(lake, "QOU/BraidKnot/TauQuantumIntegerForm.lean", ARCHIMEDEAN_BODY);
      const { ts } = writeBlock(content, "braids-and-knots", "tau-integer-form", {
        ref: "qou:QOU.BraidKnot.TauQuantumIntegerForm",
        md: "The bar-even identity holds over any commutative ring.\n",
      });

      const blocks = [...walkBlocks(join(tmp, "content"))];
      const blk = blocks.find((b) => b.ts === ts);
      expect(blk).toBeDefined();
      // Resolved to the library tree — NOT a chapter-dir sibling (none exists).
      expect(blk!.lean).toBeDefined();
      expect(blk!.lean!.replace(/\\/g, "/")).toContain(
        "/lean/QOU/BraidKnot/TauQuantumIntegerForm.lean",
      );

      // Both named checkers fail on the RESOLVED library content.
      expect(checkWallSide(blk!.md, blk!.lean).result).toBe("fail");
      const arch = checkQUsageArchimedeanInCategoricalChapter(
        blk!.md,
        blk!.ts,
        blk!.lean,
      );
      expect(arch.result).toBe("fail");
      // Chapter is content-based (from the block path), NOT the lean dir.
      expect(arch.chapter).toBe("braids-and-knots");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("direct module-path resolution (candidate 2a)", () => {
    const { tmp, lake } = makeWorkspace();
    try {
      const abs = writeLake(lake, "QOU/FluidDynamics/qBkm.lean", GENERIC_R_BODY);
      const got = resolveCanonicalLean("qou:QOU.FluidDynamics.qBkm", REPO_ROOT);
      expect(got).toBe(abs);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("sibling (candidate 1) wins over the library tree", () => {
    const { tmp, content, lake } = makeWorkspace();
    try {
      writeLake(lake, "QOU/BraidKnot/Dup.lean", ARCHIMEDEAN_BODY);
      const { ts } = writeBlock(content, "braids-and-knots", "dup", {
        ref: "qou:QOU.BraidKnot.Dup",
        sibling: GENERIC_R_BODY, // co-located sibling present
      });
      const blk = [...walkBlocks(join(tmp, "content"))].find((b) => b.ts === ts);
      expect(blk!.lean!.replace(/\\/g, "/")).toContain("/braids-and-knots/dup.lean");
      expect(blk!.lean!.replace(/\\/g, "/")).not.toContain("/lean/QOU/");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("unknown package / malformed ref resolves to undefined", () => {
    makeWorkspace();
    expect(resolveCanonicalLean("nope:QOU.X", REPO_ROOT)).toBeUndefined();
    expect(resolveCanonicalLean("malformed-no-colon", REPO_ROOT)).toBeUndefined();
    expect(resolveCanonicalLean(undefined, REPO_ROOT)).toBeUndefined();
  });
});

// ── 2. Orphan library-tree coverage ─────────────────────────────

describe("orphan library-tree coverage", () => {
  test("an orphan mixed-substrate file is flagged; a referenced file is not scanned", () => {
    const { tmp, lake } = makeWorkspace();
    try {
      const referenced = writeLake(lake, "QOU/Mathlib/Referenced.lean", GENERIC_R_BODY);
      writeLake(lake, "QOU/BraidKnot/OrphanMixed.lean", MIXED_BODY);

      // `referenced` stands in for a file some block's lean.ref resolves to.
      const covered = new Set<string>([resolve(referenced)]);
      const res = scanOrphanLeanFiles(covered);

      expect(res.scanned).toBe(2);
      expect(res.orphans).toBe(1); // only OrphanMixed
      const wall = res.findings.filter((f) => f.criterion === "wall-side-correct");
      expect(wall.length).toBe(1);
      expect(wall[0].file.replace(/\\/g, "/")).toContain("OrphanMixed.lean");
      // The referenced (clean, covered) file is never an orphan finding.
      expect(res.findings.every((f) => !f.file.includes("Referenced"))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("a clean generic-R orphan produces no findings (no path-based over-firing)", () => {
    const { tmp, lake } = makeWorkspace();
    try {
      // Lives under BraidKnot/ — the catch-all dir the path heuristic
      // over-fired on. Content is clean generic-R, so it must NOT flag.
      writeLake(lake, "QOU/BraidKnot/CleanGeneric.lean", GENERIC_R_BODY);
      const res = scanOrphanLeanFiles(new Set());
      expect(res.orphans).toBe(1);
      expect(res.findings.length).toBe(0);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("listPackageLeanFiles enumerates every .lean across the Lake tree", () => {
    const { tmp, lake } = makeWorkspace();
    try {
      writeLake(lake, "QOU/A/One.lean", GENERIC_R_BODY);
      writeLake(lake, "QOU/B/Two.lean", GENERIC_R_BODY);
      const files = listPackageLeanFiles(REPO_ROOT).map((f) => f.replace(/\\/g, "/"));
      expect(files.some((f) => f.endsWith("/QOU/A/One.lean"))).toBe(true);
      expect(files.some((f) => f.endsWith("/QOU/B/Two.lean"))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

// ── 3. Hygiene / single-source-of-truth guards ──────────────────

describe("import + SSOT hygiene guards", () => {
  function tsFilesUnder(dir: string): string[] {
    const out: string[] = [];
    const abs = join(REPO_ROOT, dir);
    const stack = [abs];
    while (stack.length) {
      const d = stack.pop()!;
      let entries: string[];
      try {
        entries = readdirSync(d);
      } catch {
        continue;
      }
      for (const e of entries) {
        if (e === "node_modules" || e === ".lake" || e.startsWith(".")) continue;
        const full = join(d, e);
        if (statSync(full).isDirectory()) stack.push(full);
        else if (e.endsWith(".ts")) out.push(full);
      }
    }
    return out;
  }

  test("no imports reference the non-existent folio-assistant/schemas path", () => {
    const offenders: string[] = [];
    for (const dir of ["content", "adapters", "schemas", "src", "scripts"]) {
      for (const f of tsFilesUnder(dir)) {
        const src = readFileSync(f, "utf-8");
        for (const line of src.split("\n")) {
          // Only flag actual import/export-from statements, not prose/comments.
          if (
            /^\s*(?:import|export)\b[^\n]*\bfrom\s+["'][^"']*folio-assistant\/schemas/.test(
              line,
            )
          ) {
            offenders.push(`${relative(REPO_ROOT, f)}: ${line.trim()}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  test("q-usage-audit carries no private resolver/walker (single source of truth)", () => {
    const src = readFileSync(
      join(REPO_ROOT, "content/pipeline/q-usage-audit.ts"),
      "utf-8",
    );
    expect(src).toContain('from "./qa-utils');
    expect(src).not.toContain("function resolveLakeTreePath");
    expect(src).not.toContain("function lakeTreeContains");
  });
});
