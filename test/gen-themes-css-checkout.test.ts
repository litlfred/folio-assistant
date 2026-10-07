/**
 * `gen-themes-css` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/gen-themes-css.test.ts` (bean `7zz1`, owner
 * ruling 2026-10-06 "Top-level instance"): each reads every instance's sticky
 * themes, which only the checkout holds. Standing alone, cat-harness has none
 * of it, and `check:cat-harness-standalone` collects every test in that layer.
 * The rest of that file's tests stay there; every path here is composed from
 * ORIGIN_DIR, the directory they were written in, so nothing they read
 * changed.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { siteDirFor } from "../cat-harness/schemas/cat-harness.js";
import { instanceStickyThemes } from "../cat-harness/schemas/theme-by-ref.js";
import { THEMES } from "../cat-harness/schemas/themes.js";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

const ROOT = join(ORIGIN_DIR, "..", "..");
const REPO = resolve(ROOT, "..");

describe("the committed stylesheet carries every instance sticky theme here", () => {
  const committed = readFileSync(join(ROOT, siteDirFor(ROOT), "assets", "css", "themes.css"), "utf8");
  const { themes, conflicts } = instanceStickyThemes(REPO, "cat-harness", new Set(THEMES.map((t) => t.id)));

  test("there is at least one to check, and no collision", () => {
    expect(themes.length).toBeGreaterThan(0);
    expect(conflicts).toEqual([]);
  });

  test.each(themes.map((t) => [`${t.instance}:${t.theme.id}`, t] as const))(
    "%s has a block with its own accent — a card citing it does not fall back to the default",
    (_, t) => {
      const start = committed.indexOf(`[data-fa-sticky-theme="${t.theme.id}"] {`);
      expect(start).toBeGreaterThan(-1);
      const block = committed.slice(start, committed.indexOf("}", start));
      expect(block).toContain(`--fa-sticky-accent: ${t.theme.palette.accent};`);
    },
  );
});
