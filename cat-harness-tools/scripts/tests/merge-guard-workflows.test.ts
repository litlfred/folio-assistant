/**
 * `merge-guard.ts`'s deploy-only step, held against the staging workflow (bean `gnnj`).
 *
 * Check 5 does not refuse a Feature Staging run whose ONLY failed step is
 * `DEPLOY_ONLY_STEP`, so that string must be the name of the deploy step the
 * workflow really runs: renamed there and not here, the exemption would
 * silently stop matching and every give-up would block merges again. It lives
 * here rather than in `cat-harness/scripts/tests/merge-guard.test.ts` because a
 * standalone cat-harness layer has no workflows, and
 * `check:cat-harness-standalone` collects every test in that layer.
 */
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { DEPLOY_ONLY_STEP } from "../../../cat-harness/scripts/merge-guard.ts";

const ROOT = join(import.meta.dir, "..", "..", "..");

test("the deploy-only step name is the one the staging workflow runs", () => {
  const wf = readFileSync(join(ROOT, ".github/workflows/feature-staging.yml"), "utf8");
  expect(wf).toContain(`- name: ${DEPLOY_ONLY_STEP}\n`);
});
