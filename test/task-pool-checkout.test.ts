/**
 * `task-io` declarations held against the WHOLE CHECKOUT's script table,
 * moved here from `cat-harness/scripts/tests/task-pool.test.ts` (bean `ho66`,
 * owner ruling 2026-10-06 "Top-level instance"): `TASK_IO` names scripts that
 * cat-harness-tools and the root manifest declare, so standing alone,
 * cat-harness read them as missing. The rest of that file's tests stay there;
 * the path below is composed from ORIGIN_DIR, the directory it was written
 * in, so nothing it reads changed.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import { TASK_IO } from "../cat-harness/scripts/task-io.ts";
import { scriptsOf } from "../cat-harness/schemas/script-table.ts";

/** The directory this test was written in (`cat-harness/scripts/tests/`). */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

describe("task-io declarations", () => {
  test("every declared script exists in package.json", async () => {
    const { repoRootFor } = await import("../cat-harness/schemas/cat-harness.ts");
    const pkg = { scripts: scriptsOf(repoRootFor(join(ORIGIN_DIR, "..", ".."))) };
    for (const name of Object.keys(TASK_IO)) expect(pkg.scripts[name], `${name} is not a script`).toBeDefined();
  });
});
