/**
 * `workflow-events` tests that read the aggregate repository's own root —
 * `.github/workflows/` — moved here from
 * `cat-harness/scripts/tests/workflow-events.test.ts` (bean `ho66`), as
 * `merge-guard-workflows.test.ts` was: a standalone cat-harness layer has no
 * such root, and `check:cat-harness-standalone` collects every test in that
 * layer. The rest of that file's tests stay there.
 */
import { describe, expect, test } from "bun:test";
import { join, resolve } from "node:path";

import { scanTriggers } from "../../../cat-harness/src/core/workflow-events.js";
import { repoRootFor } from "../../../cat-harness/schemas/cat-harness.js";

/**
 * The directory this test was written in (`cat-harness/scripts/tests/`): every path below
 * is composed from it exactly as it was before the move, so nothing it reads changed.
 */
const ORIGIN_DIR = join(import.meta.dir, "../../../cat-harness/scripts/tests");

describe("this repository's own workflows", () => {
  test("at least one workflow is REQUIRED on pull_request", () => {
    // The only assertion made against the real tree, and deliberately a
    // property rather than a count: if every `pull_request` workflow were
    // filtered, `required` would be empty and the check would pass
    // vacuously on every commit. Naming a number here would instead fail the
    // day somebody legitimately adds or renames a workflow — a count in a
    // test is the same defect as a count in prose.
    const scan = scanTriggers(repoRootFor(resolve(ORIGIN_DIR, "..", "..")), "pull_request");
    expect(scan.unreadable).toEqual([]);
    expect(scan.triggers.filter((t) => t.requirement === "required").length).toBeGreaterThan(0);
  });
});
