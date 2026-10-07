/**
 * `ensure-landing-sticky` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/ensure-landing-sticky.test.ts` (bean `7zz1`,
 * owner ruling 2026-10-06 "Top-level instance"): each reads every harness card
 * the checkout's live board carries, which only the checkout holds. Standing
 * alone, cat-harness has none of it, and `check:cat-harness-standalone`
 * collects every test in that layer. The rest of that file's tests stay there;
 * every path here is composed from ORIGIN_DIR, the directory they were written
 * in, so nothing they read changed.
 */
import { describe, expect, test } from "bun:test";

import { join } from "node:path";

import {
  declaredContributions,
  readLandingStickies,
  readerTextProblems,
} from "../cat-harness/scripts/ensure-landing-sticky.js";
import { instanceRootFor } from "../cat-harness/schemas/cat-harness.js";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

describe("a harness sticky shows the landing's text, not the author's (ob3m 3)", () => {

  test("the live board: every harness card opens with its declaration's summary", () => {
    const root = instanceRootFor(join(ORIGIN_DIR, ".."));
    expect(readerTextProblems(root)).toEqual([]);
    const cards = new Map(readLandingStickies(root).map((s) => [s.id, s]));
    let judged = 0;
    for (const d of declaredContributions(root)) {
      if (d.contribution.bodyFrom === undefined || d.summary === undefined) continue;
      const card = cards.get(d.contribution.id);
      expect(card).toBeDefined();
      expect(card!.comment.startsWith(d.summary)).toBe(true);
      for (const w of d.alsoWritten ?? []) expect(card!.comment).toContain(`\`${w}\``);
      if (d.description !== undefined && d.description !== d.summary) {
        expect(card!.comment).not.toContain(d.description);
      }
      judged += 1;
    }
    // folio-assistant and cat-harness both declare a summary. A count of zero
    // would mean this loop judged nothing and passed over it.
    expect(judged).toBeGreaterThanOrEqual(2);
  });
});
