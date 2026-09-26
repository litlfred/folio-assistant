/**
 * `3sm2` — a change may not publish a translated page without its `.po`.
 *
 * The corpus tests assert only what is STABLE about this repository, because the
 * interesting population is the one a change introduces and that is different on
 * every branch. The unit tests over a temp dir are where the discrimination is
 * proven: a gate that reported every added file, or none, would pass a test that
 * only counted findings.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { siteDir } from "../../schemas/cat-harness.ts";

import { addedFiles, translationsByFile, uncatalogued } from "../check-translation-catalogue.ts";

const HARNESS = resolve(import.meta.dir, "../..");

describe("the real corpus — the map the gate reads", () => {
  const byFile = translationsByFile(HARNESS);

  // ANTI-VACUITY, and it is the whole reason this block exists. `uncatalogued`
  // returns `[]` for an empty map, which exits 0 and reads as "nothing wrong".
  // `6tkl` is the standing rule: a sweep over no subjects asserts nothing, so
  // "clean" over an empty set must not be reachable.
  test("is non-empty — otherwise every run of this gate is vacuously clean", () => {
    expect(byFile).toBeDefined();
    expect(byFile!.size).toBeGreaterThan(0);
  });

  test("every key is a file that exists, so the mapping is not composing paths", () => {
    const missing = [...byFile!.keys()].filter((f) => !existsSync(f));
    expect(missing).toEqual([]);
  });

  test("keys are absolute, which is what makes the git comparison location-independent", () => {
    const relativeKeys = [...byFile!.keys()].filter((k) => !k.startsWith("/"));
    expect(relativeKeys).toEqual([]);
  });
});

describe("addedFiles distinguishes `no additions` from `could not tell`", () => {
  // The DEFECT this guards: returning `[]` when git fails makes a broken reader
  // indistinguishable from a clean change, and the gate would exit 0 on a
  // shallow checkout that cannot see the base ref.
  test("a ref git cannot resolve is undefined, never an empty list", () => {
    expect(addedFiles({ since: "no-such-ref-3sm2" })).toBeUndefined();
  });

  test("a resolvable range answers with a list", () => {
    const got = addedFiles({ since: "HEAD" });
    expect(Array.isArray(got)).toBe(true);
  });
});

describe("uncatalogued reports exactly the added translations with no catalogue", () => {
  /**
   * A whole instance in a temp dir, so the three cases are decided by the
   * fixture rather than by whatever this repository happens to hold today.
   *
   * `catalogueFor` resolves `<instance>/translations/<locale>/<page>.po` through
   * the `translation-sources` declaration, falling back to the convention when
   * the instance declares none — which a bare temp dir does not, so the
   * convention path is what these assertions exercise.
   */
  function fixture(): { root: string; cleanup: () => void } {
    const root = mkdtempSync(join(tmpdir(), "3sm2-"));
    mkdirSync(join(root, "translations", "fr"), { recursive: true });
    writeFileSync(join(root, "translations", "fr", "has-one.po"), 'msgid ""\nmsgstr ""\n');
    return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
  }

  test("a translation with no catalogue is reported, with the path to author", () => {
    const { root, cleanup } = fixture();
    try {
      const byFile = new Map([[resolve(join(siteDir(), "fr", "none.md")), { locale: "fr", page: "none" }]]);
      const got = uncatalogued(root, [join(siteDir(), "fr", "none.md")], byFile);
      expect(got.map((g) => g.subject)).toEqual(["fr/none"]);
      expect(got[0]!.catalogue).toContain(join("translations", "fr", "none.po"));
    } finally {
      cleanup();
    }
  });

  test("a translation WHOSE catalogue the change already carries is not reported", () => {
    const { root, cleanup } = fixture();
    try {
      const byFile = new Map([[resolve(join(siteDir(), "fr", "has-one.md")), { locale: "fr", page: "has-one" }]]);
      expect(uncatalogued(root, [join(siteDir(), "fr", "has-one.md")], byFile)).toEqual([]);
    } finally {
      cleanup();
    }
  });

  // DISCRIMINATION. Without this, a gate that flagged every added file would
  // pass both tests above — and this repository's changes are overwhelmingly
  // files that are not translated pages.
  test("an added file that is not a published translation is ignored entirely", () => {
    const { root, cleanup } = fixture();
    try {
      const byFile = new Map([[resolve(join(siteDir(), "fr", "none.md")), { locale: "fr", page: "none" }]]);
      expect(uncatalogued(root, ["cat-harness/scripts/whatever.ts", "README.md"], byFile)).toEqual(
        [],
      );
    } finally {
      cleanup();
    }
  });

  test("no additions at all is a determined empty, not a finding", () => {
    const { root, cleanup } = fixture();
    try {
      const byFile = new Map([[resolve(join(siteDir(), "fr", "none.md")), { locale: "fr", page: "none" }]]);
      expect(uncatalogued(root, [], byFile)).toEqual([]);
    } finally {
      cleanup();
    }
  });
});
