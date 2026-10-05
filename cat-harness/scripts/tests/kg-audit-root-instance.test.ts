/**
 * `kg:audit --instance .` audits the instance declared AT the repository root.
 *
 * ## The defect this pins (bean `pgzn`)
 *
 * `kg-audit.ts` computed its repository root as `resolve(root, "..")` — that
 * is `dirname`, right for every instance nested one level under the checkout
 * and wrong for the one declared at its root. Measured on `main` `cf3e624`:
 *
 * ```
 * bun run cat-harness/scripts/kg-audit.ts --instance .
 *   ENOENT: no such file or directory, open '<parent of checkout>/package.json'
 *     at rootScripts (cat-harness/scripts/pair-claims.ts)
 * ```
 *
 * so the root instance was audited by nothing, and `kg-audit-all.ts` skipped
 * it by name. The audit now asks `checkoutRootFor`.
 *
 * ## Why two assertions and not one
 *
 * "Did not throw" alone would pass a run that printed nothing useful. So the
 * run must ALSO emit its JSON report with at least one subject, and the
 * resolved repository root must be the checkout — not its parent — which is
 * asserted directly against the helper the audit now uses, so a regression to
 * `dirname` fails here before it fails as a crash.
 *
 * @module scripts/tests/kg-audit-root-instance
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { readDeclaration, repoRootFor } from "../../schemas/cat-harness.js";
import { checkoutRootFor } from "../../schemas/harness-config.js";
import { inAggregate } from "../../test/support/checkout.js";

const REPO = resolve(import.meta.dir, "../../..");

describe("kg:audit over the instance declared at the repository root (bean `pgzn`)", () => {
  test("the repository root IS a declared instance, so the case is not vacuous", () => {
    expect(readDeclaration(REPO), "no declaration at the repository root — this test has no subject").toBeTruthy();
  });

  // The root instance here is the AGGREGATE's, the one checkout whose root
  // carries `package.json` and nests `cat-harness/`. cat-harness run as its own
  // clone is a different shape — schemas/instance-roots-worktrees.test.ts
  // covers a checkout answering itself there — so this is skipped, not passed
  // (bean `ho66`).
  test.skipIf(!inAggregate())("checkoutRootFor resolves the root instance to the checkout, where repoRootFor climbs out", () => {
    // The falsifier: `dirname` lands where there is no package.json.
    expect(resolve(repoRootFor(REPO))).not.toBe(REPO);
    expect(checkoutRootFor(REPO)).toBe(REPO);
    expect(existsSync(join(checkoutRootFor(REPO), "package.json"))).toBe(true);
    // And it agrees with `dirname` for a nested instance.
    const nested = join(REPO, "cat-harness");
    expect(checkoutRootFor(nested)).toBe(resolve(repoRootFor(nested)));
  });

  test("`--instance .` emits a report rather than throwing", async () => {
    // `--check` so the run writes nothing into the tree it is judging.
    const p = Bun.spawn(
      ["bun", "run", "cat-harness/scripts/kg-audit.ts", "--instance", ".", "--check", "--json"],
      { cwd: REPO, stdout: "pipe", stderr: "pipe" },
    );
    const out = await new Response(p.stdout).text();
    const err = await new Response(p.stderr).text();
    await p.exited;

    expect(err, "the audit crashed before reporting").not.toContain("ENOENT");
    let parsed: { reports?: unknown[] } | undefined;
    try {
      parsed = JSON.parse(out) as { reports?: unknown[] };
    } catch {
      parsed = undefined;
    }
    expect(parsed, `no JSON report:\n${err.slice(-600)}`).toBeDefined();
    expect(parsed!.reports?.length ?? 0).toBeGreaterThan(0);
  }, 120_000);
});
