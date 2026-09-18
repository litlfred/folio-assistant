/**
 * What a Tool is.
 *
 * A **skill** states a capability generically; a **Tool** is one concrete way
 * to exercise it, and names the skills it satisfies. That separation is the
 * SOP in `skills/folio-core/skills-and-tools.md`; this is the schema that makes
 * it something a machine can check rather than a convention prose asserts.
 *
 * ## Authoritative, and the only authority
 *
 * Zod here, JSON Schema and JSON-LD generated from it — the carrier decision in
 * `skills/folio-core/directory-conventions.md` §"What lives in the `schemas`
 * graph". The TypeScript type is `z.infer`, never declared alongside, because
 * two declarations of one shape drift and the drift is invisible until
 * something reads the stale one.
 *
 * ## Three constraints the strawperson did not have
 *
 * The version in `docs/architecture/cat-harness-minimum.md` flagged two
 * fields as too loose to build on. Both are tightened here, and a third
 * constraint fell out of writing the first real Tools.
 *
 * **1. `invoke` must offer an arm the harness can run.** `agentic-harness`
 * assumes no MCP server, so a Tool whose only invocation is `invoke.mcp` is not
 * usable by the layer that defines it — and would also make the MCP projector
 * emit a server that proxies itself. The refinement below rejects it at parse
 * time rather than leaving it to a reviewer.
 *
 * **2. `io.*.schema` is an absolute IRI**, not a bare string. A relative
 * reference resolves differently depending on where a consumer fetched the
 * Tool, so two consumers can disagree about what a tool accepts. Absolute or
 * nothing — the same rule `kg-export` follows for `@id` and
 * `harness-schema-export` for `$id`.
 *
 * **3. `satisfies` must be non-empty.** A Tool that satisfies no skill is a
 * mechanism nothing asks for. Whether the named skills *exist* is not something
 * a schema can know — that is `scripts/check-tools.ts`, which resolves them
 * against the real skill locations.
 *
 * @module schemas/tool
 */
import { z } from "zod";

/** A lowercase, hyphenated id. It is also the MCP tool name stem. */
const ToolId = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9-]*$/, "a tool id is lowercase letters, digits and hyphens");

/**
 * An absolute IRI naming the schema of one input or output.
 *
 * Absolute is the point — see the module note. `zod-to-json-schema` renders
 * `.url()` as `"format": "uri"`, so the constraint survives into the JSON
 * Schema rendering rather than living only in the Zod.
 */
const SchemaRef = z.string().url("io schema references must be absolute IRIs");

export const ToolPortSchema = z.object({
  name: z.string().min(1),
  schema: SchemaRef,
  description: z.string().optional(),
});

/**
 * How one input appears on the command line.
 *
 * **Explicit, per input — never a template and never a convention.** The
 * alternatives were an argv template with `{name}` placeholders, and a rule that
 * every input becomes `--name value`. The template needs substitution, which is
 * the string manipulation this project keeps removing and which fails silently
 * when an optional input is absent (a literal brace in argv). The convention
 * needs a rule every author and reader must know, cannot express a positional,
 * and breaks the moment a flag differs from its input name.
 *
 * This way a reader of the Tool node can see the invocation without running it.
 */
export const ToolArgSchema = z.union([
  z.object({ flag: z.string().regex(/^--?[A-Za-z0-9][A-Za-z0-9-]*$/, "a flag looks like --name or -n") }),
  z.object({ positional: z.number().int().nonnegative() }),
  /** Passed on stdin rather than as a word. The only home for free prose. */
  z.object({ stdin: z.literal(true) }),
]);

export const ToolInputSchema = ToolPortSchema.extend({
  /** Whether a caller must supply it. Explicit, never inferred from a default. */
  required: z.boolean(),
  /**
   * Where this input goes when the tool is invoked. Absent means the input is
   * part of the contract but not passed on the command line — a Tool invoked
   * `manual`ly has no command line at all.
   */
  arg: ToolArgSchema.optional(),
});

/**
 * How to obtain the tool. Every arm optional, because a tool may be present
 * already — `beans-manual` needs no install at all, which is a fact about it
 * rather than a gap in its record.
 */
export const ToolInstallSchema = z.object({
  cli: z.string().optional(),
  container: z.string().optional(),
  service: z.string().optional(),
  /** Nothing to install. Stated, so "absent" and "not needed" are distinct. */
  none: z.literal(true).optional(),
});

/**
 * How to run it.
 *
 * `mcp` is one arm among three and never the only one — see the module note
 * and the refinement on the schema below.
 */
export const ToolInvokeSchema = z.object({
  shell: z.string().optional(),
  container: z.string().optional(),
  mcp: z.object({ tool: z.string().min(1) }).optional(),
  /**
   * The tool is performed by a person following the skill, with no command.
   * `beans-manual` is the case: editing a bean's front matter by hand is a real
   * mechanism with equal standing to the CLI, and modelling it as an absent
   * `shell` would have made it indistinguishable from an unfinished record.
   */
  manual: z.literal(true).optional(),
});

export const ToolRequiresSchema = z.object({
  os: z.array(z.string()).optional(),
  runtime: z.array(z.string()).optional(),
  network: z.boolean().optional(),
});

export const ToolDefinitionSchema = z
  .object({
    id: ToolId,
    title: z.string().min(1),
    description: z.string().min(1),
    install: ToolInstallSchema,
    invoke: ToolInvokeSchema,
    io: z.object({
      inputs: z.array(ToolInputSchema),
      outputs: z.array(ToolPortSchema),
    }),
    /** Skills this Tool can satisfy. One skill may have several Tools. */
    satisfies: z.array(z.string().min(1)).min(1, "a Tool must satisfy at least one skill"),
    requires: ToolRequiresSchema.optional(),
  })
  .refine((t) => t.invoke.shell !== undefined || t.invoke.container !== undefined || t.invoke.manual === true, {
    message:
      "invoke needs an arm the harness can run (shell, container or manual). " +
      "A Tool reachable only over MCP is not usable by the harness that defines it, " +
      "and projecting it would emit a server that proxies itself.",
    path: ["invoke"],
  });

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;
export type ToolInput = z.infer<typeof ToolInputSchema>;
export type ToolPort = z.infer<typeof ToolPortSchema>;

/**
 * Build and validate a Tool node.
 *
 * Tool nodes are authored as `.ts` calling this, so a malformed one fails at
 * `tsc` and in the editor rather than at CI. That is the whole argument for the
 * carrier decision, applied to instances as well as to the schema.
 */
export function defineTool(t: ToolDefinition): ToolDefinition {
  return ToolDefinitionSchema.parse(t);
}
