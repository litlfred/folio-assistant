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

/**
 * A repository-relative path.
 *
 * Constrained rather than a bare string, for two reasons that both matter.
 * Shell metacharacters are excluded, so the value cannot be a payload even if a
 * careless caller ever built a command string. And **`..` segments are
 * excluded**, so a path argument cannot escape the repository — traversal is
 * the injection-shaped bug that path types actually get hit with, and it is
 * invisible to any amount of argv-array discipline.
 */
export const RepoPathSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9._][A-Za-z0-9._/-]*$/, "a repo path is alphanumerics, dot, underscore, slash and hyphen")
  .refine((p) => !p.split("/").includes(".."), "a repo path may not contain a `..` segment")
  .describe("A path relative to the repository root. No `..` segments.");

/** An absolute http(s) URL. */
export const UrlSchema = z.string().url().describe("An absolute http(s) URL");

/**
 * A git branch name.
 *
 * Narrower than git's own rules on purpose: git permits characters this
 * excludes, and a Tool argument is not the place to find out which. The set
 * here covers every branch this project has ever used (`claude/…`, `main`,
 * `release-…`) and contains no shell metacharacter.
 */
export const BranchSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, "a branch name is alphanumerics, dot, underscore, slash and hyphen")
  .refine((b) => !b.includes(".."), "a branch name may not contain `..`")
  .describe("A git branch name");

/** A pull/merge request number. */
export const ChangeProposalNumberSchema = z
  .number()
  .int()
  .positive()
  .describe("A change-proposal number — a pull request on GitHub, a merge request on GitLab");

/** Free markdown, e.g. a bean body or a comment. */
export const MarkdownSchema = z.string().describe("Markdown text");

/**
 * Free prose — a bean body, a comment. **Deliberately unconstrained, and
 * therefore not admissible as a command-line argument.**
 *
 * See `INJECTION_SAFE` below. Markdown is the honest exception: prose can
 * legitimately contain a semicolon, a backtick and a `$(`. There is no regex
 * that admits real prose and excludes a payload, and pretending otherwise is
 * worse than saying so — a type that claims to be safe and is not is how an
 * escape gets skipped downstream.
 *
 * Everything published in the shared types document, keyed by `$defs` name.
 */
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


/**
 * Types whose *values cannot be a shell payload*, because the type refuses to
 * construct one.
 *
 * ## Why this is the defence, and argv arrays are only the second line
 *
 * The usual answer to command injection is "pass an argv array, never build a
 * shell string". That is necessary and this repo does it — but it is a property
 * of the *caller*, and a caller is one refactor away from a template literal.
 *
 * The property that survives a careless caller is the **value never being
 * dangerous in the first place**. `BeanStatus` is an enum: `"; rm -rf /"` is not
 * a member and `parse` rejects it. `BeanId` is `^[a-z0-9-]+$`: no space, no
 * semicolon, no `$(`, no backtick. A constrained type makes the payload
 * unrepresentable rather than merely unexecuted.
 *
 * So a Tool input **may not reference an unconstrained type**. That is checked,
 * not documented — see `scripts/check-tools.ts`.
 *
 * ## Markdown is excluded, on purpose
 *
 * Prose genuinely can contain any character, so no pattern admits real markdown
 * and excludes a payload. Rather than pretend, `Markdown` is simply not
 * admissible as an *argument*. A Tool that needs free text takes it on **stdin**
 * or from a file, where it is data rather than part of a command line. That is a
 * real constraint on Tool design and it is the right one: a tool whose prose
 * argument is a command-line word was always going to need quoting nobody
 * checks.
 */
export const INJECTION_SAFE: ReadonlySet<ToolTypeName> = new Set<ToolTypeName>([
  "BeanId",
  "BeanStatus",
  "RepoPath",
  "Url",
  "Branch",
  "ChangeProposalNumber",
]);

/** Is this type admissible as a command-line argument? */
export function isInjectionSafe(name: string): boolean {
  return INJECTION_SAFE.has(name as ToolTypeName);
}
