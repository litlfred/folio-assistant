/**
 * Duplicate ids are counted in TAGS only, and the nav checkbox is rendered once — bean `uknu`.
 *
 * @module cat-harness/scripts/tests/duplicate-ids.test
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { duplicateIds } from "../check-duplicate-ids.js";

describe("duplicateIds", () => {
  test("two elements with one id is a finding", () => {
    expect([...duplicateIds(`<div id="a"></div><input id="a"><p id="b"></p>`)]).toEqual([["a", 2]]);
  });
  test("an id inside a code sample is text, not markup (the two first-run false hits)", () => {
    const html = `<a id="x"></a><code>&lt;a id="x"&gt;</code><code>&lt;a id="&lt;label&gt;"&gt;</code>`;
    expect(duplicateIds(html).size).toBe(0);
  });
  test("a script body is skipped, but the script tag's own id counts once", () => {
    const html = `<script type="application/json" id="meta">{"id": "meta", "x": "<b id=\\"meta\\">"}</script>`;
    expect(duplicateIds(html).size).toBe(0);
  });
  test("single-quoted and unquoted ids are read", () => {
    expect([...duplicateIds(`<i id='q'></i><i id=q></i>`)]).toEqual([["q", 2]]);
  });
});

describe("the generated navbar include: one checkbox, labels in every copy", () => {
  // `sjic`: this markup used to be hand-written in `nav_footer_custom.html`,
  // which is now a single `{% include %}`. The `uknu` property it guards —
  // one input per PAGE across the two copies just-the-docs renders — is
  // unchanged and is now the generator's to hold.
  const src = readFileSync(join(import.meta.dir, "../../docs/_includes/generated/navbar-footer.html"), "utf8");
  const code = src.replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, "");

  test("the checkbox input appears once, and only for the first rendered copy", () => {
    const inputs = code.match(/<input[^>]*class="fa-nav-open"/g) ?? [];
    expect(inputs.length).toBe(1);
    expect(code).toMatch(/\{%-?\s*if fa_nav_copy == 1\s*-?%\}\s*<input[^>]*id="fa-nav-open"/);
  });
  test("both labels point at the one checkbox the stylesheet reads", () => {
    // PER RENDERED VARIANT, not per file. The generated include carries the
    // canonical and staging renderings behind one Liquid conditional, so the
    // file holds four `for=` and a PAGE receives two — which is the property
    // that matters and the one a whole-file count silently doubled.
    const variants = code.split("{%- else -%}");
    expect(variants.length).toBe(2);
    for (const v of variants) expect(v.match(/for="fa-nav-open"/g)?.length).toBe(2);
  });
});
