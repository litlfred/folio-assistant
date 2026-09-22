/**
 * The untainted-dispatch mechanism, falsified in both directions.
 *
 * Every test here exists because the failure it names produces a GREEN result
 * rather than an error. A checker shown what the adjudicator is ruling against
 * passes vacuously; a "could not dispatch" record read as `n/a` passes
 * silently. Neither shows up as a crash, so neither shows up at all unless
 * something asks.
 */

import { describe, expect, test } from "bun:test";

import { untaintedPartitionDefects } from "../../schemas/block-qa.ts";
import type { UntaintedDispatch } from "../../schemas/block-qa.ts";
import {
  couldNotDispatchEntry,
  isCouldNotDispatch,
  isVerified,
  mergeUntainted,
  untaintedEntries,
} from "../../content/pipeline/untainted-verification.ts";
import type { QaCriterionEntry } from "../../schemas/block-qa.ts";

const SOUND: UntaintedDispatch = {
  // The checker reads the formalisation; the adjudicator reads the prose
  // claim. Disjoint, which is the whole discipline in one line.
  checker_sees: ["lean"],
  checker_withheld: ["md", "ts"],
  adjudicator_sees: ["md"],
  drift: "A restated hypothesis or a weakened conclusion is drift; renaming a bound variable is not.",
};

const FIELD_HASH = { md: "aaaaaaaaaaaa", lean: "bbbbbbbbbbbb" };

describe("untaintedPartitionDefects", () => {
  test("a sound declaration has no defects", () => {
    expect(untaintedPartitionDefects({ id: "c", depends_on: ["md", "ts", "lean"], untainted: SOUND })).toEqual([]);
  });

  test("undeclared is reported, not skipped — nobody-said is not nothing-to-check", () => {
    const d = untaintedPartitionDefects({ id: "c", depends_on: ["md"] });
    expect(d).toHaveLength(1);
    expect(d[0]).toContain("undeclared");
  });

  test("overlap: a role visible to BOTH parties is the vacuous pass", () => {
    const d = untaintedPartitionDefects({
      id: "c",
      depends_on: ["md", "ts", "lean"],
      untainted: { ...SOUND, adjudicator_sees: ["md", "lean"] },
    });
    expect(d.some((m) => m.includes("grading its own input"))).toBe(true);
  });

  test("unpartitioned: a companion added to depends_on later lands in neither set", () => {
    const d = untaintedPartitionDefects({
      id: "c",
      // `bpmn` is new and the declaration has not been updated.
      depends_on: ["md", "ts", "lean", "bpmn"],
      untainted: SOUND,
    });
    expect(d.some((m) => m.includes("unpartitioned") && m.includes("bpmn"))).toBe(true);
  });

  test("phantom: the declaration describes a criterion other than this one", () => {
    const d = untaintedPartitionDefects({
      id: "c",
      depends_on: ["md", "ts"],
      untainted: { ...SOUND, checker_sees: ["cql"], checker_withheld: ["md", "ts"] },
    });
    expect(d.some((m) => m.includes("phantom") && m.includes("cql"))).toBe(true);
  });

  test("an empty drift statement is a defect — it yields a style review", () => {
    const d = untaintedPartitionDefects({
      id: "c",
      depends_on: ["md", "ts", "lean"],
      untainted: { ...SOUND, drift: "   " },
    });
    expect(d.some((m) => m.includes("drift"))).toBe(true);
  });
});

describe("untaintedEntries", () => {
  const entries = untaintedEntries(
    {
      subject: "content/x.md",
      criterion: "c",
      intermediate: "the checker's rendering",
      checker: { id: "checker", tools_used: "none" },
      adjudicator: { id: "adjudicator" },
      verdict: "fail",
      findings: ["the conclusion is weakened"],
      reasoning: "ruled on the claim, not the wording",
    },
    FIELD_HASH,
    "deadbeef",
  );

  test("the adjudicator leads — the first entry is the operative one", () => {
    expect(entries[0].reviewer?.id).toBe("adjudicator");
    expect(entries[0].result).toBe("fail");
  });

  test("the checker ruled on nothing and must not read as a verdict", () => {
    expect(entries[1].reviewer?.id).toBe("checker");
    expect(entries[1].result).toBe("n/a");
    expect(entries[1].notes).toContain("the checker's rendering");
  });

  test("tools_used is recorded rather than assumed", () => {
    expect(entries[1].metrics?.tools_used).toBe("none");
  });

  test("a checker's n/a is NOT a could-not-dispatch record", () => {
    expect(isCouldNotDispatch(entries[1])).toBe(false);
  });
});

describe("could not dispatch — the third state", () => {
  const p = {
    subject: "content/x.md",
    criterion: "c",
    reason: "no subagent capability in this environment",
    recorded_by: { id: "coder" },
  };

  test("it is structurally distinguishable from every other n/a", () => {
    const e = couldNotDispatchEntry(p, FIELD_HASH, "deadbeef");
    expect(e.result).toBe("n/a");
    expect(isCouldNotDispatch(e)).toBe(true);
    expect(e.notes).toContain("no subagent capability");
  });

  test("a reasonless record is refused — it cannot be told from declining to try", () => {
    expect(() => couldNotDispatchEntry({ ...p, reason: "  " }, FIELD_HASH)).toThrow(/needs a reason/);
  });

  test("it is NEVER a pass", () => {
    expect(isVerified([couldNotDispatchEntry(p, FIELD_HASH)])).toBe(false);
  });

  test("not attempted is not a pass either", () => {
    expect(isVerified(undefined)).toBe(false);
    expect(isVerified([])).toBe(false);
  });

  test("a real verdict IS verified", () => {
    expect(
      isVerified(
        untaintedEntries(
          {
            subject: "s",
            criterion: "c",
            intermediate: "i",
            checker: { id: "checker" },
            adjudicator: { id: "adjudicator" },
            verdict: "pass",
          },
          FIELD_HASH,
        ),
      ),
    ).toBe(true);
  });
});

describe("mergeUntainted", () => {
  const human: QaCriterionEntry = {
    field_hash: FIELD_HASH,
    result: "pass",
    reviewer: { kind: "human", id: "litlfred" },
    reviewed_at: "2026-09-21T00:00:00Z",
  };
  const staleAgent: QaCriterionEntry = {
    field_hash: FIELD_HASH,
    result: "fail",
    reviewer: { kind: "agent", id: "an earlier pair" },
    reviewed_at: "2026-09-21T00:00:00Z",
  };

  test("a sweep replaces only entries whose reviewer is itself", () => {
    const fresh = untaintedEntries(
      {
        subject: "s",
        criterion: "c",
        intermediate: "i",
        checker: { id: "checker" },
        adjudicator: { id: "adjudicator" },
        verdict: "pass",
      },
      FIELD_HASH,
    );
    const merged = mergeUntainted([staleAgent, human], fresh);
    // The human ruling survives; the earlier agent pair does not.
    expect(merged.map((e) => e.reviewer?.id)).toEqual(["adjudicator", "checker", "litlfred"]);
  });
});
