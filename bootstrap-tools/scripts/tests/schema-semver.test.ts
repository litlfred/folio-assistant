/**
 * The bump classifier behind `bootstrap:semver` — skill `bootstrap-contract-semver`.
 *
 * Each case is one change to a small published-shaped schema, and the
 * assertion is the bump the skill's table requires. The `could not determine`
 * cases are the ones that must never read as "patch".
 *
 * @module scripts/tests/schema-semver.test
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { classify, diffSchema, readAtRef, requiredBump } from "../schema-semver.ts";

const BASE = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://example.org/x.schema.json",
  title: "X",
  description: "A thing.",
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    kind: { type: "string", enum: ["a", "b"] },
    note: { type: "string" },
  },
  required: ["name"],
  additionalProperties: false,
};

const text = (v: unknown): string => `${JSON.stringify(v, null, 2)}\n`;
const bump = (head: unknown): string => classify(text(BASE), text(head)).bump;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a mutable fixture edited by path in each case
const edit = (f: (s: Record<string, any>) => void): Record<string, unknown> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- as above
  const s = structuredClone(BASE) as Record<string, any>;
  f(s);
  return s;
};

describe("major — something that validated can now fail", () => {
  test("a field made required", () => expect(bump(edit((s) => s.required.push("kind")))).toBe("major"));
  test("a field removed from a closed object", () => expect(bump(edit((s) => delete s.properties.note))).toBe("major"));
  test("an enum narrowed", () => expect(bump(edit((s) => (s.properties.kind.enum = ["a"])))).toBe("major"));
  test("a lower bound raised", () => expect(bump(edit((s) => (s.properties.name.minLength = 3)))).toBe("major"));
  test("a pattern added", () => expect(bump(edit((s) => (s.properties.note.pattern = "^x")))).toBe("major"));
  test("strictness tightened: additionalProperties: false added", () => {
    const open = edit((s) => delete s.additionalProperties);
    expect(classify(text(open), text(BASE)).bump).toBe("major");
  });
  test("a conditional added", () => expect(bump(edit((s) => (s.allOf = [{ if: {}, then: {} }])))).toBe("major"));
  test("the $id changed", () => expect(bump(edit((s) => (s.$id = "https://example.org/y.schema.json")))).toBe("major"));
  test("a published schema removed", () => expect(classify(text(BASE), null).bump).toBe("major"));
  test("an unrecognised keyword changed is graded breaking, not harmless", () =>
    expect(bump(edit((s) => (s.properties.note.dependentRequired = { a: ["b"] })))).toBe("major"));
});

describe("minor — only widens", () => {
  test("an optional field added", () => expect(bump(edit((s) => (s.properties.extra = { type: "string" })))).toBe("minor"));
  test("a required field relaxed", () => expect(bump(edit((s) => (s.required = [])))).toBe("minor"));
  test("an enum widened", () => expect(bump(edit((s) => s.properties.kind.enum.push("c")))).toBe("minor"));
  test("strictness relaxed", () => expect(bump(edit((s) => delete s.additionalProperties))).toBe("minor"));
  test("a new schema published", () => expect(classify(null, text(BASE)).bump).toBe("minor"));
  test("a field added AND made required is major, not minor", () =>
    expect(
      bump(
        edit((s) => {
          s.properties.extra = { type: "string" };
          s.required.push("extra");
        }),
      ),
    ).toBe("major"));
});

describe("patch and none", () => {
  test("a description rewritten", () => expect(bump(edit((s) => (s.properties.name.description = "The name.")))).toBe("patch"));
  test("a release IRI moving to the next version is not a change to what validates", () => {
    const v1 = edit((s) => (s.$id = "https://example.org/b/0.1.0/x.schema.json"));
    const v2 = edit((s) => (s.$id = "https://example.org/b/0.2.0/x.schema.json"));
    expect(classify(text(v1), text(v2)).bump).toBe("none");
  });
  test("key order and indentation are not a change", () => {
    const reordered = JSON.stringify(Object.fromEntries(Object.entries(BASE).reverse()));
    expect(classify(text(BASE), reordered).bump).toBe("none");
  });
  test("the fold takes the highest", () =>
    expect(requiredBump([...diffSchema(BASE, edit((s) => (s.title = "Y"))), { bump: "minor", at: "/", why: "x" }])).toBe("minor"));
});

describe("could not determine — never patch", () => {
  test("an unreadable base", () => expect(classify({ unreadable: "no such ref" }, text(BASE)).bump).toBe("could not determine"));
  test("a base that does not parse", () => expect(classify("{ nope", text(BASE)).bump).toBe("could not determine"));
  test("a head that does not parse", () => expect(classify(text(BASE), "{ nope").bump).toBe("could not determine"));
  test("a ref that does not resolve, read through git", () => {
    const repo = join(import.meta.dir, "..", "..", "..");
    const r = readAtRef(repo, "refs/heads/definitely-not-a-branch-81tw", "bootstrap/schemas/graph.schema.json");
    expect(typeof r === "object" && r !== null && "unreadable" in r).toBe(true);
    expect(classify(r, readFileSync(join(repo, "bootstrap/schemas/graph.schema.json"), "utf8")).bump).toBe(
      "could not determine",
    );
  });
});
