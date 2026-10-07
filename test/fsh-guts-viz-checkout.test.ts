/**
 * `fsh-guts-viz` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/fsh-guts-viz.test.ts` (bean `7zz1`, owner ruling
 * 2026-10-06 "Top-level instance"): each reads the root-declared `fsh-guts/`
 * graph, which only the checkout holds. Standing alone, cat-harness has none
 * of it, and `check:cat-harness-standalone` collects every test in that layer.
 * The rest of that file's tests stay there; every path here is composed from
 * ORIGIN_DIR, the directory they were written in, so nothing they read
 * changed.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import { gutsDir, gutsFiles } from "../cat-harness/scripts/gen-fsh-guts-viz.ts";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

describe("corpus — the real directory, so a regression cannot pass on fixtures", () => {
  test("no archived source reads as undeclared, and no title is binary", () => {
    const files = gutsFiles(gutsDir(join(ORIGIN_DIR, "../../.."))!);
    const uploads = files.filter((f) => f.group === "uploads");
    expect(uploads.length).toBeGreaterThan(0);
    expect(uploads.filter((f) => f.state === "undeclared")).toEqual([]);
    for (const f of files) {
      expect(f.title ?? "", `${f.rel} has a binary title`).not.toContain("�");
    }
  });
});
