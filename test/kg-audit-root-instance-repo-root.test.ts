/**
 * `kg-audit-root-instance` tests that read the aggregate repository's own root
 * — the root instance declaration — moved here from
 * `cat-harness/scripts/tests/kg-audit-root-instance.test.ts` (bean `ho66`), as
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
import { describe, expect, test } from "bun:test";
import { join, resolve } from "node:path";

import { readDeclaration } from "../cat-harness/schemas/cat-harness.js";

/**
 * The directory this test was written in (`cat-harness/scripts/tests/`): every path below
 * is composed from it exactly as it was before the move, so nothing it reads changed.
 */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

const REPO = resolve(ORIGIN_DIR, "../../..");

describe("kg:audit over the instance declared at the repository root (bean `pgzn`)", () => {
  test("the repository root IS a declared instance, so the case is not vacuous", () => {
    expect(readDeclaration(REPO), "no declaration at the repository root — this test has no subject").toBeTruthy();
  });
});
