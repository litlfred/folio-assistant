/**
 * The cache scripts' BUILT-IN family names agree with each other.
 *
 * `special-branches.json` used to be the one place these names lived, with a
 * test that every copy agreed with it. The owner removed it on 2026-10-05
 * (*"dont use /get rid of"*): a family's name is now the declaring folio's
 * `storage.branchPrefix`, read first by every script, and each script keeps
 * the same built-in names only as a fallback when nothing is declared. So the
 * drift worth catching is between the scripts themselves — one script whose
 * fallback list lost a name, or reordered it, resolves a different branch from
 * the rest when no declaration is present.
 *
 * Each script names the names as whole tokens: `lake-cache` is a substring of
 * both newer names, so a bare `toContain` would pass a file that never names it.
 *
 * @module scripts/tests/cache-family-fallbacks
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO = resolve(import.meta.dir, "..", "..", "..");

/** Newest first: the name a script writes when nothing exists, then its legacy names in resolution order. */
const FAMILIES = {
  "lake-cache": {
    names: ["cat/folio-assistant-sci/lake-cache", "cat-lake-cache", "lake-cache"],
    files: [
      "cat-harness/scripts/lake-cache.sh",
      "cat-harness/scripts/lake-cache-fetch.sh",
      "cat-harness/scripts/lake-cache-fetch-multi.py",
      "cat-harness/scripts/lake-cache-produce.py",
      "cat-harness/scripts/reseed-lean-cache.sh",
      ".github/actions/lake-cache-restore/action.yml",
      "cat-harness/templates/paper/github/actions/lake-cache-restore/action.yml",
    ],
  },
  "fhir-ast": {
    names: ["cat/fhir-harness/fhir-ast", "cat-fhir-ast", "fhir-ast"],
    files: ["fhir-harness/scripts/ig-cache.sh"],
  },
} as const;

const esc = (n: string) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Index of the first whole-token occurrence of `name` in `text`, or -1. */
function tokenAt(text: string, name: string): number {
  const m = new RegExp(`(?<![\\w/-])${esc(name)}(?![\\w.-])`).exec(text);
  return m ? m.index : -1;
}

describe("cache scripts carry the same built-in fallback names, in the same order", () => {
  for (const [family, { names, files }] of Object.entries(FAMILIES)) {
    for (const file of files) {
      test(`${file}: every ${family} name, newest first`, () => {
        const text = readFileSync(resolve(REPO, file), "utf-8");
        const at = names.map((n) => tokenAt(text, n));
        for (const [i, n] of names.entries()) expect(at[i], `${file} names ${n}`).toBeGreaterThanOrEqual(0);
      });
    }
  }

  // The order matters where the list is written as one literal. Pinned on the
  // two literals a reader would copy: lake-cache.sh's and ig-cache.sh's.
  test("lake-cache.sh's fallback list is newest first", () => {
    const text = readFileSync(resolve(REPO, "cat-harness/scripts/lake-cache.sh"), "utf-8");
    expect(text).toContain('CACHE_PREFIX="cat/folio-assistant-sci/lake-cache"');
    expect(text).toContain('LEGACY_CACHE_PREFIXES="cat-lake-cache lake-cache"');
  });

  test("ig-cache.sh's fallback list is newest first", () => {
    const text = readFileSync(resolve(REPO, "fhir-harness/scripts/ig-cache.sh"), "utf-8");
    expect(text).toContain('for p in "cat/fhir-harness/fhir-ast/" "cat-fhir-ast/" "fhir-ast/"; do');
  });
});
