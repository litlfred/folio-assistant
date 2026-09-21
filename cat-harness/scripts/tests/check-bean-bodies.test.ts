/**
 * Tests for the bean-body reader, and specifically for the `shadow-checklist`
 * detector added under bean `sfhr`.
 *
 * Each pins a DISCRIMINATION rather than the happy path, because the whole
 * difficulty here is that the defect and a legitimate idiom look almost
 * identical. Measured on this store before the rule was written:
 *
 * | candidate rule | findings | why it fails |
 * |---|---|---|
 * | more than one `## Done when` heading | 34 beans | the real `bbbl` case had NO second heading — the copy was appended bare |
 * | any checklist item below the canonical section | 57 beans | recording a NEW open item in a dated entry is this store's ordinary idiom |
 * | a later item that restates a canonical one | 33 beans | a progress note quoting the item it just satisfied reads the same |
 *
 * What separates them is an ASYMMETRY, and the bean says it outright: *"the
 * ticks were appended as a SECOND copy of the checklist at the foot of the
 * file, so the canonical `## Done when` still read 0 of 2 and any reader or
 * tool consulting it saw an untouched bean."* So the rule is: a later item
 * **ticked** while the canonical item it restates is **open**.
 *
 * @module scripts/tests/check-bean-bodies.test
 */
import { describe, expect, test } from "bun:test";

import {
  SHADOW_MIN_WORDS,
  checklistItems,
  overlap,
  shadowedItems,
  splitChecklist,
  words,
} from "../check-bean-bodies.ts";

/** A bean body with a canonical section and whatever follows it. */
function body(canonical: string, after = ""): string {
  return `Some prose.\n\n## Done when\n${canonical}\n\n## Later\n${after}\n`;
}

describe("checklistItems", () => {
  test("an indented continuation belongs to its item", () => {
    const [item] = checklistItems("- [ ] the first half\n      and the second half");
    expect(item!.text).toBe("the first half and the second half");
    expect(item!.done).toBe(false);
  });

  test("reads both tick spellings and stops at a non-continuation line", () => {
    const items = checklistItems("- [x] done one\n- [X] done two\n\nprose\n- [ ] open");
    expect(items.map((i) => i.done)).toEqual([true, true, false]);
  });
});

describe("splitChecklist", () => {
  test("a bean with no `## Done when` has no checklist to compare", () => {
    expect(splitChecklist("just prose\n\n- [ ] a stray box")).toEqual({ canonical: [], later: [] });
  });

  test("the canonical section ends at the next heading", () => {
    const { canonical, later } = splitChecklist(body("- [ ] canonical one", "- [x] later one"));
    expect(canonical).toHaveLength(1);
    expect(later).toHaveLength(1);
  });
});

describe("overlap", () => {
  test("containment, not equality — the real copies were not verbatim", () => {
    // `fgnw`'s appended copy dropped a parenthetical; `9x17`'s paraphrased.
    const a = words("`bun run health` reports claims without activity in the window");
    const b = words("`bun run health` (or the goal-review sweep) reports claims without activity in the window");
    expect(overlap(a, b)).toBe(1);
  });

  test("unrelated items do not overlap", () => {
    expect(overlap(words("render the navbar tile"), words("resolve a workflow path"))).toBeLessThan(0.3);
  });
});

describe("shadowedItems — the defect", () => {
  test("a later TICKED item restating an OPEN canonical one is the defect", () => {
    const found = shadowedItems(
      body(
        "- [ ] a check reads every fenced command in the entry documents and fails",
        "- [x] a check reads every fenced command in the entry documents and fails",
      ),
    );
    expect(found).toHaveLength(1);
  });

  test("...and it still fires when the copy paraphrases", () => {
    // `9x17`: "schema validation as its operation" for "schema validation and
    // profile check as DISTINCT operations". An equality test passes over it.
    const found = shadowedItems(
      body(
        "- [ ] a Tool node with schema validation and profile check as DISTINCT operations",
        "- [x] a Tool node with schema validation as its operation",
      ),
    );
    expect(found).toHaveLength(1);
  });
});

describe("shadowedItems — what it must NOT report", () => {
  test("a NEW open item below the section is the store's ordinary idiom", () => {
    // 57 of 323 beans do this. Reporting it would make the check unreadable.
    expect(
      shadowedItems(body("- [ ] the canonical thing", "- [ ] a different thing found later")),
    ).toEqual([]);
  });

  test("a progress note restating an item the canonical section ALREADY ticks", () => {
    // The note agrees with the canonical section, so there is nothing to fix.
    expect(
      shadowedItems(
        body(
          "- [x] a check reads every fenced command in the entry documents and fails",
          "- [x] a check reads every fenced command in the entry documents and fails — shipped",
        ),
      ),
    ).toEqual([]);
  });

  test("an UNTICKED later copy of an open canonical item", () => {
    // Redundant, but it tells the same story as the canonical section, so the
    // reader is not misled and this check does not own tidiness.
    expect(
      shadowedItems(body("- [ ] the canonical thing here", "- [ ] the canonical thing here")),
    ).toEqual([]);
  });

  test("a short item is too generic for overlap to mean anything", () => {
    const short = "- [ ] ship it";
    expect(words("ship it").length).toBeLessThan(SHADOW_MIN_WORDS);
    expect(shadowedItems(body(short, "- [x] ship it"))).toEqual([]);
  });

  test("a bean with no canonical section reports nothing", () => {
    expect(shadowedItems("prose\n\n- [x] a ticked item with no Done when heading here")).toEqual([]);
  });
});
