/**
 * `merge:watch`'s verdict: rule 1 of merge-manager-watcher §"Merge-sweep rules".
 *
 * Each fixture case is one head SHA's check runs and workflow runs, with the
 * verdict the rule gives. Every "green" case has a sibling that must not be
 * green: a cancelled job superseded only by another workflow, a red judge, a
 * missing shard.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { formatVerdict, verdictOf, type CheckRun, type WorkflowRun } from "../../merge-watch.ts";

interface Case {
  name: string;
  pr: { draft: boolean };
  checkRuns: CheckRun[];
  workflowRuns: WorkflowRun[];
  expected: string;
}

const { cases } = JSON.parse(readFileSync(join(import.meta.dir, "..", "fixtures", "merge-watch", "cases.json"), "utf8")) as { cases: Case[] };

describe("merge:watch verdict per rule 1", () => {
  test("the fixture covers the named cases", () => {
    const names = cases.map((c) => c.name);
    for (const n of ["fast-tier-only", "cancelled-then-superseded", "queued-judge", "red-shard-no-judge", "red-shard-judge-passes"]) {
      expect(names).toContain(n);
    }
  });

  for (const c of cases) {
    test(c.name, () => {
      expect(formatVerdict(verdictOf(c.pr, c.checkRuns, c.workflowRuns))).toBe(c.expected);
    });
  }

  test("no checks at all is pending, never green", () => {
    expect(formatVerdict(verdictOf({ draft: false }, [], []))).toBe("pending: no checks");
  });
});
