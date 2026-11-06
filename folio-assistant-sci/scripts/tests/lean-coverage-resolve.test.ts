/**
 * `resolveLeanFile` follows a block's `lean.ref` into the Lean library tree
 * for ANY package prefix. It accepted only `qou:` until 2026-09-30, so in every
 * other folio a proof kept in the library (rather than a sibling `.lean`) was
 * never found: `build.ts` then left the ∀ margin mark, and the `\leanok` a
 * generated blueprint reads from it, on the hand-set status
 * (folio-assistant#1492).
 */

import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { leanFileStatus, resolveLeanFile } from "../lean-coverage";

const dir = mkdtempSync(join(tmpdir(), "lean-resolve-"));
const leanRoot = join(dir, "lean");
mkdirSync(join(leanRoot, "Demo", "Algebra"), { recursive: true });
const lib = join(leanRoot, "Demo", "Algebra", "Groups.lean");
writeFileSync(lib, "theorem lagrange : 1 = 1 := rfl\n");
const ts = join(dir, "thm-lagrange.ts"); // no sibling .lean
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("resolveLeanFile follows lean.ref for any package", () => {
  test("a non-qou package prefix resolves into the library tree", () => {
    const src = `export default theorem({ label: "thm:lagrange", lean: { ref: "demo:Demo.Algebra.Groups.lagrange" } });`;
    expect(resolveLeanFile(ts, src, leanRoot)).toBe(lib);
    expect(leanFileStatus(lib).validation).toBe("leanok");
  });

  test("the qou prefix still resolves (no regression for the folio it was written for)", () => {
    const src = `export default theorem({ label: "thm:lagrange", lean: { ref: "qou:Demo.Algebra.Groups.lagrange" } });`;
    expect(resolveLeanFile(ts, src, leanRoot)).toBe(lib);
  });
});

describe("the block-status-overlay slot overlays live Lean status (bean saqd)", () => {
  test("a block with a lean field takes sorryFree and validation from its resolved .lean", async () => {
    const { overlayBlockStatus } = await import("../../pipeline/lean-status-overlay");
    // The overlay resolves under <paperDir>/lean; `dir` is the paper here.
    writeFileSync(ts, `export default theorem({ label: "thm:lagrange", lean: { ref: "demo:Demo.Algebra.Groups.lagrange" } });`);
    const block = { kind: "theorem", label: "thm:lagrange", lean: { ref: "demo:Demo.Algebra.Groups.lagrange", validation: "not_checked" } };
    overlayBlockStatus(block as never, ts, dir);
    expect(block.lean).toMatchObject({ sorryFree: true, validation: "leanok" });
  });

  test("a stronger recorded verdict is kept, and a block with no lean field is left alone", async () => {
    const { overlayBlockStatus } = await import("../../pipeline/lean-status-overlay");
    writeFileSync(ts, `export default theorem({ label: "thm:lagrange", lean: { ref: "demo:Demo.Algebra.Groups.lagrange" } });`);
    const ci = { kind: "theorem", label: "thm:lagrange", lean: { ref: "demo:Demo.Algebra.Groups.lagrange", validation: "stub" } };
    overlayBlockStatus(ci as never, ts, dir);
    expect(ci.lean.validation).toBe("stub");
    const bare = { kind: "remark", label: "rem:x" };
    overlayBlockStatus(bare as never, ts, dir);
    expect(bare).toEqual({ kind: "remark", label: "rem:x" });
  });
});
