/**
 * One Lean comment stripper, and it is `lean-lexer`'s.
 *
 * Bean `bqrg`. There were **six** — the canonical one plus five
 * reimplementations in `qa-checkers-extended`, `qa-checkers-vacuity`,
 * `conditional-class-banner-audit`, `qa-checkers-q-usage` and
 * `scripts/lean-coverage`.
 *
 * ## Why they were not merely redundant
 *
 * Measured over **3,954 real `.lean` files** in the qou corpus, comparing the
 * IDENTIFIER SET each produced against the canonical one's — raw output was
 * never the right comparison, because canonical blanks comments to preserve
 * byte offsets while every copy deleted them:
 *
 *     impl        same token set   differs
 *     extended          3954          0     depth counter — equivalent
 *     coverage          3954          0     depth counter — equivalent
 *     vacuity           3950          4     non-greedy regex, NO nesting
 *     banner            3950          4     ditto
 *     qusage            3950          4     ditto
 *
 * The three regex versions used `/\/-[\s\S]*?-\//g`, which matches to the
 * FIRST `-/`. Lean nests block comments, so an outer comment ends early and
 * its tail is handed to the checker as code. On
 * `confined-particle.lean` (nesting depth 2) that leaked **113 prose tokens**
 * — `def`, `Prop`, `fun`, `True`, and English words like "docstring" and
 * "about" — into text three QA checkers scan for declarations. The canonical
 * module's own header names this: *"how a scanner invents edges out of
 * documentation."*
 *
 * Four files change across the corpus, listed in the commit. Reported rather
 * than asserted, which is what the bean asked for.
 *
 * @module cat-harness/scripts/tests/lean-lexer-is-the-only-stripper.test
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import { repoRootFor } from "../../schemas/cat-harness.js";
import { stripLeanComments } from "../../content/pipeline/lean-lexer.js";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const ROOT = repoRootFor(INSTANCE);
const CANONICAL = "cat-harness/content/pipeline/lean-lexer.ts";

/** A definition of a stripper — `function f(` or `const f = `. */
const DEFINES = /(?:function\s+stripLeanComments\s*\(|(?:const|let|var)\s+stripLeanComments\s*[:=])/;

function sources(): string[] {
  const out: string[] = [];
  for (const f of new Bun.Glob("**/*.ts").scanSync({ cwd: INSTANCE, absolute: true })) {
    if (f.includes("/node_modules/") || f.endsWith(".test.ts")) continue;
    out.push(f);
  }
  return out.sort();
}

describe("there is exactly one Lean comment stripper", () => {
  const files = sources();

  test("the scan found files — otherwise nothing below proves anything", () => {
    expect(files.length).toBeGreaterThan(200);
  });

  test("no module defines its own", () => {
    const offenders: string[] = [];
    for (const f of files) {
      const rel = relative(ROOT, f);
      if (rel === CANONICAL) continue;
      for (const [i, line] of readFileSync(f, "utf-8").split("\n").entries()) {
        if (/^\s*(\*|\/\/)/.test(line)) continue; // a comment describing one is not one
        if (DEFINES.test(line)) offenders.push(`${rel}:${i + 1}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  test("...and it is actually used, so the rule is not vacuously satisfied", () => {
    const callers = files.filter(
      (f) => relative(ROOT, f) !== CANONICAL && /stripLeanComments/.test(readFileSync(f, "utf-8")),
    );
    expect(callers.length).toBeGreaterThanOrEqual(5);
  });
});

describe("the invariants a reimplementation kept losing", () => {
  test("byte offsets are preserved — comments blank, never delete", () => {
    // `splitDeclarations` indexes into the result. A copy that deletes
    // misaligns every span it feeds, silently.
    const src = "def a := 1 -- note\n/- block -/\ndef b := 2\n";
    expect(stripLeanComments(src).length).toBe(src.length);
  });

  test("NESTED block comments close at the right place", () => {
    // The whole defect, in one line. A non-greedy regex stops at the inner
    // `-/` and hands `outer tail def leaked` to the caller as code.
    const src = "/- outer /- inner -/ outer tail -/\ndef real := 1\n";
    const got = stripLeanComments(src);
    expect(got).not.toContain("tail");
    expect(got).not.toContain("outer");
    expect(got).toContain("def real");
  });

  test("doc comments are comments — a name in prose is not a dependency", () => {
    const src = "/-- mentions Nonexistent.thing -/\ndef real := 1\n";
    const got = stripLeanComments(src);
    expect(got).not.toContain("Nonexistent");
    expect(got).toContain("def real");
  });

  test("a line comment does not eat the following line", () => {
    const src = "-- gone\ndef kept := 1\n";
    expect(stripLeanComments(src)).toContain("def kept");
  });
});
