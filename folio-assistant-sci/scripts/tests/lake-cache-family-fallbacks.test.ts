/**
 * The Lean cache scripts' BUILT-IN family names agree with each other.
 *
 * A family's name is the declaring folio's `storage.branchPrefix`, read first
 * by every script (owner, 2026-10-05); each script keeps the same built-in
 * names only as a fallback when nothing is declared. So the drift worth
 * catching is between the scripts themselves — one whose fallback list lost a
 * name, or reordered it, resolves a different branch from the rest when no
 * declaration is present.
 *
 * Moved here with the scripts from the tools layer's
 * `cache-family-fallbacks.test.ts` (folio-assistant#2598): the lake-cache half
 * is this layer's, and the tools layer keeps the rest. The restore action of
 * the paper template is checked by `paper-templates.test.ts`.
 *
 * Each script names the names as whole tokens: `lake-cache` is a substring of
 * both newer names, so a bare `toContain` would pass a file that never names it.
 *
 * @module folio-assistant-sci/scripts/tests/lake-cache-family-fallbacks
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SCRIPTS = resolve(import.meta.dir, "..");

/**
 * Each script's built-in candidate list, as the literal a reader would copy.
 * Every remote was renamed on 2026-10-24 (bean qr4n), so each list names the
 * new family only (bean oycs): `cat-lake-cache/` and `lake-cache/` are retired.
 */
const LITERALS: Record<string, string> = {
  "lake-cache.sh": 'LEGACY_CACHE_PREFIXES=""',
  "lake-cache-fetch.sh": 'CANDIDATES="cat/folio-assistant-sci/lake-cache/qou-${slug}"',
  "lake-cache-fetch-multi.py": 'CACHE_PREFIXES = ("cat/folio-assistant-sci/lake-cache/",)',
  "lake-cache-produce.py": 'CACHE_PREFIXES = ("cat/folio-assistant-sci/lake-cache/",)',
  "reseed-lean-cache.sh": '_cands="cat/folio-assistant-sci/lake-cache"',
};

describe("the Lean cache scripts carry the same built-in family name, and no retired one", () => {
  for (const [file, literal] of Object.entries(LITERALS)) {
    test(`${file}: the new family only`, () => {
      const text = readFileSync(resolve(SCRIPTS, file), "utf-8");
      expect(text).toContain(literal);
    });
  }

  test("lake-cache.sh writes the new name when nothing is declared", () => {
    const text = readFileSync(resolve(SCRIPTS, "lake-cache.sh"), "utf-8");
    expect(text).toContain('CACHE_PREFIX="cat/folio-assistant-sci/lake-cache"');
  });
});
