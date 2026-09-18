/**
 * The shared I/O type vocabulary Tool ports reference.
 *
 * `ToolDefinition.io.*.schema` is an **absolute IRI**, which means the types it
 * names have to exist somewhere fetchable. This is that somewhere: one
 * published document of `$defs`, generated from Zod like every other schema
 * here, so a Tool's contract resolves rather than merely looking like it does.
 *
 * ## Why a shared document rather than a schema per tool
 *
 * Because the point of `io` is that a Task's inputs can be checked against the
 * Tool that will execute it. Two tools satisfying one skill — `beans-cli` and
 * `beans-manual` — must declare the *same* input type, or "these are
 * interchangeable" is an assertion nothing can verify. Per-tool schemas make
 * that a string comparison between two structurally-identical definitions;
 * a shared `$defs` makes it identity.
 *
 * It is also what `mcp-contract` checks against: a served MCP tool's
 * `inputSchema` must agree with the Tool node's `io`, and agreement is only
 * decidable if both sides name the same type.
 *
 * @module schemas/tool-types
 */
import { z } from "zod";

/** A bean's identifier, e.g. `folio-assistant-1dfh`. */
export const BeanIdSchema = z.string().regex(/^[a-z0-9-]+$/).describe("A bean identifier, e.g. folio-assistant-1dfh");

/** Exactly the statuses the beans CLI can produce. */
export const BeanStatusSchema = z
  .enum(["draft", "todo", "in-progress", "completed", "scrapped"])
  .describe("A bean status. Exactly what `beans update --status` accepts.");

/** A repository-relative path. */
export const RepoPathSchema = z.string().min(1).describe("A path relative to the repository root");

/** An absolute http(s) URL. */
export const UrlSchema = z.string().url().describe("An absolute http(s) URL");

/** A git branch name. */
export const BranchSchema = z.string().min(1).describe("A git branch name");

/** A pull/merge request number. */
export const ChangeProposalNumberSchema = z
  .number()
  .int()
  .positive()
  .describe("A change-proposal number — a pull request on GitHub, a merge request on GitLab");

/** Free markdown, e.g. a bean body or a comment. */
export const MarkdownSchema = z.string().describe("Markdown text");

/** Everything published in the shared types document, keyed by `$defs` name. */
export const TOOL_TYPES = {
  BeanId: BeanIdSchema,
  BeanStatus: BeanStatusSchema,
  RepoPath: RepoPathSchema,
  Url: UrlSchema,
  Branch: BranchSchema,
  ChangeProposalNumber: ChangeProposalNumberSchema,
  Markdown: MarkdownSchema,
} as const;

export type ToolTypeName = keyof typeof TOOL_TYPES;

/**
 * The IRI of one shared type, against a publication base.
 *
 * One function, so a Tool node never hand-writes an IRI. A hand-written one is
 * a string that looks like a reference and is checked by nothing — and the
 * owner's standing rule is that a consumer must never have to assume a rule to
 * follow a link, which applies to the author of the link first.
 */
export function toolTypeIri(base: string, name: ToolTypeName): string {
  return `${base.replace(/\/+$/, "")}/kg/tool-types.schema.json#/$defs/${name}`;
}
