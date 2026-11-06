/**
 * `check:content-code-free` (bean `y9r6`): a code file under cat-harness/ that
 * the list does not allow is red; a listed file that is gone is not.
 */
import { describe, expect, test } from "bun:test";
import { isCode, judge, readBaseline } from "../check-content-code-free.ts";

describe("check:content-code-free", () => {
  test("code is decided by extension", () => {
    for (const f of ["a.ts", "b/c.mjs", "d.py", "e.sh", "lib/f.rb", "g.js"]) expect(isCode(f)).toBe(true);
    for (const f of ["a.json", "b.md", "c.html", "d.css", "e.yml", "f.ts.md"]) expect(isCode(f)).toBe(false);
  });

  test("shipped browser assets are not code", () => {
    // declared-path-literal: test inputs to the path classifier, not reads
    for (const f of ["site-chrome/assets/js/navbar.js", "site-chrome/_includes/mermaid_config.js", "docs/assets/js/vendor/sqlite-wasm/index.mjs"]) expect(isCode(f)).toBe(false);
    for (const f of ["docs/assets/x.ts", "tools/x.js"]) expect(isCode(f)).toBe(true);
  });

  test("a page built at publish ships its script in an assets/ folder beside it, and that is not code", () => {
    // folio-assistant#2781: the OpenAPI viewer's page, built under docs/en/.
    // declared-path-literal: test inputs to the path classifier, not reads
    expect(isCode("docs/en/cat-harness/openapi/smart-trust/assets/openapi.js")).toBe(false);
    expect(isCode("docs/fr/x/assets/a.mjs")).toBe(false);
    // Only a script in an assets/ folder, and only under a built language tree.
    expect(isCode("docs/en/cat-harness/openapi/smart-trust/openapi.js")).toBe(true);
    expect(isCode("docs/source/x/assets/a.js")).toBe(true);
    expect(isCode("docs/en/x/assets/a.ts")).toBe(true);
  });

  test("the folio file-list renderer and the Jekyll plugins are kept by rule", () => {
    // declared-path-literal: test inputs to the path classifier, not reads
    for (const f of ["folio-render/file-list.ts", "folio-render/file-list.test.ts", "site-chrome/_plugins/fa-root-relative.rb", "docs/_plugins/liquid-undefined-warn.rb"]) expect(isCode(f)).toBe(false);
    for (const f of ["_plugins/x.ts", "site-chrome/_plugins/sub/x.ts", "render/file-list.ts"]) expect(isCode(f)).toBe(true);
  });

  test("an unlisted file is added; a listed file that is gone is only reported", () => {
    const j = judge(["schemas/a.ts", "tools/new.ts"], ["schemas/a.ts", "skills/old.ts"]);
    expect(j.added).toEqual(["tools/new.ts"]);
    expect(j.gone).toEqual(["skills/old.ts"]);
  });

  test("the committed list is sorted and has no duplicates", () => {
    const files = readBaseline();
    expect([...files].sort()).toEqual(files);
    expect(new Set(files).size).toBe(files.length);
  });

  test("the committed list is read, and an empty one allows nothing", () => {
    // The ratchet reached zero on 2026-10-30 (bean y9r6, box 1): an empty
    // list is the goal state, not a failed read.
    expect(Array.isArray(readBaseline())).toBe(true);
    const j = judge(["tools/new.ts"], []);
    expect(j.added).toEqual(["tools/new.ts"]);
    expect(j.gone).toEqual([]);
  });
});
