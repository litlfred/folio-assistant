/**
 * `lean-ref-coverage` tests whose subject is folio-assistant-sci's
 * contribution — the chapter profiles this instance contributes — moved here
 * from `cat-harness/scripts/tests/lean-ref-coverage.test.ts` (bean `ho66`).
 * The code under test is cat-harness's, imported DOWN; what it is held against
 * is this instance's, so standing alone cat-harness has nothing for these to
 * read. The rest of that file's tests stay there.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { walkBlocks } from "../../../cat-harness/content/pipeline/qa-utils.ts";
import { checkWallSide } from "../../../cat-harness/content/pipeline/qa-checkers-voice.ts";
import { checkQUsageArchimedeanInCategoricalChapter } from "../../../cat-harness/content/pipeline/qa-checkers-q-usage.ts";
// From `lean-formal-ref`, not `lean-packages`: importing it installs the Lean
// formalism layer into core's `formal-ref` injection point, and this suite
// exercises `resolveCanonicalLean` / `listPackageLeanFiles`, which are now
// core delegations to that layer. Configuring the package LIST alone leaves
// every resolution `undefined` — measured: 9 of these tests went red.
import { configureLeanPackages } from "../../../cat-harness/content/pipeline/lean-formal-ref.ts";
import { usePipelinePluginRegistry } from "../../../cat-harness/content/pipeline/pipeline-plugins";
import { useSciPipelinePlugins } from "./sci-consumer";

// The Lean lexer the q-usage checker scopes with is sci's contribution: loaded
// through a folio that depends on sci, not from whatever checkout is running.
beforeAll(useSciPipelinePlugins);
afterAll(() => usePipelinePluginRegistry(undefined));

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
});
