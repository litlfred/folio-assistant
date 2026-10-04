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

/** Convert, inlining every shared definition. */
export function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return z.toJSONSchema(schema, { io: "input", reused: "inline" }) as Record<string, unknown>;
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
