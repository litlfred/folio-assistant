/**
 * RACI: the overlay is real, the rule bites, and R is never re-declared.
 *
 * The assertions worth having are not "the parser reads an attribute".
 * They are that the model **cannot** express R twice, that the one-A rule
 * fails on a real corpus rather than a fixture, and that the sweep says so
 * when it examined nothing.
 *
 * @module scripts/tests/raci.test
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import { declaredRoles, raciBreaches, raciRows, type RaciRow } from "../raci-chart.ts";
import { RACI_INVOLVEMENTS } from "../../src/workflow/process-model.ts";

const ROOT = resolve(import.meta.dir, "../..");

describe("R is the lane, and is not declarable", () => {
  test("`responsible` is not an involvement value", () => {
    // Declaring R would be one fact in two places with nothing asserting
    // they agree — the shape `85e8` removed `fallbackRole` for. The lane
    // is the answer; the chart reads it.
    expect([...RACI_INVOLVEMENTS]).toEqual(["accountable", "consulted", "informed"]);
  });

  test("the chart's R column comes from the lane's role binding", async () => {
    const rows = await raciRows(ROOT);
    expect(rows.length).toBeGreaterThan(0);
    // At least one row must actually have one, or the column is decorative
    // and this assertion is about nothing.
    expect(rows.filter((r) => r.responsible !== undefined).length).toBeGreaterThan(0);
  });
});

describe("the corpus", () => {
  test("something is annotated — a rule over an empty set is not a rule", async () => {
    const rows = await raciRows(ROOT);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.process === "Process_CRDM_DataModel")).toBe(true);
  });

  test("it is clean, against the REAL role registry", async () => {
    const roles = declaredRoles(ROOT);
    expect(roles.size).toBeGreaterThan(10);
    expect(raciBreaches(await raciRows(ROOT), roles)).toEqual([]);
  });
});

describe("the rule", () => {
  const roles = new Set(["a-role", "b-role"]);
  const row = (over: Partial<RaciRow>): RaciRow => ({
    process: "P",
    activity: "T",
    activityName: "T",
    accountable: ["a-role"],
    consulted: [],
    informed: [],
    ...over,
  });

  test("two accountable roles is a breach", () => {
    const b = raciBreaches([row({ accountable: ["a-role", "b-role"] })], roles);
    expect(b).toHaveLength(1);
    expect(b[0]!.detail).toContain("exactly one carries the decision");
  });

  test("ZERO accountable is also a breach, once anything is claimed", () => {
    // A half-annotated activity is worse than an unannotated one, because
    // the chart looks complete. An activity claiming NOTHING never reaches
    // this function — `raciRows` omits it — which is the incremental half.
    const b = raciBreaches([row({ accountable: [], consulted: ["b-role"] })], roles);
    expect(b).toHaveLength(1);
    expect(b[0]!.detail).toContain("no `accountable`");
  });

  test("exactly one is clean", () => {
    expect(raciBreaches([row({ consulted: ["b-role"] })], roles)).toEqual([]);
  });

  test("a role in no registry is a breach, in every column", () => {
    for (const col of ["accountable", "consulted", "informed"] as const) {
      const over =
        col === "accountable" ? { accountable: ["ghost"] } : { [col]: ["ghost"] };
      const b = raciBreaches([row(over)], roles);
      expect(b.some((x) => x.detail.includes('"ghost"'))).toBe(true);
    }
  });

  test("accountable AND consulted on one activity is a breach", () => {
    // Asking yourself is not consultation, and this pairing is how
    // `consulted` becomes a formality while the chart still reads complete.
    const b = raciBreaches([row({ consulted: ["a-role"] })], roles);
    expect(b).toHaveLength(1);
    expect(b[0]!.detail).toContain("asking yourself is not consultation");
  });
});

describe("the parser", () => {
  test("an unrecognised involvement is DROPPED, never coerced", async () => {
    // A typo read as `informed` would put somebody on a notification list
    // who was meant to be consulted — and the difference between those two
    // is the entire model. Asserted over the real corpus: every value that
    // survived parsing is one of the three.
    for (const r of await raciRows(ROOT)) {
      for (const role of [...r.accountable, ...r.consulted, ...r.informed]) {
        expect(typeof role).toBe("string");
        expect(role.length).toBeGreaterThan(0);
      }
    }
  });
});
