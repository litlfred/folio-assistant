/**
 * `staging-stamp` tests that read the aggregate repository's own root —
 * `.github/workflows/feature-staging.yml` — moved here from
 * `cat-harness/scripts/tests/staging-stamp.test.ts` (bean `ho66`), as
 * `merge-guard-workflows.test.ts` was: a standalone cat-harness layer has no
 * such root, and `check:cat-harness-standalone` collects every test in that
 * layer. The rest of that file's tests stay there.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { repoRootFor } from "../../../cat-harness/schemas/cat-harness.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("the workflow no longer stamps out of band", () => {
  it("feature-staging.yml does not rewrite the export after writing it", () => {
    const wf = readFileSync(join(repoRootFor(ROOT), ".github", "workflows", "feature-staging.yml"), "utf-8");
    // The inline rewrite reached the JSON-LD and nothing else. If it comes
    // back, the schema documents go unstamped again and the two stamps can
    // disagree.
    expect(wf).not.toMatch(/d\.staging\s*=/);
  });
});
