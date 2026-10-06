/**
 * `compose-docs` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/compose-docs.test.ts` (bean `7zz1`, owner ruling
 * 2026-10-06 "Top-level instance"): each reads the root instance's
 * declaration, which declares the `root-docs` layer, which only the checkout
 * holds. Standing alone, cat-harness has none of it, and
 * `check:cat-harness-standalone` collects every test in that layer. The rest
 * of that file's tests stay there; every path here is composed from
 * ORIGIN_DIR, the directory they were written in, so nothing they read
 * changed.
 */
import { describe, expect, test } from "bun:test";
import { join, resolve } from "node:path";

import { docsLayers } from "../cat-harness/scripts/compose-docs.ts";
import {  } from "../cat-harness/schemas/cat-harness.js";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

const REPO = resolve(ORIGIN_DIR, "..", "..", "..");

describe("compose-docs reads its layers from the declaration", () => {

  test("the REAL repository declares exactly the two layers this is built on", () => {
    // Vacuity guard: every fixture test below would pass against a repository
    // that had no layers at all.
    const { layers, missing } = docsLayers(REPO);
    expect(missing).toEqual([]);
    expect(layers.map((l) => l.id)).toEqual(["docs", "root-docs"]);
  });
});
