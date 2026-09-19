/**
 * The site root is composed from the instance stub, in ONE place.
 *
 * Bean `x4a6`. Before the move, `docs/` was spelled out separately in
 * `translation-index.ts`, `gen-docs-pages.ts`, `gen-skill-docs.ts`,
 * `gen-schema-docs.ts` and `translation-qa-sweep.ts` — five copies free to
 * disagree, and the bean counted them as the defect. Packaging the site under
 * `docs/<stub>/` for the repo split moved all five at once; nothing stopped a
 * sixth appearing the next day.
 *
 * This is the same shape as `graph-kind-docs.test.ts` (bean `5o3a`): a fact
 * that lives in code and in prose drifts unless something crosses between
 * them. Here both sides are code, which makes it cheaper, not less necessary.
 *
 * @module scripts/tests/site-dir-single-answer
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { siteDir, siteDirFor } from "../../schemas/cat-harness.ts";
import { repoFilesWithExt } from "../repo-files.js";

const ROOT = resolve(import.meta.dir, "../..");

/**
 * Source trees that resolve paths at runtime. `docs/` itself is excluded: its
 * pages legitimately talk about their own layout in prose.
 *
 * `test` rather than `tests` since 2026-09-19 (bean `auap`), when the two test
 * trees were consolidated. `sourceFiles()` keeps only `.ts`/`.mjs`, so naming
 * `test/` here does not drag in the 500-odd JSON verdicts under
 * `test/results/` — but a stale `tests` WOULD have dropped `a11y.e2e.ts`, the
 * very file the `[^\n]*` widening above was written for, and the guard would
 * have kept passing.
 */
const TREES = ["scripts", "content", "schemas", "src", "test"];

/**
 * A literal naming the OUTPUT site root **in a path-resolving position**.
 *
 * Scoped to `join`/`resolve`/`readFileSync`/`existsSync`/`readdirSync` rather
 * than to every quoted `docs/…` on purpose. Plenty of strings here name the
 * path as PROSE — a finding's `where:`, a console message, a QA criterion's
 * description — and those are documentation, not resolution: they do not
 * break when the directory moves, and failing on them would mean the guard
 * fires on its own rationale. The defect this bean measured was five
 * CONSTANTS that resolve to a directory, so that is what is checked.
 *
 * `content/docs/` is the generator's INPUT — a different directory that
 * happens to share a segment — so a preceding `content` disqualifies a hit.
 */
const LITERAL =
  // `[^\n]*` rather than `[^)\n]*`: a nested call -- `join(dirname(x), "..",
  // "docs/…")` -- puts a `)` between the opener and the literal, and the
  // tighter pattern walked straight past exactly that line in `a11y.e2e.ts`.
  /\b(?:join|resolve|readFileSync|existsSync|readdirSync|statSync)\s*\([^\n]*(["'`])\.?\/?docs(\/[^"'`\n]*)?\1/;

/**
 * Source under the scanned trees — **including files not yet committed**.
 *
 * This used to call `git ls-files` directly, which lists tracked files only.
 * That made the guard blind to exactly the files most likely to violate it:
 * `gen-themes-css.ts` and `theme-tokens.test.ts` both hardcoded the site root,
 * a full local `bun test` reported 0 fail, and CI after the commit was the
 * earliest possible detection. Bean `bgle`.
 */
function sourceFiles(): string[] {
  return repoFilesWithExt(ROOT, TREES, [".ts", ".mjs"]);
}

describe("the site root is one answer, not a literal", () => {
  test("siteDir composes docs/<stub> and siteDirFor reads this instance's", () => {
    expect(siteDir({ name: "x", stub: "y" })).toBe("docs/y");
    // Falls back to `name` exactly as `artefactStub` does — one rule, not two.
    expect(siteDir({ name: "x" })).toBe("docs/x");
    expect(siteDirFor(ROOT)).toBe("docs/folio-assistant");
  });

  test("an instance with no name or stub cannot get a guessed site root", () => {
    // Third-state discipline: a wrong site root writes the whole site into a
    // directory nothing serves, so "could not determine" must throw rather
    // than fall back to `docs/`.
    expect(() => siteDirFor(join(ROOT, "scripts"))).toThrow(/cannot determine the site root/);
  });

  test("no source file hardcodes the output site root", () => {
    const offenders: string[] = [];
    for (const rel of sourceFiles()) {
      const text = readFileSync(join(ROOT, rel), "utf-8");
      text.split("\n").forEach((line, i) => {
        // Strip comments first: the reasoning around this rule necessarily
        // names the old path, and a guard that fails on its own rationale is
        // one the next person deletes.
        const code = line.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
        if (!LITERAL.test(code)) return;
        if (/content["'`]?\s*,\s*["'`]docs|content\/docs/.test(code)) return;
        offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});
