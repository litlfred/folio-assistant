import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { judgeLeanDir } from "./check-lean-dirs.ts";

const ROOT = mkdtempSync(join(tmpdir(), "lean-dirs-"));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

function dir(name: string, files: Record<string, string>): string {
  const d = join(ROOT, name);
  mkdirSync(d, { recursive: true });
  for (const [f, body] of Object.entries(files)) writeFileSync(join(d, f), body);
  return d;
}

describe("a lean directory holds what its kind says, and nothing orphaned", () => {
  test("readTemplateWithReadmeClean", () => {
    expect(judgeLeanDir(dir("ok", { "README.md": "x", "a.lean.tmpl": "x" }), ROOT, () => ["const T = 'a.lean.tmpl'"])).toEqual([]);
  });
  test("unreadTemplateIsFinding", () => {
    expect(judgeLeanDir(dir("orphan", { "README.md": "x", "b.lean.tmpl": "x" }), ROOT, () => ["nothing"]).join()).toContain("b.lean.tmpl is read by no module");
  });
  test("lakePackageWithoutToolchainIsFinding", () => {
    expect(judgeLeanDir(dir("pkg", { "README.md": "x", "lakefile.toml": "x" }), ROOT, () => []).join()).toContain("no lean-toolchain");
  });
  test("missingReadmeIsFinding", () => {
    expect(judgeLeanDir(dir("bare", { "lakefile.lean": "x", "lean-toolchain": "x" }), ROOT, () => []).join()).toContain("no README.md");
  });
});
