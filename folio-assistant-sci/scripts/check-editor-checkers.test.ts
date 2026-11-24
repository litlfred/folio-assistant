import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { exportsName, judgeEditorChecker } from "./check-editor-checkers.ts";

const ROOT = mkdtempSync(join(tmpdir(), "editor-checkers-"));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

function put(rel: string, body: string): string {
  const p = join(ROOT, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, body);
  return p;
}

const node = (over: Record<string, unknown> = {}) =>
  JSON.stringify({ $schema: "folio-editor-checker/v1", id: "n", contentType: "paper", check: "a/check.ts#checkSuggestion", ...over });

describe("exportsName reads an export from source, without importing it", () => {
  test("exportsNameReadsDeclsAndAliases", () => {
    expect(exportsName("export function checkSuggestion() {}", "checkSuggestion")).toBe(true);
    expect(exportsName("export const x = 1;", "x")).toBe(true);
    expect(exportsName("function a() {}\nexport { a as b };", "b")).toBe(true);
    expect(exportsName("function a() {}\nexport { a as b };", "a")).toBe(false);
    expect(exportsName("// export function gone() {}", "gone")).toBe(false);
  });
});

describe("an editor-checkers node is judged on what the runtime loads", () => {
  put("a/check.ts", "export function checkSuggestion() { return []; }\n");

  test("nodeWithCodePresentIsClean", () => {
    expect(judgeEditorChecker(put("editor-checkers/n.json", node()), ROOT)).toEqual([]);
  });

  test("missingFileOrExportIsFinding", () => {
    expect(judgeEditorChecker(put("editor-checkers/n.json", node({ check: "a/none.ts#checkSuggestion" })), ROOT).join()).toContain("no file a/none.ts");
    expect(judgeEditorChecker(put("editor-checkers/n.json", node({ macros: "a/check.ts#macroTable" })), ROOT).join()).toContain("exports no macroTable");
  });

  test("unparsedOrMisnamedNodeIsFinding", () => {
    expect(judgeEditorChecker(put("editor-checkers/n.json", node({ check: "../escape.ts#x" })), ROOT).join()).toContain("not a folio-editor-checker/v1 node");
    expect(judgeEditorChecker(put("editor-checkers/m.json", node()), ROOT).join()).toContain('id "n" is not its file name "m"');
  });

  test("ownNodesClean", () => {
    const sci = resolve(import.meta.dir, "..");
    expect(judgeEditorChecker(join(sci, "editor-checkers", "paper-latex.json"), sci)).toEqual([]);
  });
});
