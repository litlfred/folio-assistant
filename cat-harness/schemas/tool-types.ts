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
 * @graphNode schema
 */
import { z } from "zod";

import { renderingPath } from "./cat-harness.js";

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

/**
 * Free prose — a bean body, a comment, a note. **Deliberately unconstrained, and
 * therefore not admissible as a command-line argument.**
 *
 * See `INJECTION_SAFE` below. Markdown is the honest exception: prose can
 * legitimately contain a semicolon, a backtick and a `$(`. There is no regex
 * that admits real prose and excludes a payload, and pretending otherwise is
 * worse than saying so — a type that claims to be safe and is not is how an
 * escape gets skipped downstream.
 */
export const MarkdownSchema = z.string().describe("Markdown text. Not admissible as a command-line argument — see INJECTION_SAFE.");

/**
 * The name of a skill, as an activity's `<folio:skill ref>` writes it.
 *
 * Same shape as a file stem under `skills/<package>/`, because that is what it
 * resolves to — `knownSkills()` in `scripts/known-skills.ts` builds its set by
 * stripping `.md`, so a name that cannot be a stem cannot be a skill.
 */
export const SkillNameSchema = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9-]*$/, "a skill name is lowercase alphanumerics and hyphens, starting with a letter")
  .describe("A skill name, e.g. todo-manager");

/** A skill package — the directory under `skills/`, e.g. `folio-core`. */
export const PackageNameSchema = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9-]*$/, "a package name is lowercase alphanumerics and hyphens, starting with a letter")
  .describe("A skill package, e.g. folio-core");

/**
 * A BPMN process id — the stem of a `.bpmn` under a declared workflow
 * directory, e.g. `crdm-requirements`.
 */
export const ProcessIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9-]*$/, "a process id is lowercase alphanumerics and hyphens, starting with a letter")
  .describe("A BPMN process id, e.g. crdm-requirements");

/**
 * A node id **inside** a BPMN document — `A_Implement`, `Gateway_EditorDecision`.
 *
 * Broader than the ids above because BPMN ids are authored by whoever drew the
 * diagram: mixed case and underscores are the house style here and excluding
 * them would make every real diagram unaddressable. It is still a single word
 * with no shell metacharacter in it.
 */
export const NodeIdSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z_][A-Za-z0-9_-]*$/, "a BPMN node id is alphanumerics, underscore and hyphen, starting with a letter or underscore")
  .describe("A node id within a BPMN process, e.g. A_Implement");

/**
 * A running process instance — the stem of a file in the `workflow-state` node
 * of the bean graph.
 *
 * **Named by its graph kind rather than by a path, deliberately.** An earlier
 * draft of this comment named a directory that had already been relocated, and
 * a path written into a doc comment is checked by nothing. The instance
 * declares where that node lives (`beans/beans.json`), so a reader who needs
 * the directory resolves it there and a relocation costs one edit rather than a
 * corpus sweep.
 *
 * Constrained to the same word shape as a filename stem on purpose: the id is
 * used to *build a path* into that store, so a value containing a slash or a
 * `..` would be a traversal rather than a lookup.
 */
export const InstanceIdSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "an instance id is alphanumerics, dot, underscore and hyphen")
  .refine((i) => !i.includes(".."), "an instance id may not contain `..`")
  .describe("A workflow instance id — the stem of a file in the bean graph's workflow-state node");

/** A BCP-47 language tag, e.g. `en`, `fr-CA`. */
export const LocaleSchema = z
  .string()
  .min(2)
  .regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, "a locale is a BCP-47 language tag")
  .describe("A BCP-47 language tag, e.g. en or fr-CA");

/**
 * A boolean switch.
 *
 * Injection-safe for a reason no regex gives: it is **not a string**, so there
 * is no value of it that could be a payload. A `Flag` port projects to a bare
 * `--name` with no value word at all.
 */
export const FlagSchema = z.boolean().describe("A boolean switch — projects to a bare flag, with no value word");

/**
 * A short, single-line human string — a title, a person's name, a subject line.
 *
 * **Not injection-safe**, and separate from `Markdown` for a reason that is
 * about Tool *design* rather than about safety: `Markdown` is a body and its
 * home is stdin or a file, while a `Text` is a field. Both are refused as
 * command-line words, so nothing rests on telling them apart at the boundary;
 * the distinction is there so a Tool node says which shape it wants.
 */
