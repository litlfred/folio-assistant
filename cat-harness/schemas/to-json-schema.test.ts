/**
 * The converter's two obligations, and they pull in opposite directions.
 *
 * It must FOLLOW a `.pipe()` to the stage that describes the node, and it must
 * NOT otherwise stop reading the input side — `io: "input"` is what makes a
 * `.default()` field render as optional, which every published schema here
 * already relies on. A fix for the first that breaks the second would empty a
 * published contract in the other direction, and this module's docblock is
 * about exactly that class of silent emptying.
 *
 * Bean `xp5j`. The guard-then-parse idiom
 *
 *     z.looseObject({}).superRefine(guard).pipe(RealShapeSchema)
 *
 * converts to `{type:"object"}` with no properties if the input side is read,
 * because the input side IS the bare `looseObject({})`. Measured on
 * `MergeQueueEntrySchema`: 0 properties before, 11 after. `gen-uml-overview`
 * throws on that rather than drawing an empty class, which is the only reason
 * it was found — mapping the merge-queue `$schema` family made the first node
 * of that kind convertible and `uml:overview:check` went red.
 */
import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { toJsonSchema } from "./to-json-schema.ts";
import { MergeQueueEntrySchema } from "./merge-queue.ts";
import { RefWindowSchema } from "./ref-window.ts";

type Json = { type?: string; properties?: Record<string, unknown>; required?: string[] };

describe("a piped schema converts to the stage that describes the node", () => {
  test("MergeQueueEntrySchema yields its fields, not the guard's empty input", () => {
    const j = toJsonSchema(MergeQueueEntrySchema) as Json;
    const keys = Object.keys(j.properties ?? {});
    expect(keys.length).toBeGreaterThan(5);
    // Named rather than counted: a count passes if the converter returns some
    // OTHER object, which is the failure mode being guarded.
    for (const f of ["$schema", "repository", "pr", "placement", "reason", "decidedBy"]) {
      expect(keys).toContain(f);
    }
  });

  test("RefWindowSchema too — the CLASS, not the one instance", () => {
    // Built the same way, and would have failed the moment its family was
    // mapped. Asserting it here is what makes this a fix rather than a patch.
    const keys = Object.keys((toJsonSchema(RefWindowSchema) as Json).properties ?? {});
    for (const f of ["ref", "since", "expires", "handoff"]) expect(keys).toContain(f);
  });

  test("a nested pipe is followed all the way", () => {
    // A type-correct chain: each stage's output is the next stage's input, so
    // the transform is what makes `A.pipe(B).pipe(C)` legal rather than a cast.
    // TypeScript caught the first attempt here, which piped `{a: string}`
    // straight into a schema requiring `{b: number}`.
    const s = z
      .object({ a: z.string() })
      .pipe(z.object({ a: z.string() }).transform((v) => ({ b: v.a.length })))
      .pipe(z.object({ b: z.number() }));
    expect(Object.keys((toJsonSchema(s) as Json).properties ?? {})).toEqual(["b"]);
  });

  test("the empty-properties case the uml generator throws on no longer arises", () => {
    // The generator's own condition: depth 0, type object, no properties.
    const j = toJsonSchema(MergeQueueEntrySchema) as Json;
    expect(j.type === "object" && Object.keys(j.properties ?? {}).length === 0).toBe(false);
  });
});

describe("and the input side is still read for everything else", () => {
  test("`io: \"input\"` is preserved: a .default() field stays OPTIONAL", () => {
    // The regression this fix could have caused. On the output side `b` would
    // be required, and every published schema carrying a default would change.
    const j = toJsonSchema(z.object({ a: z.string(), b: z.number().default(1) })) as Json;
    expect(Object.keys(j.properties ?? {}).sort()).toEqual(["a", "b"]);
    expect(j.required).toEqual(["a"]);
  });

  test("a plain object is untouched", () => {
    const j = toJsonSchema(z.object({ x: z.string() })) as Json;
    expect(j.type).toBe("object");
    expect(Object.keys(j.properties ?? {})).toEqual(["x"]);
  });

  test("a strict object still forbids extra keys", () => {
    const j = toJsonSchema(z.object({ x: z.string() }).strict()) as unknown as { additionalProperties?: unknown };
    expect(j.additionalProperties).toBe(false);
  });
});
