/**
 * The exit-2 contract for the two LaTeX checkers this layer holds
 * (folio-assistant-jh2j Finding 1): run where no folio content exists, each
 * exits 2 (could-not-determine), never 0.
 *
 * Moved from `cat-harness-tools/scripts/tests/latex-exit2-contract.test.ts`
 * with the scripts (bean `saqd`); the rest of the family is still tested there.
 */

import { describe, expect, test } from "bun:test";
import { dirname, join, resolve } from "node:path";
import { HARNESS_ROOT } from "@litlfred/cat-harness-tools/scripts/lib/roots.ts";

const ROOT = resolve(dirname(HARNESS_ROOT));

describe("LaTeX family exit-2 contract (Finding 1 on jh2j)", () => {
  test("validate-tex exits 2 on could-not-determine (no snippets in platform)", () => {
    const res = Bun.spawnSync(["bun", "run", join(import.meta.dir, "validate-tex.ts")], {
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(res.exitCode).toBe(2);
  });

  test("audit-tex-source exits 2 on could-not-determine (no content files in platform)", () => {
    const res = Bun.spawnSync(["bun", "run", join(import.meta.dir, "audit-tex-source.ts")], {
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(res.exitCode).toBe(2);
  });
});
