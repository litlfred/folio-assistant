/**
 * The folio root is ASKED for, never spelled.
 *
 * Bean `hs08`. The owner's ruling is that a folio says where its content is —
 * *"qou can declare a new folio at content/"* — and `folioDir` is the one
 * place that reads the declaration. This is the ratchet that keeps it the one
 * place.
 *
 * ## Why a ratchet rather than a convention
 *
 * Before `folioDir`, **162 sites** spelled the folio root as a literal. Not
 * one of them was wrong when it was written; each was the obvious way to name
 * a directory, and together they made the declaration unreadable — a folio
 * could declare `content/` and be invisible anyway. A convention would have
 * produced them again, one plausible line at a time.
 *
 * The failure this guards is silent by construction: a reintroduced literal
 * breaks nothing in THIS repository, which has no folio to look in. It breaks
 * a downstream folio that declared a different path, and it breaks it by
 * finding nothing rather than by erroring. Nobody here would see it.
 *
 * ## What is allowed, and why
 *
 * - `schemas/cat-harness.ts` — `folioDir` itself. It IS the base case: the
 *   convention has to be written down once, and resolving it through a
 *   declaration would be circular.
 * - `*.test.ts` — fixtures BUILD trees rather than resolving them. A test that
 *   writes `<tmp>/folio/paper` is constructing a world, not reading one.
 *
 * Everything else asks.
 *
 * @module scripts/tests/folio-root-is-asked.test
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import { repoRootFor } from "../../schemas/cat-harness.js";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const ROOT = repoRootFor(INSTANCE);

/** `join(x, "folio")` / `resolve(x, "folio")` — the folio root, spelled. */
const LITERAL = /(?<![.\w])(?:join|resolve)\s*\([^,()]*(?:\([^()]*\))?[^,()]*,\s*"folio"\s*[,)]/;

/** The one module that may spell it, because it is where the answer lives. */
const BASE_CASE = "cat-harness/schemas/cat-harness.ts";

function sourceFiles(): string[] {
  const out = new Set<string>();
  for (const pattern of ["**/*.ts"]) {
    for (const f of new Bun.Glob(pattern).scanSync({ cwd: INSTANCE, absolute: true })) {
      if (f.includes("/node_modules/") || f.endsWith(".test.ts")) continue;
      out.add(f);
    }
  }
  return [...out].sort();
}

describe("the folio root is asked for, not spelled", () => {
  const files = sourceFiles();

  test("the scan found files — otherwise nothing below proves anything", () => {
    // A filter over nothing passes. This repository's own `gates.ts` carries
    // the same guard, for the same reason.
    expect(files.length).toBeGreaterThan(200);
  });

  test("no module outside `folioDir` itself spells the folio root", () => {
    const offenders: string[] = [];
    for (const f of files) {
      const rel = relative(ROOT, f);
      if (rel === BASE_CASE) continue;
      const src = readFileSync(f, "utf-8");
      for (const [i, line] of src.split("\n").entries()) {
        // A comment describing the old shape is not a call.
        if (/^\s*(\*|\/\/)/.test(line)) continue;
        if (LITERAL.test(line)) offenders.push(`${rel}:${i + 1}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  test("`folioDir` is actually used — the rule is not vacuously satisfied", () => {
    // Deleting every call site would satisfy the rule above while undoing the
    // change entirely. This is the other direction of the ratchet.
    const callers = files.filter((f) => {
      if (relative(ROOT, f) === BASE_CASE) return false;
      return /(?<![.\w])folioDir\s*\(/.test(readFileSync(f, "utf-8"));
    });
    expect(callers.length).toBeGreaterThan(40);
  });
});
