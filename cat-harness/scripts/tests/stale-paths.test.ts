/**
 * Stale paths, and the two false-positive classes that were measured and closed.
 *
 * Bean `k59d`. The first draft of this rule produced **three findings over the
 * whole store, of which two were wrong** — which is the ratio that makes a rule
 * worth narrowing rather than shipping. Both wrong ones have a guard below, and
 * those guards must keep passing if the rule is ever widened.
 *
 * @module folio-assistant/scripts/tests/stale-paths
 */

import { describe, expect, test } from "bun:test";

import { attributedTo, chainRefs, stalePaths, underPathHeading, type Bean } from "../check-stale-paths.ts";

const bean = (id: string, status: string, body: string): Bean => ({
  id,
  status,
  title: id,
  body,
  file: `${id}.md`,
  archived: false,
  frontMatter: "",
  type: "task",
  parent: "",
  tags: [],
});

/** A store: one open bean carrying `body`, plus the closed beans it names. */
const store = (body: string, closed: string[] = ["2krx"], openId = "p5wm"): Bean[] => [
  bean(openId, "in-progress", body),
  ...closed.map((c) => bean(c, "completed", "")),
];

describe("a path through finished work is a finding", () => {
  test("an arrow chain routing through a completed bean", () => {
    const r = stalePaths(store("`b5f0` → `2krx` → `supn`\n"));
    expect(r).toHaveLength(1);
    expect(r[0]!.rule).toBe("chain");
    expect(r[0]!.through.map((t) => t.id)).toEqual(["2krx"]);
  });

  test("the ASCII arrow is the same rule — the corpus uses both", () => {
    expect(stalePaths(store("`b5f0` -> `2krx` -> `supn`\n"))).toHaveLength(1);
  });

  test("a numbered step under a path heading", () => {
    const r = stalePaths(store("## Shortest path\n\n1. Close `2krx`, which is built\n"));
    expect(r).toHaveLength(1);
    expect(r[0]!.rule).toBe("numbered-step");
  });

  test("a scrapped bean counts as finished too", () => {
    const beans = [bean("p5wm", "in-progress", "`a1b2` → `dead` → `z9y8`\n"), bean("dead", "scrapped", "")];
    expect(stalePaths(beans)).toHaveLength(1);
  });

  test("a path through OPEN work is not a finding", () => {
    const beans = [bean("p5wm", "in-progress", "`b5f0` → `live` → `supn`\n"), bean("live", "todo", "")];
    expect(stalePaths(beans)).toHaveLength(0);
  });

  test("a CLOSED bean's own stale path is not reported — it is finished", () => {
    const beans = [bean("old", "completed", "`b5f0` → `2krx`\n"), bean("2krx", "completed", "")];
    expect(stalePaths(beans)).toHaveLength(0);
  });
});

// ── The two guards. Each closes a class MEASURED on the real store. ──

describe("GUARD: an arrow is not always a dependency", () => {
  test("a line-count range is not a route, even with a closed id in the same paragraph", () => {
    // `x3bd`, verbatim in shape: "README is 97 → 66 lines" in a long paragraph
    // that also mentions a closed bean hundreds of characters away. The first
    // draft asked only "arrow on the line, closed id on the line".
    const r = stalePaths(store("README is 97 → 66 lines, and bean `2krx` carries the reason.\n"));
    expect(r).toHaveLength(0);
  });

  test("an id must be an OPERAND of the arrow, not merely nearby", () => {
    expect(chainRefs("`a1b2` → `c3d4`")).toEqual(expect.arrayContaining(["a1b2", "c3d4"]));
    expect(chainRefs("some prose with `a1b2` and no arrow at all")).toEqual([]);
  });
});

describe("GUARD: a bean describing ANOTHER bean's stale path is not stale", () => {
  test("a table row is attributed by its first cell", () => {
    // `k59d` quotes `p5wm`'s chain as evidence and was reported as its own
    // defect. The same shape `check-bean-bodies` closed with a quotation guard,
    // and the same shape that flagged `jijc` hours earlier.
    const known = new Set(["p5wm", "2krx"]);
    expect(attributedTo("| `p5wm` (GOAL 2) | critical path `b5f0 → 2krx` | `2krx` is done |", ["2krx"], known)).toBe(
      "p5wm",
    );
  });

  test("a quoted chain in a table row produces no finding", () => {
    const beans = [
      bean("k59d", "in-progress", "| `p5wm` | critical path `b5f0 → 2krx → supn` | `2krx` is completed |\n"),
      bean("p5wm", "in-progress", ""),
      bean("2krx", "completed", ""),
    ];
    expect(stalePaths(beans)).toHaveLength(0);
  });

  test("a bean stating its OWN path is still reported — the guard must not swallow it", () => {
    // The direction that matters: narrowing for the quoted case must not make
    // the real case invisible.
    expect(stalePaths(store("`b5f0` → `2krx` → `supn`\n"))).toHaveLength(1);
  });
});

describe("a numbered step is only a path when its heading says so", () => {
  test("a heading naming a path qualifies", () => {
    expect(underPathHeading(["## Shortest path", "", "1. do `2krx`"], 2)).toBe(true);
  });

  test("an ordinary numbered list under an unrelated heading does not", () => {
    // Otherwise every enumerated note in the store becomes a route.
    expect(underPathHeading(["## Measured", "", "1. do `2krx`"], 2)).toBe(false);
  });

  test("a numbered list under no heading at all does not", () => {
    expect(underPathHeading(["1. do `2krx`"], 0)).toBe(false);
  });
});
