/**
 * glossary:page leaves a MOUNTED layer's extracted schemes alone (bean
 * `cat-tools-sm8r`, item 4, plan step 3; owner, 2026-11-13, "own layers
 * only"): they are committed in that layer's own repository at its pin.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import { inMount, isMountedScheme } from "./glossary-page.ts";

const root = "/checkout";
const mounts = [join(root, "core-layer"), join(root, "ig-layer")];
const generated = [join(root, "core-layer", "glossary", "generated"), join(root, "own", "glossary", "generated")];

describe("inMount", () => {
  test("a path inside a mount, and the mount itself", () => {
    expect(inMount(join(root, "ig-layer", "x.json"), mounts)).toBe(true);
    expect(inMount(join(root, "ig-layer"), mounts)).toBe(true);
  });
  test("a sibling whose name only starts like a mount is not in it", () => {
    expect(inMount(join(root, "ig-layer-2", "x.json"), mounts)).toBe(false);
  });
});

describe("isMountedScheme", () => {
  test("an extracted scheme under a mounted layer's glossary/generated/ is left alone", () => {
    expect(isMountedScheme(join(root, "core-layer", "glossary", "generated", "some-ig", "skills.glossary.json"), generated, mounts)).toBe(true);
  });
  test("an extracted scheme of the checkout's own layer is written", () => {
    expect(isMountedScheme(join(root, "own", "glossary", "generated", "own", "skills.glossary.json"), generated, mounts)).toBe(false);
  });
  test("any other file in a mount (the site's pages, step 4) is not this filter's", () => {
    expect(isMountedScheme(join(root, "core-layer", "docs", "page.md"), generated, mounts)).toBe(false);
  });
});
