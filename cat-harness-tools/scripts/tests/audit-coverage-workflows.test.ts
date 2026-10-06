/**
 * `audit-coverage` tests that read the aggregate repository's own root —
 * `.github/workflows/code-quality-gates.yml` — moved here from
 * `cat-harness/scripts/tests/audit-coverage.test.ts` (bean `ho66`), as
 * `merge-guard-workflows.test.ts` was: a standalone cat-harness layer has no
 * such root, and `check:cat-harness-standalone` collects every test in that
 * layer. The rest of that file's tests stay there.
 */
import { describe, expect, test } from "bun:test";

import { coverage, gateCoverage } from "../../../cat-harness/scripts/audit-coverage.js";
import { repoRootFor } from "../../../cat-harness/schemas/cat-harness.js";

const INSTANCE = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const REPO = repoRootFor(INSTANCE);

describe("the report is a fixpoint", () => {
  test("running it once is enough to satisfy the gate", () => {
    // Its own sidecar lives in the `qa-results` graph, so the `qa` row counts
    // it, and writing it changed the next run's answer — for ever. The first
    // version could only be satisfied by running the writer TWICE, which is not
    // a gate anybody would keep. A measurement must not be a term in itself.
    const a = coverage(REPO);
    const b = coverage(REPO);
    expect(JSON.stringify(a.rows)).toBe(JSON.stringify(b.rows));
    const qa = a.rows.find((r) => r.kind === "qa");
    expect(qa).toBeDefined();
    // With `test/results/` absent from the checkout — QA on the `qa-reports`
    // branch (bean 0dav) — there is nothing to count, and the row must say
    // UNKNOWN rather than `empty` (readers-audit C8). Since bean `5hox` every
    // `qa` directory declares `storage`, and the census skips a stored
    // directory whether or not a working copy is there: the row is `stored`.
    if (qa!.state === "unknown" || qa!.state === "stored") {
      expect(qa!.files).toBe(0);
      return;
    }
    // The exclusion is one file, not the family: every OTHER `.qa-results.json`
    // is still counted, or the row would stop measuring the thing it names.
    expect(qa!.sidecars).toBeGreaterThan(1);
  }, 60_000);
});

describe("gateCoverage", () => {
  test("it reads the browser jobs too", () => {
    // `--all`. A coverage report that silently dropped the e2e gates would
    // under-count for a reason invisible in its own output.
    const g = gateCoverage(INSTANCE, REPO);
    expect(g.some((x) => x.command.includes("render:bpmn"))).toBe(true);
  });

  test("it declares its own coverage, so the report is not exempt from its own rule", () => {
    const g = gateCoverage(INSTANCE, REPO);
    const self = g.find((x) => x.command.includes("audit:coverage"));
    expect(self?.state).toBe("none");
  });
});
