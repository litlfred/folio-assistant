/**
 * `check-bean-parents` tests that read the aggregate repository's own root —
 * the root-declared `beans/` store — moved here from
 * `cat-harness/scripts/tests/check-bean-parents.test.ts` (bean `ho66`), as
 * `merge-guard-workflows.test.ts` was: a standalone cat-harness layer has no
 * such root, and `check:cat-harness-standalone` collects every test in that
 * layer. The rest of that file's tests stay there.
 *
 * Moved again, from `cat-harness-tools/scripts/tests/` to the checkout's own
 * test home `test/` (bean `7zz1`, owner ruling 2026-10-06 "Top-level
 * instance"): what it reads belongs to the whole checkout, which the root
 * instance declares, not to any one layer — so cat-harness-tools stays green
 * standing alone too.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { join } from "node:path";

import { checkBeanParents } from "../cat-harness/scripts/check-bean-parents.ts";
import { repoRootFor } from "../cat-harness/schemas/cat-harness.js";

/**
 * The directory this test was written in (`cat-harness/scripts/tests/`): every path below
 * is composed from it exactly as it was before the move, so nothing it reads changed.
 */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("every open bean belongs to an epic", () => {

  test("the real corpus passes", () => {
    const r = checkBeanParents(repoRootFor(join(ORIGIN_DIR, "../..")));
    expect({ orphans: r.problems }).toEqual({ orphans: [] });
    expect(r.open).toBeGreaterThan(50);
  });
});
