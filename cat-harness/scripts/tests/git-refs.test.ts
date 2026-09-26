/**
 * The publish targets have ONE reader, and the README config builds on it.
 *
 * @module scripts/tests/git-refs
 *
 * Bean `cp3l`. `publishTargets` was extracted so a harness-level link check
 * could resolve a Pages URL without importing core. The risk that creates is
 * the obvious one: two readers of the same `readme` block, free to disagree,
 * and a disagreement here is silent — a harness check would resolve
 * `github.io` links against one ref while the README audit used another, and
 * both would report a clean run.
 *
 * So the agreement is asserted rather than described. `loadReadmeConfig`
 * spreads `publishTargets` and the same file's own block, in that order.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { DEFAULT_PUBLISH_REF, ownerRepo, publishTargets, publishedPaths } from "../../src/core/git-refs.js";
import { loadReadmeConfig } from "../../content/pipeline/readme-toc.js";
import { repoRootFor } from "../../schemas/cat-harness.js";
import { writeInstanceConfig } from "../../test/support/instance-fixture.js";

const REPO = repoRootFor(resolve(import.meta.dir, "..", ".."));

const withConfig = (readme: Record<string, unknown>): string => {
  const root = mkdtempSync(join(tmpdir(), "targets-"));
  writeInstanceConfig(root, JSON.stringify({ readme }));
  return root;
};

describe("one reader, so the two cannot drift", () => {
  test("the three publish targets agree between the two entry points", () => {
    const root = withConfig({ publishRef: "site", pagesBaseUrl: "https://x.example/y" });
    const t = publishTargets(root);
    const cfg = loadReadmeConfig(root);
    expect([cfg.publishRef, cfg.pagesBaseUrl, cfg.repoUrl]).toEqual([
      t.publishRef,
      t.pagesBaseUrl,
      t.repoUrl,
    ]);
  });

  test("...and on THIS repository, where the config is real", () => {
    const t = publishTargets(REPO);
    const cfg = loadReadmeConfig(REPO);
    expect([cfg.publishRef, cfg.pagesBaseUrl]).toEqual([t.publishRef, t.pagesBaseUrl]);
  });

  test("the README-shaped fields are still the README's own", () => {
    // The layering must not have flattened them away: `publishTargets` knows
    // nothing about link style, markers or PDF path patterns.
    const cfg = loadReadmeConfig(withConfig({ linkStyle: "pages", marker: "custom" }));
    expect([cfg.linkStyle, cfg.marker]).toEqual(["pages", "custom"]);
    expect(cfg.pdfPathPatterns.length).toBeGreaterThan(0);
  });

  test("an absent config still yields a usable publish ref", () => {
    expect(publishTargets(mkdtempSync(join(tmpdir(), "bare-"))).publishRef).toBe(DEFAULT_PUBLISH_REF);
  });

  test("a config that will not parse falls back rather than throwing", () => {
    const root = mkdtempSync(join(tmpdir(), "bad-"));
    writeInstanceConfig(root, "{ not json");
    expect(publishTargets(root).publishRef).toBe(DEFAULT_PUBLISH_REF);
  });
});

describe("the git facts", () => {
  test("`ownerRepo` takes the last two segments, trailing slash or not", () => {
    expect(ownerRepo("https://github.com/litlfred/folio-assistant")).toBe("litlfred/folio-assistant");
    expect(ownerRepo("https://github.com/litlfred/folio-assistant/")).toBe("litlfred/folio-assistant");
  });

  test("an UNREADABLE ref is `undefined`, not an empty set", () => {
    // The distinction the module header turns on: a shallow clone that never
    // fetched the publish ref must not read as "published nothing", or every
    // link into it comes back dead.
    const root = mkdtempSync(join(tmpdir(), "noref-"));
    mkdirSync(join(root, "sub"));
    expect(publishedPaths(root, "definitely-not-a-ref")).toBeUndefined();
  });

  test("a ref this checkout CAN read comes back as a set of paths", () => {
    const paths = publishedPaths(REPO, "HEAD");
    expect(paths).toBeDefined();
    expect(paths!.has("AGENTS.md")).toBe(true);
  });
});
