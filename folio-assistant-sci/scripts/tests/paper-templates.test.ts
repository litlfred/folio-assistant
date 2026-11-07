/**
 * The paper folio templates this layer owns (`templates/paper/`, move M11,
 * folio-assistant#2598) keep the two properties the tools layer tested while
 * they lived there:
 *
 * 1. A dispatch-only workflow never gates a job or step on
 *    `github.event_name == 'push'` — that condition can never be true, so the
 *    job silently never runs (folio-assistant#1492: `blueprint.yml` and
 *    `lean_ci.yml` were exactly that).
 * 2. The lake-cache restore action names the cache-branch family's built-in
 *    names newest first, the same list this layer's `scripts/lake-cache.sh`
 *    carries; a fallback list that lost or reordered a name resolves a
 *    different branch from the script it delegates to.
 *
 * @module folio-assistant-sci/scripts/tests/paper-templates
 */
import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const TEMPLATES = join(import.meta.dir, "..", "..", "templates");

const workflows = [...new Glob("**/workflows/*.yml").scanSync({ cwd: TEMPLATES })].map((rel) => ({
  rel,
  text: readFileSync(join(TEMPLATES, rel), "utf-8"),
}));

/** `on:` declares a push trigger (the block form `on:\n  push:` or a list/flow form naming push). */
function triggersOnPush(yml: string): boolean {
  const on = yml.match(/^on:\s*(.*)\n((?:[ \t]+.*\n|\s*\n)*)/m);
  if (!on) return false;
  return /\bpush\b/.test(on[1] ?? "") || /^\s+push\s*:/m.test(on[2] ?? "");
}

describe("dispatch-only paper workflow templates never gate on push", () => {
  test("there are templates to check (the rule is not vacuous)", () => {
    expect(workflows.length).toBeGreaterThan(0);
  });

  for (const { rel, text } of workflows) {
    if (triggersOnPush(text)) continue;
    test(`${rel} has no job or step that waits for a push`, () => {
      const dead = text
        .split("\n")
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => /^\s*if:.*github\.event_name\s*==\s*'push'/.test(line))
        .map(({ n, line }) => `${n}: ${line.trim()}`);
      expect(dead, `a condition that can never be true in a dispatch-only workflow`).toEqual([]);
    });
  }
});

describe("the lake-cache restore template probes the new family name only (bean oycs)", () => {
  test("its fallback loop names cat/folio-assistant-sci/lake-cache and no retired name", () => {
    const text = readFileSync(join(TEMPLATES, "paper/github/actions/lake-cache-restore/action.yml"), "utf-8");
    expect(text).toContain("for p in cat/folio-assistant-sci/lake-cache; do");
    expect(text).not.toMatch(/for p in [^;\n]*(?<![\w/-])(cat-lake-cache|lake-cache)(?=[ ;])/);
  });
});
