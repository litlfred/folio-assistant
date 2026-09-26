/**
 * The enumeration sees a file that has not been committed yet.
 *
 * @module scripts/tests/repo-files.test
 *
 * This is the whole point of the module, and it is the one property the old
 * `git ls-files` call failed. Asserting it with a REAL untracked file rather
 * than a mocked listing matters: the defect was in what git was asked, so a
 * test that stubs git would have passed against the broken version.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { codeWithoutComments, repoFiles, repoFilesWithExt } from "../repo-files.js";

const ROOT = resolve(import.meta.dir, "../..");

/** Run `fn` with a real untracked file in the tree, and always remove it. */
function withUntrackedFile(rel: string, body: string, fn: () => void): void {
  const abs = join(ROOT, rel);
  mkdirSync(join(abs, ".."), { recursive: true });
  writeFileSync(abs, body);
  try {
    fn();
  } finally {
    rmSync(abs, { force: true });
  }
}

describe("a gate can see work that is not committed yet", () => {
  test("an untracked file IS enumerated", () => {
    // Bean `bgle`: two new files hardcoded the site root, a full local run
    // reported 0 fail because `git ls-files` could not see them, and CI —
    // after the commit — was the earliest possible detection.
    const rel = "scripts/__bgle-untracked-probe.ts";
    withUntrackedFile(rel, "export const probe = 1;\n", () => {
      expect(repoFiles(ROOT, ["scripts"])).toContain(rel);
    });
    // And it is gone again, so the probe cannot leak into another test's view.
    expect(existsSync(join(ROOT, rel))).toBe(false);
  });

  test("the OLD enumeration misses it — the bug is real, not theoretical", () => {
    // Pinning the defect itself. If someone reverts `repoFiles` to a bare
    // `ls-files`, the test above goes red; this one says why that matters by
    // showing the two answers differ on the same tree.
    const rel = "scripts/__bgle-untracked-probe2.ts";
    withUntrackedFile(rel, "export const probe = 2;\n", () => {
      const trackedOnly = new TextDecoder()
        .decode(Bun.spawnSync(["git", "ls-files", "scripts"], { cwd: ROOT }).stdout)
        .split("\n");
      expect(trackedOnly).not.toContain(rel);
      expect(repoFiles(ROOT, ["scripts"])).toContain(rel);
    });
  });

  test("an IGNORED file is still excluded — --exclude-standard is load-bearing", () => {
    // Without it the set includes node_modules and build output, which makes
    // the enumeration unusable and the gate gets abandoned rather than fixed.
    const all = repoFiles(ROOT, ["scripts", "schemas"]);
    expect(all.some((f) => f.includes("node_modules"))).toBe(false);
  });

  test("every path returned actually exists", () => {
    // A tracked file deleted in the working tree is still listed by
    // `ls-files`, and a gate that read one would fail on content nobody can
    // fix from a checkout.
    for (const f of repoFiles(ROOT, ["schemas"])) {
      expect(existsSync(join(ROOT, f))).toBe(true);
    }
  });

  test("results are de-duplicated and sorted", () => {
    const files = repoFiles(ROOT, ["schemas", "schemas"]);
    expect(files).toEqual([...new Set(files)].sort());
  });

  test("the extension filter narrows without changing the set's origin", () => {
    const ts = repoFilesWithExt(ROOT, ["schemas"], [".ts"]);
    expect(ts.length).toBeGreaterThan(0);
    expect(ts.every((f) => f.endsWith(".ts"))).toBe(true);
  });
});

describe("a gate can look at code without tripping over prose", () => {
  test("a line comment goes, a URL in a string survives", () => {
    // The reason a naive `//`-to-end-of-line rule is wrong: it cuts
    // "https://example.com" in half and invents a finding.
    const src = 'const u = "https://example.com/x"; // remote-packages\n';
    const code = codeWithoutComments(src);
    expect(code).toContain("https://example.com/x");
    expect(code).not.toContain("remote-packages");
  });

  test("a block comment goes, including a markdown code span in it", () => {
    // The exact shape that turned two tests red on 2026-09-19: backticks
    // delimit a markdown code span in a comment AND quote strings in
    // TypeScript, so narrowing to "quoted strings" does not help.
    const src = "/** adds `remote-packages` wrongly */\nconst a = 1;\n";
    expect(codeWithoutComments(src)).not.toContain("remote-packages");
  });

  test("a real string literal is kept", () => {
    expect(codeWithoutComments('const d = "skills/remote-packages";')).toContain(
      "skills/remote-packages",
    );
  });

  test("a comment marker INSIDE a string is not a comment", () => {
    expect(codeWithoutComments('const s = "a // b"; const t = 1;')).toContain("a // b");
  });

  test("an escaped quote does not end the string early", () => {
    expect(codeWithoutComments('const s = "he said \\" // x"; const t = 1;')).toContain("// x");
  });
});
