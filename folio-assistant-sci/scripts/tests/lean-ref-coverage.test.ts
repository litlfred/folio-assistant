/**
 * `lean-ref-coverage` tests whose subject is folio-assistant-sci's
 * contributions — `lean-formal-ref` (`resolveCanonicalLean`,
 * `listPackageLeanFiles`) and the chapter profiles — moved here from
 * `cat-harness-tools/scripts/tests/lean-ref-coverage.test.ts` (beans `ho66`
 * and `saqd`).
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";

import {
  walkBlocks,
  resolveCanonicalLean,
  listPackageLeanFiles,
} from "../../../cat-harness-tools/pipeline/qa-utils.ts";
import { scanOrphanLeanFiles } from "../../pipeline/q-usage-audit.ts";
import { checkWallSide } from "../../pipeline/qa-checkers-wall.ts";
import { checkQUsageArchimedeanInCategoricalChapter } from "../../pipeline/qa-checkers-q-usage.ts";
// From `lean-formal-ref`, not `lean-packages`: importing it installs the Lean
// formalism layer into core's `formal-ref` injection point, and this suite
// exercises `resolveCanonicalLean` / `listPackageLeanFiles`, which are now
// core delegations to that layer. Configuring the package LIST alone leaves
// every resolution `undefined` — measured: 9 of these tests went red.
import { configureLeanPackages } from "../../pipeline/lean-formal-ref.ts";
import { usePipelinePluginRegistry } from "../../../cat-harness-tools/pipeline/pipeline-plugins";
import { resetChapterProfiles } from "../../../cat-harness-tools/pipeline/chapter-profile-registry-di";
import { SCI_ROOT, useCategoricalChapters, useSciPipelinePlugins } from "./sci-consumer";

const INSTANCE_ROOT = SCI_ROOT;

// The Lean lexer the q-usage checker scopes with is sci's contribution: loaded
// through a folio that depends on sci, not from whatever checkout is running.
// The fixture's chapter is configured categorical here: no layer ships one.
beforeAll(() => {
  useSciPipelinePlugins();
  useCategoricalChapters("braids-and-knots");
});
afterAll(() => {
  usePipelinePluginRegistry(undefined);
  resetChapterProfiles();
});

// ── Fixture helpers ─────────────────────────────────────────────

/** Create a throwaway workspace with a `folio/<paper>` tree + a `lean/` Lake tree. */
function makeWorkspace(): { tmp: string; content: string; lake: string } {
  const tmp = mkdtempSync(join(tmpdir(), "leancov-"));
  const content = join(tmp, "folio", "quantum-observable-universe");
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

      const blocks = [...walkBlocks(join(tmp, "folio"))];
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
      const got = resolveCanonicalLean("qou:QOU.FluidDynamics.qBkm", INSTANCE_ROOT);
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
      const blk = [...walkBlocks(join(tmp, "folio"))].find((b) => b.ts === ts);
      expect(blk!.lean!.replace(/\\/g, "/")).toContain("/braids-and-knots/dup.lean");
      expect(blk!.lean!.replace(/\\/g, "/")).not.toContain("/lean/QOU/");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("decl-named ref resolves to the leaf decl file, NOT an import-only aggregator (candidate c)", () => {
    const { tmp, lake } = makeWorkspace();
    try {
      // An import-only aggregator sits at the ref's module path
      // (`QOU/BraidKnot.lean`), sharing its name with the `BraidKnot/`
      // subdirectory that holds the real decl file.
      writeLake(
        lake,
        "QOU/BraidKnot.lean",
        "import QOU.BraidKnot.BindingIsovectorChiralResidue\n",
      );
      // The decl lives in a leaf file whose basename ≠ the decl name.
      const leaf = writeLake(
        lake,
        "QOU/BraidKnot/BindingIsovectorChiralResidue.lean",
        [
          "import Mathlib",
          "namespace QOU.BraidKnot",
          "theorem binding_isovector_mirror_from_chiral {R : Type*} [CommRing R] :",
          "    True := trivial",
          "end QOU.BraidKnot",
        ].join("\n"),
      );
      const got = resolveCanonicalLean(
        "qou:QOU.BraidKnot.binding_isovector_mirror_from_chiral",
        INSTANCE_ROOT,
      );
      // Resolves to the decl-bearing leaf, not the aggregator.
      expect(got).toBe(leaf);
      expect((got ?? "").replace(/\\/g, "/")).not.toMatch(/\/QOU\/BraidKnot\.lean$/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("(a) direct module-path still wins when the module file declares the decl", () => {
    const { tmp, lake } = makeWorkspace();
    try {
      const modFile = writeLake(
        lake,
        "QOU/Basic.lean",
        "import Mathlib\nnamespace QOU\ntheorem foo : True := trivial\nend QOU\n",
      );
      // `QOU/Basic.lean` genuinely declares `foo` → candidate (a) returns it.
      expect(resolveCanonicalLean("qou:QOU.Basic.foo", INSTANCE_ROOT)).toBe(modFile);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("ref naming a nonexistent decl does NOT fall back to an import-only root", () => {
    const { tmp, lake } = makeWorkspace();
    try {
      // The library root is an import-only aggregator, exactly like qou's
      // 954-line `QOU.lean`. A ref whose decl exists nowhere parses with
      // module `QOU`, so its module-path IS this file.
      writeLake(lake, "QOU.lean", "import QOU.Some.Module\nimport QOU.Other\n");
      writeLake(lake, "QOU/Some/Module.lean", GENERIC_R_BODY);

      // Must be undefined (-> honest n/a), never the aggregator: returning it
      // makes every checker pass vacuously on a list of imports (qou-cu0a).
      expect(resolveCanonicalLean("qou:QOU.NoSuchDeclAnywhere", INSTANCE_ROOT)).toBeUndefined();

      // But a module-path file that DOES declare something still resolves —
      // the fallback is narrowed, not removed.
      const real = resolveCanonicalLean("qou:QOU.Some.Module.genId", INSTANCE_ROOT);
      expect(real).toBeDefined();
      expect(real!.replace(/\\/g, "/")).toContain("/QOU/Some/Module.lean");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("unknown package / malformed ref resolves to undefined", () => {
    makeWorkspace();
    expect(resolveCanonicalLean("nope:QOU.X", INSTANCE_ROOT)).toBeUndefined();
    expect(resolveCanonicalLean("malformed-no-colon", INSTANCE_ROOT)).toBeUndefined();
    expect(resolveCanonicalLean(undefined, INSTANCE_ROOT)).toBeUndefined();
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
      const files = listPackageLeanFiles(INSTANCE_ROOT).map((f) => f.replace(/\\/g, "/"));
      expect(files.some((f) => f.endsWith("/QOU/A/One.lean"))).toBe(true);
      expect(files.some((f) => f.endsWith("/QOU/B/Two.lean"))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
