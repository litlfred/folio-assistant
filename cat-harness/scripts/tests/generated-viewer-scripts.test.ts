/**
 * Every generated viewer's inline script must PARSE.
 *
 * Bean `hfkl`'s tiles led here. The four library viewers had been shipping a
 * script with a raw line break inside a string literal:
 *
 * ```js
 * ... .join("
 * ");
 * ```
 *
 * `gen-library-viz.ts` writes the whole page as a TypeScript **template
 * literal**, so the `\n` it contained was consumed at generation time and
 * emitted as a real newline. The browser threw `SyntaxError: Invalid or
 * unexpected token` before the first statement ran, so the viewer never issued
 * its fetch and every library tile sat on *"loading…"* forever.
 *
 * ## Why nothing caught it
 *
 * Every existing check looked at the page as TEXT or as a FILE: the links
 * resolved, the file existed, the byte size was plausible, the site build was
 * green. **A page whose script does not parse is a 200 with working links.**
 * The one question nobody asked was whether the JavaScript was JavaScript.
 *
 * Measured the day it was found: 12 navbar tiles, 5 of them opening a page
 * that could not run — and the failure is invisible to everything except a
 * browser or a parser.
 *
 * @module folio-assistant/scripts/tests/generated-viewer-scripts
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { describe, expect, test } from "bun:test";

import { siteDirFor } from "../../schemas/cat-harness.ts";

const ROOT = resolve(import.meta.dir, "../..");
// `siteDirFor`, never the literal — the site root is one answer, and a gate
// in this repository fails a source file that spells it out.
const SITE = join(ROOT, siteDirFor(ROOT));

/** Every `index.html` under the generated viewer trees. */
function viewerPages(dir: string, out: string[] = []): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) viewerPages(p, out);
    else if (e.name === "index.html" && statSync(p).size > 0) out.push(p);
  }
  return out;
}

const SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;

/** Does this text parse as a script? Uses the engine, not a regex. */
function parses(source: string): string | undefined {
  try {
    // `new Function` compiles without executing, which is the whole point:
    // the defect was a PARSE error, and running a viewer's script outside a
    // browser would fail for reasons that are not defects.
    new Function(source);
    return undefined;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

const pages = [join(SITE, "cat-harness", "library"), join(SITE, "cat-harness", "schemas")].flatMap((d) =>
  viewerPages(d),
);

describe("generated viewers ship JavaScript that is JavaScript", () => {
  test("the viewer trees are not empty — examined nothing is not a pass", () => {
    // Without this the suite goes green on a checkout where nothing was
    // generated, which is the `dh4f` shape inside the guard itself.
    expect(pages.length).toBeGreaterThan(0);
  });

  test("every inline script in every generated viewer parses", () => {
    const broken: string[] = [];
    for (const page of pages) {
      const html = readFileSync(page, "utf-8");
      for (const [, body] of html.matchAll(SCRIPT)) {
        const err = parses(body!);
        if (err) broken.push(`${relative(ROOT, page)}: ${err}`);
      }
    }
    expect(broken).toEqual([]);
  });

  test("...and the guard has teeth — a raw newline in a string is caught", () => {
    // FALSIFICATION, in the exact shape that shipped: the escape eaten by the
    // template literal, leaving a literal line break inside the quotes.
    expect(parses('var x = ["a"].join("\n");')).toMatch(/Invalid or unexpected token|Unexpected/);
    expect(parses('var x = ["a"].join("\\n");')).toBeUndefined();
  });
});
