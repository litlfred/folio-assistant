/**
 * The baseline split, and the one direction a baseline must never fail in.
 *
 * Bean `yl5w`. `check-catalogue.ts` found three ORIGINAL-bundle bitstreams
 * claiming `state: "materialized"` with a `localPath` naming nothing, and they
 * are baselined rather than fixed because the repair is a CONTENT correction
 * on another instance's catalogue — each also carries a `sourceLoss:
 * permitted` gate whose stated basis is that the bytes are held locally.
 *
 * The tests that matter here are the two failure directions, not the happy
 * path: a NEW defect must fail even though a baseline exists, and an
 * unreadable baseline must behave as EMPTY rather than as "everything known".
 *
 * @module who-iris/scripts/tests/catalogue-baseline
 */

import { describe, expect, test } from "bun:test";

import { partitionAgainstBaseline, readBaseline, type Finding } from "../catalogue-baseline.ts";

const f = (key: string): Finding => ({ key, line: `${key}: localPath does not exist` });

describe("the baseline lists a backlog without hiding a new defect", () => {
  test("a finding in the baseline is outstanding, not a problem", () => {
    const r = partitionAgainstBaseline([f("item/a bitstreams[0]")], new Set(["item/a bitstreams[0]"]));
    expect(r.problems).toHaveLength(0);
    expect(r.outstanding).toHaveLength(1);
    expect(r.stale).toHaveLength(0);
  });

  test("a NEW finding fails even when the baseline is non-empty", () => {
    // The whole point. A baseline that suppressed everything would turn the
    // three known defects into permission for a fourth.
    const r = partitionAgainstBaseline(
      [f("item/a bitstreams[0]"), f("item/b bitstreams[0]")],
      new Set(["item/a bitstreams[0]"]),
    );
    expect(r.problems).toEqual(["item/b bitstreams[0]: localPath does not exist"]);
    expect(r.outstanding).toHaveLength(1);
  });

  test("a baseline entry nothing matched is reported stale, so the file shrinks", () => {
    // Without this a baseline only ever grows, and a repaired defect is
    // indistinguishable from one the reader stopped seeing.
    const r = partitionAgainstBaseline([], new Set(["item/gone bitstreams[0]", "item/also-gone bitstreams[1]"]));
    expect(r.stale).toEqual(["item/also-gone bitstreams[1]", "item/gone bitstreams[0]"]);
  });

  test("stale is sorted, so the report does not churn on Set order", () => {
    const r = partitionAgainstBaseline([], new Set(["z", "a", "m"]));
    expect(r.stale).toEqual(["a", "m", "z"]);
  });
});

describe("an unreadable baseline is EMPTY, never a pass", () => {
  test("unparseable JSON yields an empty set, so every finding fails", () => {
    expect(readBaseline(() => "{ not json").size).toBe(0);
  });

  test("a read that throws — a missing file — yields an empty set", () => {
    expect(
      readBaseline(() => {
        throw new Error("ENOENT");
      }).size,
    ).toBe(0);
  });

  test("a `known` that is not an array yields empty rather than throwing", () => {
    expect(readBaseline(() => '{"known": "oops"}').size).toBe(0);
  });

  test("non-string entries are dropped rather than poisoning the keys", () => {
    const s = readBaseline(() => '{"known": ["item/a bitstreams[0]", 7, null]}');
    expect([...s]).toEqual(["item/a bitstreams[0]"]);
  });

  test("a well-formed baseline reads back exactly", () => {
    const s = readBaseline(() => '{"known": ["item/a bitstreams[0]", "item/b bitstreams[1]"]}');
    expect([...s].sort()).toEqual(["item/a bitstreams[0]", "item/b bitstreams[1]"]);
  });
});
