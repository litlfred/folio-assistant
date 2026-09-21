/**
 * The published todo index, asserted over the EMITTED FILE.
 *
 * @module scripts/tests/todo-index.test
 *
 * **Over the artefact, not over the function that built it**, and that is the
 * point rather than a preference. This document had drifted from its own
 * `$schema` three times in one session — `viewHref`/`editHref`, then
 * `theme`/`themeArt`, then `repoWeb` — and a test against the builder would
 * have passed on every one of them, because the builder was the thing that
 * changed. The contract is what a consumer downloads.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { siteDirFor } from "../../schemas/cat-harness.js";
import {
  TODO_INDEX_SCHEMA_TAG,
  TodoIndexSchema,
  resolveTarget,
  type TodoIndex,
} from "../../schemas/todo-index.js";

const ROOT = resolve(import.meta.dir, "../..");
const ASSET = join(ROOT, siteDirFor(ROOT), "assets/todos/index.json");

const published = (): { raw: string; doc: TodoIndex } => {
  const raw = readFileSync(ASSET, "utf-8");
  return { raw, doc: TodoIndexSchema.parse(JSON.parse(raw)) };
};

describe("the artefact answers `what am I?` from itself", () => {
  test("the published file parses against the schema that names it", () => {
    // The defect this module exists to end: `folio-todo-index` appeared in
    // exactly two places in this repository, neither of them a schema.
    expect(existsSync(ASSET)).toBe(true);
    const parsed = TodoIndexSchema.safeParse(JSON.parse(readFileSync(ASSET, "utf-8")));
    expect(parsed.success ? [] : parsed.error.issues).toEqual([]);
  });

  test("the tag in the file is the tag the module declares", () => {
    expect(published().doc.$schema).toBe(TODO_INDEX_SCHEMA_TAG);
  });

  test("an UNDECLARED field fails — this is what was missing while three landed unnoticed", () => {
    // The schema is strict on purpose. Without this, a field added to the
    // emitter reaches consumers with nothing able to say the version is now
    // a lie, which happened three times before this test existed.
    const { doc } = published();
    const smuggled = { ...doc, items: [{ ...doc.items[0], surprise: 1 }] };
    expect(TodoIndexSchema.safeParse(smuggled).success).toBe(false);
  });
});

describe("`target` removes a burden rather than adding a field", () => {
  test("every item with a resolvable label carries page and node", () => {
    const { doc } = published();
    const attached = doc.items.filter((i) => i.targetLabel !== undefined);
    // A corpus with no attached todo would make every assertion below vacuous,
    // so the population is asserted first.
    expect(attached.length).toBeGreaterThan(0);
    for (const i of attached) {
      expect({ id: i.id, hasTarget: i.target !== undefined }).toEqual({ id: i.id, hasTarget: true });
    }
  });

  test("`targetLabel` is KEPT, so every existing matcher still works", () => {
    // `mountPageStickies` matches `byLabel[...]` on the whole string. R3 is
    // additive: nothing had to change to keep working.
    for (const i of published().doc.items) {
      if (i.target === undefined) continue;
      expect(i.targetLabel).toBe(i.target.label);
    }
  });

  test("the pair could NOT have been recovered by splitting the string", () => {
    // The measurement that makes R3 more than tidiness. `sec:<page>-<node>`
    // with a page slug that itself contains `-`: a consumer splitting on the
    // separator gets the wrong answer, and there is no rule it could follow
    // without the page list.
    const { doc } = published();
    const hyphenated = doc.items.find((i) => i.target !== undefined && i.target.page.includes("-"));
    expect(hyphenated).toBeDefined();
    const t = hyphenated!.target!;
    const naive = t.label.replace(/^sec:/, "").split("-");
    expect(naive[0]).not.toBe(t.page);
  });

  test("a label naming no block emits NO target — absent is the third state", () => {
    const byLabel = new Map([["sec:page-node", { page: "page", node: "node" }]]);
    expect(resolveTarget(byLabel, "sec:nothing-here")).toBeUndefined();
    expect(resolveTarget(byLabel, undefined)).toBeUndefined();
    expect(resolveTarget(byLabel, "sec:page-node")).toEqual({
      page: "page",
      node: "node",
      label: "sec:page-node",
    });
  });

  test("an absent target is an ABSENT KEY, never null", () => {
    // A consumer testing truthiness and one testing presence should agree —
    // the same rule the `viewHref`/`editHref` spread already follows.
    const { raw } = published();
    expect(raw).not.toContain('"target": null');
  });
});

describe("the emitted order stays a function of the contents", () => {
  test("each item's keys are emitted in the schema's order, `target` beside `targetLabel`", () => {
    // Bean `d2kp`: this file was once unreproducible rather than stale,
    // because `readdirSync` under Bun returns raw directory order. A nested
    // object added without care reintroduces exactly that, one level down.
    const { doc } = published();
    const withTarget = doc.items.find((i) => i.target !== undefined)!;
    const keys = Object.keys(withTarget);
    expect(keys.indexOf("target")).toBe(keys.indexOf("targetLabel") + 1);
  });

  test("the nested target's own keys are fixed", () => {
    const { raw } = published();
    const m = /"target": \{\s*"(\w+)":[^}]*?"(\w+)":[^}]*?"(\w+)":/s.exec(raw);
    expect(m?.slice(1, 4)).toEqual(["page", "node", "label"]);
  });

  test("the document is INDENTED — the mergeability property, asserted", () => {
    const { raw } = published();
    expect(raw.split("\n").length).toBeGreaterThan(10);
    expect(raw.endsWith("\n")).toBe(true);
  });
});
