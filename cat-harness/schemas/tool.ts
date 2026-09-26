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
 * @graphNode schema
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
   * The input is a **list** of the named type rather than one value.
   *
   * ## Why cardinality is a flag and not a type
   *
   * Three of the tools this instance serves take lists — `folio_init.authors`,
   * `stakeholder_map.paths`, `readme_sync.only` — so without this the migration
   * could not describe the surface it was migrating. The alternative was an
   * `ArrayOfRepoPath` beside `RepoPath` in the shared vocabulary, which
   * multiplies the `$defs` by the number of types and, worse, breaks the
   * identity property `tool-types` exists for: two tools taking "a list of repo
   * paths" would have to agree on a *second* name as well as the element one.
   *
   * ## What it means for injection safety
   *
   * Nothing changes, and that is the point. Each element is parsed by the
   * element schema, so a list of an injection-safe type cannot contain an
   * element that is a payload — the element type already made that
   * unrepresentable. `scripts/check-tools.ts` therefore asks the same question
   * of a repeated input as of a scalar one, and needs no new case.
   *
   * ## How it projects
   *
   * A repeated `flag` emits the flag once per element (`--author A --author B`),
   * never one comma-joined word: joining would invent a separator the tool never
   * agreed to and would make a value containing that separator ambiguous. A
   * repeated `positional` emits the elements as trailing words, so at most one
   * repeated positional can appear and it must be last.
   */
  repeated: z.boolean().optional(),
  /**
   * Where this input goes when the tool is invoked. Absent means the input is
   * part of the contract but not passed on the command line — a Tool invoked
   * `manual`ly or `inProcess` has no command line at all.
   */
  arg: ToolArgSchema.optional(),
}).refine((i) => !(i.repeated === true && i.arg !== undefined && "stdin" in i.arg), {
  message: "a repeated input cannot be passed on stdin — stdin is one stream, not a list",
  path: ["repeated"],
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
   * A function in **this instance's own code**.
   *
   * Added because 17 of the 20 tools this repository already serves have no
   * shell equivalent — they are TypeScript registered on the MCP server, and
   * without this arm they cannot be expressed as Tool nodes at all.
   *
   * ## Why the mcp-only refusal does not apply
   *
   * That refinement exists because a Tool reachable only over MCP is not
   * runnable by the harness and projecting it would emit a server that proxies
   * itself. An in-process function is the opposite case on both counts: the
   * harness can call it directly with no server at all, and it is the
   * projection **source** rather than something to proxy. `src/server.ts`
   * already does exactly this projection by hand.
   *
   * `module` locates the code; it is NOT a unique key, because one module
   * registers several tools (`workflow.ts` registers five). The Tool's `id` is
   * the key, and it is the MCP name the module registers.
   */
  inProcess: z
    .object({
      /**
       * INSTANCE-relative path to the module, e.g. `src/tools/workflow.ts`.
       *
       * The instance, not the repository — this said "repo-relative" while giving
       * an example that is instance-relative, and after the move under
       * `cat-harness/` the two stopped being the same thing. The values were
       * right and the word was stale; `check:tools` now resolves this field
       * against the instance root and `invoke.shell` against the repository,
       * because a shell command is typed from the repo root while a module is
       * loaded by the instance's own server. Same convention as
       * `maintains.source`.
       */
      module: z.string().min(1),
      /** The registrar export, when the module has more than one. */
      register: z.string().min(1).optional(),
    })
    .optional(),
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

/**
 * A published artefact this Tool is AUTHORITATIVE for, and the source it is
 * generated from.
 *
 * ## The relation this exists to declare
 *
 * The owner's requirement, 2026-09-18: *"the zod(.ts) should be tool KG nodes
 * that implement maintaining a json-ld/json schema for public authoritative …
 * it is the CODING convention of cat-harness that the zod/.ts toolchain is
 * used to maintain INTERNAL the json schema"* — with the split *"external =
 * the JSON-LD is definitional. internal = zod/typescript is definitional and
 * json-ld is downstream."*
 *
 * That relation was real and written down nowhere a consumer could read it.
 * `scripts/harness-schema-export.ts` knew that `schemas/cat-harness.ts`
 * produces `<stub>.schema.json`, `schemas/tool.ts` produces
 * `tool.schema.json` and `schemas/tool-types.ts` produces
 * `tool-types.schema.json` — three facts living in one script's local array.
 * A reader of the published graph could not get from a schema module to the
 * artefact it defines, or back.
 *
 * ## Why `source` is a path and `artefact` is not
 *
 * `source` is repo-relative and stable: it names a file in the tree the graph
 * describes. `artefact` is the PUBLISHED path relative to the instance's base,
 * because the base differs per deployment — main, a STAGING preview, a local
 * checkout — and baking one in would make the node wrong everywhere else.
 * `renderingPath()` in `schemas/cat-harness.ts` is what joins the two, and is
 * the single place that knows the layout.
 *
 * ## Declared, then checked both ways
 *
 * `harness-schema-export --check` verifies every declared artefact is actually
 * produced AND every produced artefact is declared. One direction alone is
 * half a guarantee: the first catches a declaration that rotted, the second
 * catches a new artefact nobody declared — which is how the relation drifts
 * back into the script.
 */
export const ToolMaintainsSchema = z.object({
  /** Repo-relative module that defines it, e.g. `schemas/tool.ts`. */
  source: z.string().min(1),
  /**
   * Published path relative to the instance's base, e.g. `tool.schema.json`.
   * No leading slash: it is joined by `renderingPath`, which owns the layout.
   */
  artefact: z.string().min(1).refine((a) => !a.startsWith("/"), {
    message: "artefact is relative to the instance base — a leading slash names the domain root",
  }),
  /**
   * What the artefact IS, for a consumer deciding whether it can read it.
   * Open string: an instance may maintain kinds this vocabulary has not met.
   */
  format: z.string().min(1).optional(),
});

export type ToolMaintains = z.infer<typeof ToolMaintainsSchema>;

/**
 * Why an agent would reach for THIS Tool rather than a substitutable sibling.
 *
 * ## Why this is not `description`
 *
 * `description` is projected VERBATIM as the MCP tool description
 * (`src/mcp/project.ts`) and into the exported graph (`kg-export.ts`). It
 * answers "what does this do", which is what a caller needs at the moment of
 * calling. Comparative prose — what it costs to have installed, what it cannot
 * do, which sibling covers the rest — is noise there, and putting it there
 * would degrade the surface an LLM reads when choosing among tools.
 *
 * ## Why all three fields are required together
 *
 * A selection record with only `when` is half an answer: it tells an agent to
 * reach for this tool without telling it where the tool stops, so the agent
 * discovers the boundary by failing. `limits` is where a sibling gets named,
 * and it must be STATED even when it is "none" — the same reason
 * `install.none` exists, so "no limits" is distinguishable from an unfinished
 * record.
 *
 * `cost` is not `install`. `install` says how to obtain the tool; `cost` says
 * what having it costs — CI minutes, a wheel that needs a C toolchain, a
 * network round trip. Two tools can be equally easy to install and very
 * differently expensive to keep.
 */
export const ToolSelectionSchema = z.object({
  /** The case this Tool is the right answer to. */
  when: z.string().min(1),
  /** Where it stops, and which sibling picks up — "none" is a real value, stated. */
  limits: z.string().min(1),
  /** What having it available costs. Distinct from `install`; see above. */
  cost: z.string().min(1),
});

export type ToolSelection = z.infer<typeof ToolSelectionSchema>;

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
    /**
     * Other Tools that do the SAME job by a different mechanism.
     *
     * ## Why this is declared and not derived from `satisfies`
     *
     * Deriving it was the first design, and measurement refuted it. Sharing a
     * skill does NOT make two Tools substitutable: measured 2026-09-20, 12 of
     * this instance's 25 skills carry more than one Tool, and nearly all are
     * COMPLEMENTARY — `workflow-list`, `-start`, `-next`, `-gate` and
     * `-complete` are five steps of `process-state`, not five ways to perform
     * it, and the five translation tools are the same shape. Exactly one pair,
     * `beans-cli` / `beans-manual`, is genuinely substitutable.
     *
     * So a rule keyed on "shares a skill" would demand comparative prose on
     * twelve skills with nothing to compare, and an author obliged to write it
     * would write noise. Substitutability is a judgement about mechanism, and
     * judgements get declared.
     *
     * ## Symmetric, and checked
     *
     * If A names B and B does not name A, a reader arriving at B never learns
     * a choice exists — which is the whole failure this field prevents, half
     * the time. `scripts/check-tools.ts` verifies both that each id resolves
     * and that the relation is mutual.
     */
    alternativeTo: z.array(ToolId).optional(),
    /**
     * Why to reach for this one. REQUIRED once `alternativeTo` is non-empty —
     * see {@link ToolSelectionSchema}, and the refinement below.
     */
    selection: ToolSelectionSchema.optional(),
    requires: ToolRequiresSchema.optional(),
    /**
     * Published artefacts this Tool is authoritative for. See
     * {@link ToolMaintainsSchema}.
     *
     * Optional because most Tools maintain nothing — they DO something. A Tool
     * that maintains an artefact is the specific case the owner asked for: a
     * zod module whose job is to keep a public JSON Schema true.
     */
    maintains: z.array(ToolMaintainsSchema).optional(),
    /**
     * The graph KINDS this Tool draws a viewer for — one page per declared
     * directory of the kind, placed by the Tool itself.
     *
     * #1168 B7a, owner 2026-09-24 (*"viz scripts become Tools"*): until then
     * each directory named its viewer page (`coverage.visualiser`), which is
     * the directory pointing at what depends on it. The dependent holds the
     * pointer, so the renderer says what it renders. A kind, not a list of
     * pages, because which directories exist is the declarations' answer and
     * a Tool restating it would be a second list free to drift.
     */
    renders: z.array(z.string().min(1)).optional(),
  })
  .refine(
    (t) =>
      t.invoke.shell !== undefined ||
      t.invoke.container !== undefined ||
      t.invoke.inProcess !== undefined ||
      t.invoke.manual === true,
    {
      message:
        "invoke needs an arm the harness can run (shell, container, inProcess or manual). " +
        "A Tool reachable only over MCP is not usable by the harness that defines it, " +
        "and projecting it would emit a server that proxies itself. An inProcess function " +
        "is not that case: the harness calls it directly, and it is the projection source.",
      path: ["invoke"],
    },
  )
  // A declared alternative without a reason to choose between them is the
  // defect this pair of fields exists to remove, half-fixed: the reader now
  // knows a choice exists and still cannot make it. Enforced here rather than
  // in `check-tools` because it needs nothing outside the node.
  .refine((t) => (t.alternativeTo?.length ?? 0) === 0 || t.selection !== undefined, {
    message:
      "a Tool that names an alternative must carry `selection` — otherwise a reader " +
      "learns a choice exists without learning how to make it",
    path: ["selection"],
  })
  // Self-reference would satisfy the symmetry check trivially and tell a
  // reader nothing.
  .refine((t) => !(t.alternativeTo ?? []).includes(t.id), {
    message: "a Tool cannot be an alternative to itself",
    path: ["alternativeTo"],
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
