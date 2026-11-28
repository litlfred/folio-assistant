/**
 * What a root publish keeps of the branch it replaces (owner, 2026-11-28, qou
 * site audit gap 7: `STAGING/` from October and `_render-log/` were carried by
 * every publish though no step writes them).
 */
import { describe, expect, test } from "bun:test";

import { rootPublishKeep } from "../lib/root-prune.ts";

const always = ["branches", "PC", "papers"];

describe("rootPublishKeep", () => {
  test("prunes the trees no step writes, STAGING/ and _render-log/ among them", () => {
    const r = rootPublishKeep({
      always,
      built: ["en", "assets", "index.html", "lean"],
      published: [".nojekyll", "STAGING", "_render-log", "en", "assets", "index.html", "old-step", "papers", "branches"],
    });
    expect(r.pruned).toEqual(["STAGING", "_render-log", "old-step"]);
    expect(r.keep).toContain("papers");
    expect(r.keep).toContain("branches");
    expect(r.keep).not.toContain("STAGING");
    expect(r.keep).not.toContain("_render-log");
  });

  test("keeps papers/, lean/ and cat-* when the build does not write them, and replaces them when it does", () => {
    const r = rootPublishKeep({
      always: ["branches"],
      built: ["en", "lean", "cat-harness"],
      published: ["en", "lean", "papers", "cat-harness", "cat-harness-tools", "qa-old"],
    });
    expect(r.preserved).toEqual(["cat-harness-tools", "papers"]);
    expect(r.keep.sort()).toEqual(["branches", "cat-harness-tools", "papers"]);
    expect(r.pruned).toEqual(["qa-old"]);
  });

  test("a site.build.keep entry is kept even when the build writes it", () => {
    const r = rootPublishKeep({ always: ["branches", "STAGING"], built: ["STAGING"], published: ["STAGING", "_render-log"] });
    expect(r.keep).toContain("STAGING");
    expect(r.pruned).toEqual(["_render-log"]);
  });

  test("an unlisted branch prunes nothing it would have kept", () => {
    const r = rootPublishKeep({ always: ["branches"], built: ["en", "lean"] });
    expect(r.keep.sort()).toEqual(["branches", "papers"]);
    expect(r.pruned).toEqual([]);
  });
});
