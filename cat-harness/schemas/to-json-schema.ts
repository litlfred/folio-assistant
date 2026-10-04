/**
 * JSON Schema conversion — one wrapper, because the converter changed under us.
 *
 * `zod-to-json-schema` reads zod 3's internal `_def` shape. Under zod 4 it
 * does not throw: it returns `{ "$schema": … }` and **nothing else** — no
 * `properties`, no `required`, no `description`. Measured 2026-09-22 on the
 * real `DiscussionInputSchema`, where the regenerated document lost 202 lines
 * and gained 1. A converter that empties a published contract while reporting
 * success is the failure this repository works hardest against, and the
 * staleness gate would have presented the emptying as the FIX.
 *
 * zod 4 ships `z.toJSONSchema` natively and it is a real replacement: on the
 * same schemas it emits full `properties`, `required`, `additionalProperties:
 * false` for strict objects, and inlines shared definitions under
 * `reused: "inline"`. The one difference measured against the published
 * documents is a STRENGTHENING — `z.string().datetime()` gains a `pattern`
 * beside its `format`, so the schema now enforces what it previously only
 * annotated. `format` is advisory in JSON Schema; `pattern` is not.
 *
 * ## `named` exists because the old option did something native does not
 *
 * `zodToJsonSchema(S, { name })` wrapped its output as
 * `{ $ref: "#/definitions/<name>", definitions: { <name>: … } }`. Native has
 * no `name`, so the wrapper is reproduced here rather than at each call site —
 * four call sites reproducing it independently is four chances to differ, and
 * the shape is part of a published document.
 *
 * @graphNode none — a function library. It defines no schema of its own; it
 * CONVERTS schemas defined elsewhere, so it has nothing to contribute to the
 * published graph and a node for it would describe a verb rather than a type.
 */
import { z } from "zod";

/**
 * A `.pipe()` chain's LAST stage, which is the one that describes the node.
 *
 * `io: "input"` is right for everything else and must not change — it is what
 * makes a `.default()` field render as optional, as every published schema
 * here already does. But for `A.pipe(B)` the input side is `A`, and the
 * guard-then-parse idiom this repository uses makes `A` a bare
 * `z.looseObject({})`:
 *
 *     z.looseObject({})
 *       .superRefine(refuseForbiddenKeys)   // names the key in the message
 *       .pipe(EntryObjectSchema)            // the actual shape
 *
 * So converting the input yields `{ type: "object" }` with NO properties,
 * while the eleven real fields sit on the output. Measured on
 * `MergeQueueEntrySchema`: input side 0 properties, pipe output 11.
 *
 * `gen-uml-overview` catches that as a converter failure rather than an empty
 * shape — correctly, and the throw is why this was found at all. The schema is
 * not wrong: a reader of the published contract wants the fields, and the
 * guard is a refusal rather than a shape. So the converter follows the pipe.
 *
 * Loops rather than unwrapping once, because `A.pipe(B).pipe(C)` nests.
 *
 * Bean `xp5j`: mapping the merge-queue `$schema` family made the first node of
 * that kind convertible, and `uml:overview:check` went red. `RefWindowSchema`
 * is built the same way and would have hit this the moment ITS family was
 * mapped, so this is the class rather than the instance.
 */
function lastPipeStage(schema: z.ZodType): z.ZodType {
  let s = schema as unknown as { _zod?: { def?: { type?: string; out?: unknown } } };
  // Bounded: a hand-written chain is a handful deep, and a bound beats
  // trusting that no schema is ever cyclic.
  for (let i = 0; i < 16 && s?._zod?.def?.type === "pipe" && s._zod.def.out; i++) {
    s = s._zod.def.out as typeof s;
  }
  return s as unknown as z.ZodType;
}

/** Convert, inlining every shared definition. */
export function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return z.toJSONSchema(lastPipeStage(schema), { io: "input", reused: "inline" }) as Record<string, unknown>;
}

/**
 * Convert and wrap under `definitions`, as `zodToJsonSchema`'s `name` option
 * did. The `$ref` is what a consumer dereferences, so the two keys travel
 * together or the document is unresolvable.
 */
export function namedJsonSchema(schema: z.ZodType, name: string): Record<string, unknown> {
  const body = toJsonSchema(schema);
  delete body.$schema;
  return { $ref: `#/definitions/${name}`, definitions: { [name]: body } };
}
