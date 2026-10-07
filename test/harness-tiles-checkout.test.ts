/**
 * `harness-tiles` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/harness-tiles.test.ts` (bean `7zz1`, owner ruling
 * 2026-10-06 "Top-level instance"): each reads who-iris's own theme, which
 * only the checkout holds. Standing alone, cat-harness has none of it, and
 * `check:cat-harness-standalone` collects every test in that layer. The rest
 * of that file's tests stay there; every path here is composed from
 * ORIGIN_DIR, the directory they were written in, so nothing they read
 * changed.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import { harnessTiles } from "../cat-harness/scripts/harness-tiles.js";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

describe("an instance's OWN theme tones its tile (bean v8n5)", () => {
  // Over THIS repository, because the subject is a real reference: who-iris's
  // card cites `{instance: "who-iris", themeId: "iris-sticky"}`, a theme the
  // platform does not hold. If resolution fell back to the platform default,
  // or the tone to the avatar registry, the tile would still render — on the
  // wrong hue — which is why this is a test and not a glance.
  const REPO = join(ORIGIN_DIR, "..", "..", "..");
  const HOST = join(REPO, "cat-harness");
  const tiles = harnessTiles(REPO, HOST, ["who-iris", "cat-harness", "bootstrap"]);

  test("who-iris's tile tone is the hue of its own theme's accent, not the avatar's", async () => {
    const { themeByRef } = await import("../cat-harness/schemas/theme-by-ref.js");
    const { hexHue } = await import("../cat-harness/schemas/theme.js");
    const r = themeByRef({ instance: "who-iris", themeId: "iris-sticky" }, REPO);
    expect(r.ok).toBe(true);
    const who = tiles.find((t) => t.name === "who-iris")!;
    expect(who.toneFrom).toBe("theme");
    expect(who.tone).toBe(hexHue(r.ok ? r.theme.palette.accent : "")!);
    expect(who.findings.join(" ")).not.toContain("not installed");
  });
});