export const TextSchema = z
  .string()
  .min(1)
  .max(400)
  .refine((t) => !t.includes("\n") && !t.includes("\r"), "a Text is a single line")
  .describe("A short single-line human string. Not admissible as a command-line argument.");

/**
 * A filesystem path that may point **outside** the repository.
 *
 * Deliberately distinct from `RepoPath` and deliberately **not**
 * injection-safe. `folio_init --assistant-path ../folio-assistant` is a real,
 * correct invocation, and `..` is exactly what `RepoPath` exists to forbid.
 * Rather than weaken `RepoPath` — which would silently remove traversal
 * protection from every port that uses it — the escaping case gets its own type
 * and is refused as a command-line word.
 */
export const FilesystemPathSchema = z
  .string()
  .min(1)
  .describe("A filesystem path, possibly outside the repository. Not admissible as a command-line argument.");

/** A folio's short name — the directory stem and the URL segment. */
export const SlugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "a slug is lowercase alphanumerics and hyphens")
  .describe("A folio slug, e.g. quantum-observable-universe");

/** Which content profile a folio follows. `paper` extends `document`. */
export const ContentTypeSchema = z
  .enum(["paper", "document"])
  .describe("A folio's content type. `paper` extends `document` — see AGENTS.md on content types.");

/** How a scaffolded folio reaches the platform. */
export const LinkModeSchema = z
  .enum(["submodule", "sibling"])
  .describe("How a new folio links the platform: a git submodule, or a sibling checkout.");

/** What a preferences call does. */
export const PreferenceActionSchema = z
  .enum(["get", "set", "reset"])
  .describe("Read, write or clear the stored preferences.");

/**
 * A render target a preference can name.
 *
 * Narrower than `PreviewFormat`, and the two are **not** merged. Preferences
 * choose what to build (`pdf`, `html`); preview opens what was built, which
 * includes a `png` nothing chooses to render as a whole document. One union
 * would make each Tool's contract claim a value it rejects, which is the
 * failure mode a contract exists to prevent.
 */
export const RenderFormatSchema = z.enum(["pdf", "html"]).describe("A render target: pdf or html.");

/** A render a preview can open, including images the render path emits. */
export const PreviewFormatSchema = z
  .enum(["pdf", "html", "png"])
  .describe("A previewable artefact: pdf, html or png.");

/** How much of the folio a render covers. */
export const RenderScopeSchema = z.enum(["full", "chapter", "section"]).describe("How much of the folio to render.");

/** Which TeX engine builds the PDF. */
export const LatexEngineSchema = z.enum(["pdflatex", "lualatex", "xelatex"]).describe("The TeX engine.");

/** Which browser-side math renderer the HTML uses. */
export const MathRendererSchema = z.enum(["katex", "mathjax"]).describe("The browser-side math renderer.");

/** Formal or compact typesetting. */
export const PrintModeSchema = z.enum(["formal", "compact"]).describe("Typesetting density.");

/**
 * How a generated README link addresses its target.
 *
 * `blob` is the default and the only one that works for a private folio — see
 * the README-sections note in AGENTS.md on why `raw` is not the private answer.
 */
export const LinkStyleSchema = z.enum(["blob", "pages", "raw"]).describe("How a README link addresses its target.");

/** One generated README region, named by its marker. */
export const ReadmeSectionSchema = z
  .enum(["folio:toc", "folio:lean-coverage", "folio:lean-modules", "folio:simulators", "folio:workflows"])
  .describe("A generated README section, named by its marker.");

/** The granularity a translation sign-off covers. */
export const TranslationLevelSchema = z
  .enum(["block", "section", "chapter", "folio"])
  .describe("What a translation sign-off covers.");

/** Resolution for rendered formulae. */
export const DpiSchema = z.number().int().min(24).max(1200).describe("Dots per inch for rendered formulae.");

/**
 * A TCP port for a locally bound server.
 *
 * **0 is admitted deliberately** — it asks the OS for a free port, which is
 * what `scripts/tests/serve-rendering.test.ts` binds so that a test run does
 * not collide with a developer's own server or with a sibling test. Excluding
 * it would have forced the tests onto a fixed port, which is the flake.
 *
 * Bounded and integral, so it is injection-safe by construction like `Dpi`:
 * a value carrying a shell metacharacter does not parse.
 */
export const PortSchema = z
  .number()
  .int()
  .min(0)
  .max(65535)
  .describe("TCP port for a locally bound server; 0 asks the OS for a free one.");

