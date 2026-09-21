/**
 * The stray-backtick gate, falsified in both directions.
 *
 * @module scripts/tests/check-viewer-backticks
 * @graphNode none — a test
 *
 * The half that matters is the NEGATIVE one. A checker that answered "fine"
 * unconditionally would pass every real file in this repo, since every real
 * file is currently fine — so the real corpus alone proves nothing, and a
 * planted defect is the only evidence the gate works.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { repoRootFor } from "../../schemas/cat-harness.js";
import { strayBacktick, VIEWER_SOURCES } from "../check-viewer-backticks.ts";

const ROOT = repoRootFor(join(import.meta.dir, "../.."));

const ok = [
  "function viewerHtml() {",
  "  return `<!doctype html>",
  "<html><body>",
  "<!-- a comment with no backtick -->",
  "</body>",
  "</html>",
  "`;",
  "}",
].join("\n");

describe("strayBacktick", () => {
  test("a well-formed template is not a finding", () => {
    expect(strayBacktick(ok)).toBeNull();
  });

  test("a backtick in a COMMENT is found, and its line named", () => {
    // The actual failure, four times over: the author is writing prose, not
    // thinking about string syntax, and quotes an identifier the way they
    // would anywhere else.
    const bad = ok.replace(
      "<!-- a comment with no backtick -->",
      "<!-- see the `qttr` bean -->",
    );
    const hit = strayBacktick(bad);
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(4);
    expect(hit?.text).toContain("qttr");
  });

  test("a backtick BEFORE the template is fine and must stay fine", () => {
    // A doc comment above the function is the common case. A gate that
    // flagged it would be a gate people work around.
    expect(strayBacktick("/** see `foo` */\n" + ok)).toBeNull();
  });

  test("a file with no page template is not a finding", () => {
    expect(strayBacktick("export const x = 1;\n")).toBeNull();
  });

  test("an escaped backtick does not end the literal", () => {
    const esc = ok.replace("<!-- a comment with no backtick -->", "<!-- \\` -->");
    expect(strayBacktick(esc)).toBeNull();
  });
});

describe("the real corpus", () => {
  test("every listed generator exists and holds a page template", () => {
    // Without this the gate could pass over a file that moved, which is the
    // vacuous-green failure the check itself guards against.
    for (const rel of VIEWER_SOURCES) {
      const src = readFileSync(join(ROOT, rel), "utf-8");
      expect(/return\s+`<!doctype html>/i.test(src)).toBe(true);
      expect(strayBacktick(src)).toBeNull();
    }
  });
});
