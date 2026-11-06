import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { leanFilesWithSorry } from "./proof-axis-dashboard.ts";

describe("proof-axis-dashboard leanFilesWithSorry", () => {
  test("lists *.lean files with a whole-word sorry, skips /lean/ paths, and treats the root as data", () => {
    const root = mkdtempSync(join(tmpdir(), "pad-$(echo x) ;'q"));
    try {
      const put = (rel: string, text: string) => {
        mkdirSync(join(root, rel, ".."), { recursive: true });
        writeFileSync(join(root, rel), text);
      };
      put("ch1/A.lean", "theorem a : True := by sorry\n");
      put("ch1/B.lean", "theorem b : True := trivial -- sorryless\n");
      put("ch$(x)/C`d`.lean", "theorem c : True := sorry\n");
      put("ch2/lean/D.lean", "theorem d : True := sorry\n");
      put("ch2/E.md", "sorry\n");
      expect(leanFilesWithSorry(root)).toEqual([join(root, "ch$(x)/C`d`.lean"), join(root, "ch1/A.lean")].sort());
      expect(leanFilesWithSorry(join(root, "missing"))).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