/**
 * The facts a DMN decision table is evaluated against.
 *
 * **Not injection-safe**, and it is the only structured type in the vocabulary.
 * Values are scalars rather than `unknown` because a decision table compares
 * them — a nested object is not something FEEL can test, so admitting one would
 * let a caller build a fact that no table can ever match.
 *
 * It is refused as a command-line word for the ordinary reason: keys and values
 * come from a caller. `workflow_complete` is invoked in-process, so the
 * question does not arise there — but a future shell projection must not be the
 * moment the constraint is discovered.
 */
export const DecisionFactsSchema = z
  .record(z.union([z.string(), z.number(), z.boolean()]))
  .describe("Facts for a DMN decision table. Scalar values only. Not admissible as a command-line argument.");

/** Everything published in the shared types document, keyed by `$defs` name. */
export const TOOL_TYPES = {
  BeanId: BeanIdSchema,
  SkillName: SkillNameSchema,
  PackageName: PackageNameSchema,
  ProcessId: ProcessIdSchema,
  NodeId: NodeIdSchema,
  InstanceId: InstanceIdSchema,
  Locale: LocaleSchema,
  Flag: FlagSchema,
  BeanStatus: BeanStatusSchema,
  RepoPath: RepoPathSchema,
  Url: UrlSchema,
  Branch: BranchSchema,
  ChangeProposalNumber: ChangeProposalNumberSchema,
  Markdown: MarkdownSchema,
  Text: TextSchema,
  FilesystemPath: FilesystemPathSchema,
  Slug: SlugSchema,
  ContentType: ContentTypeSchema,
  LinkMode: LinkModeSchema,
  PreferenceAction: PreferenceActionSchema,
  RenderFormat: RenderFormatSchema,
  PreviewFormat: PreviewFormatSchema,
  RenderScope: RenderScopeSchema,
  LatexEngine: LatexEngineSchema,
  MathRenderer: MathRendererSchema,
  PrintMode: PrintModeSchema,
  LinkStyle: LinkStyleSchema,
  ReadmeSection: ReadmeSectionSchema,
  TranslationLevel: TranslationLevelSchema,
  Dpi: DpiSchema,
  Port: PortSchema,
  DecisionFacts: DecisionFactsSchema,
} as const;

export type ToolTypeName = keyof typeof TOOL_TYPES;

/**
 * The IRI of one shared type, against a publication base.
 *
 * One function, so a Tool node never hand-writes an IRI. A hand-written one is
 * a string that looks like a reference and is checked by nothing — and the
 * owner's standing rule is that a consumer must never have to assume a rule to
 * follow a link, which applies to the author of the link first.
 *
 * **It still hand-wrote half of one, and that is the lesson.** The fragment was
 * computed here while the document's own path — `kg/tool-types.schema.json` —
 * was a literal, duplicating `harness-schema-export.ts`'s `$id` for the very
 * same file. Two functions minting URLs for one document is the same defect as
 * none, one level up. When the renderings moved from `kg/` to the base this was
 * the SIXTH site, and the only one not reached by searching the two exporters:
 * 95 `schema` refs across the published graph would have pointed at a URL that
 * 404s while the document they name sat one directory away.
 * {@link renderingPath} is now the single answer to "where is it published".
 */
export function toolTypeIri(base: string, name: ToolTypeName): string {
  return `${renderingPath(base, "tool-types.schema.json")}#/$defs/${name}`;
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
  "SkillName",
  "PackageName",
  "ProcessId",
  "NodeId",
  "InstanceId",
  "Locale",
  // Not a string at all, so it cannot carry a payload.
  "Flag",
  "BeanStatus",
  "RepoPath",
  "Url",
  "Branch",
  "ChangeProposalNumber",
  "Slug",
  // Every enum below is injection-safe by construction: a value outside the
  // member list does not parse, and no member contains a shell metacharacter.
  // This is the cheapest form of the whole argument — the payload is not
  // rejected, it is unrepresentable.
  "ContentType",
  "LinkMode",
  "PreferenceAction",
  "RenderFormat",
  "PreviewFormat",
  "RenderScope",
  "LatexEngine",
  "MathRenderer",
  "PrintMode",
  "LinkStyle",
  "ReadmeSection",
  "TranslationLevel",
  "Dpi",
  "Port",
  // Deliberately absent: `Text`, `FilesystemPath`, `DecisionFacts`. Each is
  // documented above with the reason it cannot be a command-line word.
]);

/** Is this type admissible as a command-line argument? */
export function isInjectionSafe(name: string): boolean {
  return INJECTION_SAFE.has(name as ToolTypeName);
}
