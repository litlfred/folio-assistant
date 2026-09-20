/**
 * The sweep exists for ONE case, so the tests prove that case rather than
 * exercising the happy path.
 *
 * `no-orphan-sidecar` reaches a mirror directory only by loading the block
 * directory it mirrors. Delete that directory and the mirror is unreachable
 * forever. Bean `pb2b`.
 */
import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { blockQaPath } from "../../content/pipeline/qa-paths";
import { orphanVerdicts } from "../../content/pipeline/orphan-verdict-sweep";

function inTmp(run: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "orphan-sweep-"));
  try {
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/** Write a verdict for `folio/<chapter>/<stem>`, with or without its manifest. */
function place(root: string, chapter: string, stem: string, opts: { manifest: boolean }): void {
  const blockRoot = join(root, "folio", chapter, stem);
  if (opts.manifest) {
    mkdirSync(dirname(blockRoot), { recursive: true });
    writeFileSync(blockRoot + ".ts", "export default {};\n");
  }
  const v = blockQaPath(root, blockRoot);
  mkdirSync(dirname(v), { recursive: true });
  writeFileSync(v, '{"$schema":"block-qa/v1"}\n');
}

describe("orphanVerdicts", () => {
  it("reports an ABANDONED verdict — the case no per-directory check can reach", () => {
    // No manifest and no chapter directory at all: `validate` never loads that
    // directory, so it never derives the mirror, so it never looks here.
    inTmp((root) => {
      place(root, "gone", "b", { manifest: false });
      const found = orphanVerdicts(root);
      expect(found).toHaveLength(1);
      expect(found[0]!.kind).toBe("abandoned");
      expect(found[0]!.expects).toContain(join("folio", "gone", "b.ts"));
    });
  });

  it("distinguishes MOVED, where the directory survives and validate sees it too", () => {
    inTmp((root) => {
      // The chapter exists (another block keeps it alive); this block's
      // manifest does not.
      place(root, "ch", "kept", { manifest: true });
      place(root, "ch", "left-behind", { manifest: false });
      const found = orphanVerdicts(root);
      expect(found).toHaveLength(1);
      expect(found[0]!.kind).toBe("moved");
    });
  });

  it("says nothing about a verdict whose block is present", () => {
    inTmp((root) => {
      place(root, "ch", "b", { manifest: true });
      expect(orphanVerdicts(root)).toEqual([]);
    });
  });

  it("an ABSENT results tree is a determined empty, not a finding", () => {
    // A folio that has never run a sweep since migrating has no tree. Reporting
    // that would put a finding in front of every such folio on day one.
    inTmp((root) => {
      mkdirSync(join(root, "folio"), { recursive: true });
      expect(orphanVerdicts(root)).toEqual([]);
    });
  });

  it("finds orphans nested at any depth, and reports them sorted", () => {
    inTmp((root) => {
      place(root, join("a", "deep"), "z", { manifest: false });
      place(root, "a", "b", { manifest: false });
      const found = orphanVerdicts(root);
      expect(found).toHaveLength(2);
      expect(found.map((f) => f.verdict)).toEqual([...found.map((f) => f.verdict)].sort());
    });
  });
});
