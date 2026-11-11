/**
 * `folio-editor-checker/v1`: one node per content profile, naming the code the
 * ✍ suggest editor loads for that profile's blocks (bean folio-assistant-4dx7).
 *
 * Modelled on cat-harness `schemas/contribution-nodes.ts` (`folio-qa-checker/v1`).
 * Every code ref is `path.ts#Export`, relative to the contributing instance's
 * root, so the runtime resolves it through the declaration, never through a
 * path written into the runtime.
 *
 * @module folio-assistant-sci/schemas/editor-checker
 * @graphNode schema
 */

import { z } from "zod";
import { nodeKind } from "@litlfred/cat-harness-tools/schemas/kg/node-kind.ts";

export const EDITOR_CHECKER_NODE_SCHEMA = "folio-editor-checker/v1" as const;

/** `path#Export`, instance-relative, no `..`, no `instance:` prefix. The same rule as cat-harness `OwnCodeRefSchema`. */
export const OwnCodeRefSchema = z
  .string()
  .regex(/^(?![a-z][a-z0-9-]*:)(?!\/)(?!\.\.)[^#\s]+\.ts#[A-Za-z_$][\w$]*$/, {
    message: "a code ref is `path.ts#Export`, relative to the contributing instance's own root",
  });

const Name = z.string().regex(/^[a-z][a-z0-9-]*$/);

export const EditorCheckerNodeSchema = z
  .object({
    $schema: z.literal(EDITOR_CHECKER_NODE_SCHEMA),
    id: Name,
    /** The content type whose blocks this profile serves (a declared `contentAdapters[].contentType`). */
    contentType: Name,
    /** Block kinds it is limited to. Absent means every Markdown block of the content type. */
    kinds: z.array(Name).nonempty().optional(),
    /** `checkSuggestion(before, after, ctx)` → findings. Errors are syntax errors; warnings never block. */
    check: OwnCodeRefSchema,
    /**
     * `(katexMacros) => macros`: the profile's macro table from the page's KaTeX
     * macros, passed to `check` (as `macros`) and to `crepe.remarkFirst`.
     * Absent: the checker's own defaults.
     */
    macros: OwnCodeRefSchema.optional(),
    /** Crepe settings for the profile. */
    crepe: z
      .object({
        /**
         * `(Crepe.Feature, katexMacros) => featureConfigs`: Crepe's feature
         * settings, keyed by the feature names the runtime hands in, so the
         * shared runtime names no content type's feature.
         */
        featureConfigs: OwnCodeRefSchema.optional(),
        /** ProseMirror node-view factories, by node name. */
        nodeViews: z.record(z.string(), OwnCodeRefSchema).optional(),
        /** A `remarkPluginsCtx` updater that puts a transformer first. */
        remarkFirst: OwnCodeRefSchema.optional(),
      })
      .strict()
      .optional(),
    /** Block kinds whose raw pane (for a paper, the raw-LaTeX pane) is offered up front (owner, 2026-10-14: "both"). */
    rawFirstFor: z.array(Name).optional(),
    /**
     * `() => TokenRule[]`: the profile's own syntax, for the runtime to keep
     * intact and check while the profile's module is not loaded
     * (`adapters/paper/suggest/latex-tokens.ts`). Called at build time by
     * cat-harness-tools' editor-profiles bundler, which serialises each pattern.
     */
    tokens: OwnCodeRefSchema.optional(),
    rationale: z.string().optional(),
  })
  .strict();

export type EditorCheckerNode = z.infer<typeof EditorCheckerNodeSchema>;

/**
 * `folio-editor-checker/v1` as a node kind (issue #2195), so `validators/editor-checker.json`
 * names a kind and `node-kinds:check` files the family under it. Unversioned: the family's tag is not SemVer, so the `$schema` literal stays a
 * field of the shape rather than one `nodeKind()` generates.
 * Strict, as {@link EditorCheckerNodeSchema} is.
 */
export const EditorCheckerKind = nodeKind("folio-editor-checker", [], EditorCheckerNodeSchema.shape, { strict: true });

/** Every code ref a node names. */
export function codeRefs(node: EditorCheckerNode): string[] {
  return [node.check, node.macros, node.tokens, node.crepe?.featureConfigs, ...Object.values(node.crepe?.nodeViews ?? {}), node.crepe?.remarkFirst]
    .filter((r): r is string => typeof r === "string");
}
