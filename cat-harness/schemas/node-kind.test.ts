/**
 * Node-kind multiple inheritance (bean a1lq). Each refusal is tested as a rule:
 * one case where it must throw and one where the same shape is legitimate.
 */
import { describe, expect, it } from "bun:test";
import { z } from "zod";

import { nodeKind } from "./node-kind";
import { TodoNodeKind, TodoNodeSchema, type TodoNode } from "./todo";

const base = nodeKind("base", [], { id: z.string() });

describe("nodeKind", () => {
  it("a diamond composes the shared ancestor once, deepest first", () => {
    const left = nodeKind("left", [base], { l: z.string() });
    const right = nodeKind("right", [base], { r: z.string() });
    const child = nodeKind("child", [left, right], { c: z.string() });
    expect(child.order).toEqual(["base", "left", "right", "child"]);
    expect(Object.keys(child.schema.shape)).toEqual(["id", "l", "r", "c"]);
  });

  it("refuses a field two unrelated parents define", () => {
    const a = nodeKind("a", [], { k: z.string() });
    const b = nodeKind("b", [], { k: z.number() });
    expect(() => nodeKind("ab", [a, b], {})).toThrow(/`k` is defined by `a` and `b`/);
  });

  it("refuses it at different depths too — incomparable, not same-depth", () => {
    const a = nodeKind("a", [], { k: z.string() });
    const d = nodeKind("d", [], { k: z.number() });
    const b = nodeKind("b", [d], {});
    expect(() => nodeKind("ab", [a, b], {})).toThrow(/`k` is defined by/);
  });

  it("the child settles such a conflict by redefining the field, declared", () => {
    const a = nodeKind("a", [], { k: z.string() });
    const b = nodeKind("b", [], { k: z.number() });
    const ab = nodeKind("ab", [a, b], { k: z.boolean() }, { overrides: ["k"] });
    expect(ab.schema.parse({ k: true })).toEqual({ k: true });
  });

  it("refuses an override the child did not declare, and one that overrides nothing", () => {
    expect(() => nodeKind("x", [base], { id: z.number() })).toThrow(/without being listed in `overrides`/);
    expect(() => nodeKind("y", [base], { z: z.number() }, { overrides: ["z"] })).toThrow(/no ancestor defines it/);
  });

  it("refuses two different kinds under one id", () => {
    const twin = nodeKind("base", [], { other: z.string() });
    expect(() => nodeKind("both", [base, twin], {})).toThrow(/two different kinds are both named `base`/);
  });
});

describe("the todo declares its parents", () => {
  it("is composed carried-note, then themed, then its own fields", () => {
    expect(TodoNodeKind.order).toEqual(["carried-note", "themed", "folio-todo/v1"]);
    expect(Object.keys(TodoNodeSchema.shape)).toEqual([
      "id", "summary", "comment", "createdAt", "updatedAt", "targetLabel", "anchor", "alsoAbout", "tags",
      "theme", "layout", "status", "priority", "origin", "$schema",
    ]);
  });

  it("keeps its static type — a field from each parent is typed, not unknown", () => {
    const t = {} as TodoNode;
    const fromNote: string = t.summary;
    const fromThemed: string | undefined = t.theme;
    const own: "folio-todo/v1" = t.$schema;
    expect([fromNote, fromThemed, own]).toBeDefined();
  });
});
