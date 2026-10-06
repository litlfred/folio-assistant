/**
 * `processes-viz` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/processes-viz.test.ts` (bean `7zz1`, owner ruling
 * 2026-10-06 "Top-level instance"): each regenerates the processes page over
 * every instance's diagrams, which only the checkout holds. Standing alone,
 * cat-harness has none of it, and `check:cat-harness-standalone` collects
 * every test in that layer. The rest of that file's tests stay there; every
 * path here is composed from ORIGIN_DIR, the directory they were written in,
 * so nothing they read changed.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { docsLayers } from "../cat-harness/scripts/compose-docs.js";
import { pageRelPath, publishedIndex, processRows } from "../cat-harness/scripts/gen-processes-viz.js";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

const REPO = resolve(ORIGIN_DIR, "..", "..", "..");
/** The base docs layer — asked, never spelled; `site-dir-single-answer` refuses a literal. */
const DOCS = docsLayers(REPO).layers.find((l) => !l.repositoryScoped)!.dir;

const rows = await processRows(REPO);

describe("the committed page is current", () => {

  it("and matches what the generator produces now", () => {
    // A stale page fails the unit suite rather than only the gate, which is
    // where it is noticed first.
    expect(readFileSync(join(DOCS, pageRelPath(REPO)!), "utf-8")).toBe(publishedIndex(rows));
  });
});
