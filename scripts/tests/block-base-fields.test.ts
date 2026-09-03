/**
 * Every block schema must carry every field of `BlockBaseSchema`.
 *
 * Four kinds — `prose`, `equation`, `diagram`, `table` — used to RESTATE the
 * base fields instead of extending the base, and restating is how they kept
 * losing fields. A Zod object is non-strict, so a block declaring a field its
 * schema had forgotten was accepted at authoring time and the key was
 * SILENTLY STRIPPED: no error, no warning, nothing downstream ever saw it.
 *
 * The history is a sequence of one-field repairs, each of which fixed its
 * field and left the mechanism:
 *
 *   - `EquationBlock` was the only member of the union with neither `uses`
 *     nor a base supplying it; `tags` was in the Zod schema and not the type.
 *   - 2026-08-24 (bean `folio-assistant-5nle`): `authorNotes` granted to all
 *     four by hand, after qou #5115 found five real author notes discarded.
 *   - Measured after that grant: `defines` was still absent from all four,
 *     and `cites`, `simulator` and `computation` from three. One live qou
 *     block was affected — `prose:knot-periodic-table` declared a
 *     `computation` and had it dropped.
 *
 * `defines` was the sharp one: qou's AGENTS.md §4c REQUIRES every glossary
 * term to be declared in `defines[]`, and the `defterm-declared` rule reads
 * that array — so on those four kinds a term could not be declared at all,
 * and the omission was indistinguishable from an authoring choice.
 *
 * This is the same defect `block-kinds.test.ts` exists for, one level down:
 * there, five hand-maintained copies of the kind list each missed the same
 * two kinds and 461 qou blocks went unswept. Restating a set that already
 * exists is the shared cause. That one is guarded by `BLOCK_KINDS` plus a
 * compile-time exhaustiveness assertion; this is the runtime guard for the
 * field set, and it is a runtime one because Zod shapes are values.
 */
import { describe, test, expect } from "bun:test";
import { z } from "zod";
import { BlockBaseSchema, BlockSchema } from "../../schemas/constraints";
import { BLOCK_KINDS } from "../../schemas/types";

/**
 * `BlockSchema` is `z.discriminatedUnion(...).superRefine(...)`, i.e. a
 * `ZodEffects` wrapping the union. Unwrap rather than importing the fifteen
 * schemas by name, so a kind added later is covered without editing this file.
 */
const union = (BlockSchema as unknown as z.ZodEffects<z.ZodDiscriminatedUnion<"kind", z.ZodObject<z.ZodRawShape>[]>>)
  .innerType();
const options = union.options as z.ZodObject<z.ZodRawShape>[];

const shapeOf = (schema: z.ZodObject<z.ZodRawShape>) => Object.keys(schema.shape);

const kindOf = (schema: z.ZodObject<z.ZodRawShape>): string => {
  const lit = schema.shape.kind as z.ZodLiteral<string>;
  return lit.value;
};

describe("block schemas vs BlockBaseSchema", () => {
  test("the union reaches every kind, so nothing escapes the check below", () => {
    // Without this, a kind added to BLOCK_KINDS but not to the union would
    // simply not be tested — the exact way the previous defects survived.
    expect(options.map(kindOf).sort()).toEqual([...BLOCK_KINDS].sort());
  });

  const baseKeys = shapeOf(BlockBaseSchema);

  test("BlockBaseSchema still carries the fields this guard is about", () => {
    // Pins the guard to something falsifiable: if `defines` or `authorNotes`
    // is ever renamed, this fails here rather than passing vacuously.
    for (const key of ["authorNotes", "defines", "cites", "simulator", "computation", "uses"]) {
      expect(baseKeys).toContain(key);
    }
  });

  for (const schema of options) {
    const kind = kindOf(schema);
    test(`${kind} declares every base field`, () => {
      const keys = new Set(shapeOf(schema));
      const missing = baseKeys.filter((k) => !keys.has(k));
      expect(missing).toEqual([]);
    });
  }
});

describe("the four optional-label kinds accept what they used to drop", () => {
  // Parses rather than inspecting shapes: a field present in the shape but
  // typed wrongly would still drop the value, and the shape check above
  // cannot see that.
  const cases: Array<[string, Record<string, unknown>]> = [
    ["prose", { kind: "prose", label: "prose:x" }],
    ["equation", { kind: "equation", label: "eq:x" }],
    ["diagram", { kind: "diagram", label: "fig:x" }],
    ["table", { kind: "table", label: "tbl:x" }],
  ];

  for (const [kind, stub] of cases) {
    test(kind, () => {
      const authored = {
        ...stub,
        cites: ["someref2020"],
        defines: ["some-term"],
        authorNotes: [{ kind: "note" as const, body: "kept" }],
        computation: {
          engine: "python" as const,
          script: "computations/x.py",
          status: "not_run" as const,
        },
      };
      const parsed = BlockSchema.parse(authored) as Record<string, unknown>;
      for (const key of ["cites", "defines", "authorNotes", "computation"]) {
        expect(parsed[key]).toBeDefined();
      }
    });
  }
});
