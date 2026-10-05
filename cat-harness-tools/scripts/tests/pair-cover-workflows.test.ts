/**
 * `pair-cover.ts`'s fold, held against the CI workflows (bean `8qyc`).
 *
 * The one `pair-cover` assertion that reads `.github/workflows/`: every pair
 * the table folds, and every coverer it folds into, must be a pair `regen`
 * actually asks, which `regen` derives from the workflows through
 * `loadGates`. It lives here rather than beside the other `pair-cover` tests
 * in `cat-harness/scripts/tests/` because a standalone cat-harness layer has
 * no workflows, and `check:cat-harness-standalone` collects every test in that
 * layer. The full repository has them, and this layer is never run alone.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { COVERED } from "../../../cat-harness/scripts/pair-cover.ts";
import { repairableGates } from "../../../cat-harness/scripts/regen-after-merge.ts";
import { loadGates } from "../../../cat-harness/scripts/gates.ts";
import { repoRootFor } from "../../../cat-harness/schemas/cat-harness.ts";

const REPO = repoRootFor(join(import.meta.dir, "..", "..", "..", "cat-harness"));
const SCRIPTS = (JSON.parse(readFileSync(join(REPO, "package.json"), "utf-8")) as {
  scripts: Record<string, string>;
}).scripts;

describe("the equivalences still hold in this tree", () => {
  test("every residual is a script, and every coverer a pair regen asks", () => {
    const asked = new Set(repairableGates(loadGates(REPO, { all: false }), SCRIPTS).map((p) => p.check));
    for (const [check, c] of Object.entries(COVERED)) {
      expect(asked.has(check), `${check} is a pair`).toBe(true);
      for (const x of c.covers) expect(asked.has(x), `${check}'s coverer ${x} is a pair`).toBe(true);
      if (c.residual !== undefined) expect(SCRIPTS[c.residual], c.residual).toBeDefined();
    }
  });
});
