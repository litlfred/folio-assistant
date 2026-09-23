/**
 * This repository's content root and its instance config AGREE — bean `zkgs`.
 *
 * @module scripts/tests/repo-config-agreement
 * @graphNode none — a test
 *
 * ## The defect this pins
 *
 * `findContentRepoRoot()` stopped at `cat-harness/` while the config sat one
 * level up under another name, so `readDeclaredFolioProfile()` answered the
 * third state ("undetermined") from anywhere in this checkout. Every
 * `profiles: ["paper"]` criterion then ran on workflow documentation, and no
 * optional QA axis could be opted into here at all. Neither half was wrong on
 * its own; nothing asserted they MET. The resolver answered with a plausible
 * path rather than a fault — which is why it survived.
 *
 * It was fixed incidentally, by per-instance config names
 * (`<instance>.config.json`) and a resolver that walks outward from the
 * instance root. This test is the part that was missing: it runs the REAL
 * resolution on the REAL repository, not a fixture, so the next rename that
 * separates them fails here instead of silently re-scoping QA.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { findContentRepoRoot } from "../../content/pipeline/repo-root";
import { readDeclaredFolioProfile } from "../../content/pipeline/profile-check";
import { expectedInstanceConfigPath, resolveHarnessConfigPath } from "../../schemas/harness-config";

describe("this repository's content root and its config agree — bean `zkgs`", () => {
  const root = findContentRepoRoot();

  test("the content root resolves to a config file that EXISTS", () => {
    const hit = resolveHarnessConfigPath(root);
    expect(hit).toBeDefined(); // `undefined` is the zkgs defect
    expect(existsSync(hit!.path)).toBe(true);
  });

  test("the declared profile is `document`, never the third state", () => {
    const p = readDeclaredFolioProfile(root);
    expect(p.profile).toBe("document");
    expect(p.declaredBy).not.toMatch(/undetermined/);
  });

  /**
   * THE NESTED INSTANCE RESOLVES TO ITS OWN CONFIG, not the root's.
   *
   * Added 2026-09-23 from a duplicate investigation of this bean that reached
   * the same conclusion independently; the rest of that work was dropped
   * rather than landed beside this file, because two tests answering one
   * question is how they drift. This assertion is the part that was not
   * already here.
   *
   * It matters because `cat-harness/` is the directory the walk USED to stop
   * at, and the root is the one it used to miss — they are the two ends of
   * the defect. The tests above pin the root; without this one, a resolver
   * that answered the root's config for every instance would pass them all
   * while making every nested instance read the wrong `contentType`.
   */
  test("`cat-harness/` resolves to its OWN config, not the repository root's", () => {
    const nested = readDeclaredFolioProfile(join(root, "cat-harness"));
    expect(nested.profile).toBe("document");
    expect(nested.declaredBy).toContain("cat-harness.config.json");
    expect(nested.declaredBy).not.toMatch(/undetermined/);
  });

  test("the optional-axes reader looks where the config actually is", () => {
    // `folioOptionalAxes()` reads this path. If it pointed at a file that is
    // not there, every axis opt-in would be silently ignored — the other half
    // of the defect, invisible because "no axes" is also a legitimate answer.
    const p = expectedInstanceConfigPath(root);
    expect(p).toBeDefined();
    expect(existsSync(p!)).toBe(true);
    expect(p).toBe(resolveHarnessConfigPath(root)!.path);
  });
});
