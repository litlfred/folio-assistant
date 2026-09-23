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

import type { TermLayer } from "./vocabulary.js";

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

/**
 * A forge repository's full name, `owner/name`.
 *
 * Its own type rather than `Text` because a Tool takes it on the command line
 * (`folio-review-comments --repo`, bean `423d`), and `Text` is deliberately
 * not admissible there. Each half is the character set GitHub allows in an
 * owner and a repository name, which contains no shell metacharacter, and
 * `..` is refused, so it can never climb a path it is joined into.
 */
export const RepoFullNameSchema = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/, "a repository is `owner/name`")
  .refine((r) => !r.includes(".."), "a repository name may not contain `..`")
  .describe("A forge repository's full name, owner/name");

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

/**
 * An instant, as an ISO-8601 UTC timestamp — `2026-09-20T14:03:11Z`.
 *
 * **Required on a log line, which is the whole reason it is constrained rather
 * than free text.** A log whose times are written three ways cannot be sorted,
 * and a reader cannot tell "before" from "after" without knowing which writer
 * produced which line. The pattern admits one spelling and refuses the rest.
 *
 * `Z` and not an offset, deliberately. An offset is a second fact — where the
 * writer was — smuggled into a field that answers when, and two lines an hour
 * apart in different offsets compare wrongly as strings. Where the local time
 * matters it is prose, and prose has a home: the optional markdown body.
 *
 * Injection-safe by construction: digits, hyphens, colons, `T` and `Z`, and
 * nothing else parses.
 */
export const TimestampSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$/,
    "a timestamp is an ISO-8601 UTC instant, e.g. 2026-09-20T14:03:11Z",
  )
  .describe("An ISO-8601 UTC instant, e.g. 2026-09-20T14:03:11Z");

/**
 * A time window for a history sweep — `4h`, `2d`, `1w`, or a calendar date.
 *
 * Bean `ab3n`'s sweep takes one, and `check:tools` refused the first draft for
 * declaring it `Text`: free text on a command line can express a shell
 * payload, and `--since "$(...)"` is the whole of the objection. The remedy
 * this repository prefers is not escaping but **unrepresentability** — the
 * grammar here admits a count with a unit, or an ISO date, and nothing else
 * parses.
 *
 * Deliberately NARROWER than `git log --since`, which also accepts
 * "yesterday", "last monday" and much else. A tool's declared input type is a
 * contract, not a description of what the underlying program tolerates, and
 * the phrase forms buy nothing a count with a unit does not already give.
 */
export const TimeWindowSchema = z
  .string()
  .regex(
    /^(\d{1,4}[hdw]|\d{4}-\d{2}-\d{2})$/,
    'a time window is a count with a unit (4h, 2d, 1w) or an ISO date (2026-09-20)',
  )
  .describe("A history window: a count with a unit (4h, 2d, 1w) or an ISO date.");

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
/**
 * A render-log event — `rendered` | `removed` | `restored` | `retained`.
 *
 * The closed half of `render-log`'s vocabulary. `RENDER_SUBJECT_KINDS` is
 * deliberately open and takes `Slug`; this one is a fixed four, because
 * `EVENTS_REQUIRING_REASON` branches on it and a fifth event would need a
 * decision about whether it owes a reason rather than a schema edit.
 *
 * Injection-safe by construction: a value outside the member list does not
 * parse, and no member contains a shell metacharacter.
 */
/**
 * A git commit SHA — full or abbreviated.
 *
 * Declared rather than borrowing `Slug`, which a 40-hex string does match: a
 * type's `describe` is part of a Tool's published contract, and "A folio slug,
 * e.g. quantum-observable-universe" is the wrong thing for a reader to be told
 * about a commit. Reusing a type because its REGEX happens to admit the value is
 * how a contract ends up asserting something nobody meant.
 *
 * Hex only, so injection-safe by construction. Abbreviated forms are admitted
 * because every caller here passes `$GITHUB_SHA` or a `git rev-parse --short`.
 */
export const CommitShaSchema = z
  .string()
  .regex(/^[0-9a-f]{7,40}$/, "a commit sha is 7-40 lowercase hex digits")
  .describe("A git commit sha, full or abbreviated (7-40 hex digits).");

export const RenderEventSchema = z
  .enum(["rendered", "removed", "restored", "retained"])
  .describe("A render-log event: rendered, removed, restored or retained.");

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

/**
 * One namespace layer, as a command-line word.
 *
 * ## Why this exists rather than `Text`
 *
 * `check:tools` refuses free text on a flag, because an argv word that can hold
 * arbitrary characters can hold a shell payload. It caught `ns-vocabulary`'s
 * `--layer` on exactly that rule. The fix for an enumerable input is the enum,
 * never a looser type that happens to pass.
 *
 * ## Why it is guarded rather than merely copied
 *
 * The members duplicate `TermLayer` in `schemas/vocabulary.ts`, and zod needs a
 * literal tuple so the duplication cannot be avoided. What CAN be avoided is the
 * duplication going stale silently, which is the only reason a duplicate is
 * dangerous — `directory-conventions` puts it as: an unavoidable duplicate is
 * fine while an unchecked one is not.
 *
 * `satisfies` catches a member that stops being a layer. `NamespaceLayerCovers`
 * catches the other direction — a layer added to `TermLayer` and not added here
 * fails `tsc`, rather than producing a Tool contract that quietly refuses a
 * value the script accepts.
 */
const NAMESPACE_LAYERS = ["bootstrap", "harness", "core"] as const satisfies readonly TermLayer[];

/** Fails to compile if `TermLayer` gains a member this tuple does not list. */
type NamespaceLayerCovers = Exclude<TermLayer, (typeof NAMESPACE_LAYERS)[number]> extends never
  ? true
  : never;
const _namespaceLayersAreExhaustive: NamespaceLayerCovers = true;
void _namespaceLayersAreExhaustive;

/**
 * A `lake-cache` verb.
 *
 * ## Why an enum and not `Text`
 *
 * Same rule as `NamespaceLayer`: `check:tools` refuses free text on a flag or a
 * positional, because an argv word that can hold arbitrary characters can hold a
 * shell payload. A subcommand is enumerable, so the enum is the fix — and
 * reaching for `Slug` because it happens to be injection-safe would type the
 * input as something it is not.
 *
 * Read from the script's own usage block rather than guessed, which is why
 * `contribute` and `doctor` are here: a list of the four obvious verbs would have
 * refused two real ones and looked complete doing it.
 */
export const LakeCacheActionSchema = z
  .enum([
    "status",
    "restore",
    "restore-toolchain",
    "install-toolchain",
    "verify",
    "seed",
    "contribute",
    "list",
    "doctor",
  ])
  .describe("A lake-cache verb: restore prebuilt oleans, seed them, or diagnose why a restore missed.");

export const NamespaceLayerSchema = z
  .enum(NAMESPACE_LAYERS)
  .describe("A namespace layer: bootstrap resolves before anything else, then harness, then core.");

/** The granularity a translation sign-off covers. */
export const TranslationLevelSchema = z
  .enum(["block", "section", "chapter", "folio"])
  .describe("What a translation sign-off covers.");

/**
 * A plain non-negative count — how many of something, or how many to show.
 *
 * ## Why this exists, and why it did not until 2026-09-20
 *
 * This vocabulary had **no general numeric type**. `Dpi` and `Port` are both
 * numbers and both mean something specific, so neither can stand in for "a
 * number of things", and the honest move at each call site was to leave the
 * input undeclared and say so in a comment. Two nodes did exactly that:
 * `content-graph-build`, whose edge counts became one `Text` report, and
 * `fsh-cone`, whose `--top N` and `--history N` are still not declared.
 *
 * **Two independent needs is the bar.** The rule this repository keeps is that
 * adding a type to fit ONE flag is how a vocabulary stops meaning anything —
 * and that rule was applied, twice, by refusing to invent `Count` for a single
 * node. It is a different judgement once the same gap has been met from two
 * directions by two different mechanisms.
 *
 * ## The bounds, and what each is for
 *
 * `min(0)` because a count of zero is a real answer and the commonest one worth
 * reporting: zero findings, zero blocks, zero edges. Excluding it would push
 * every such case into a sentinel or an absent field, which is the third-state
 * confusion this vocabulary exists to prevent.
 *
 * `int()` and a finite `max` because that is what makes it **injection-safe by
 * construction**, the same argument `Dpi` and `Port` carry: a value bearing a
 * shell metacharacter does not parse, so it can reach argv. An unbounded number
 * would admit `Infinity` and `1e21`, which stringify into argv as words no
 * consumer expects. The ceiling is deliberately far above any real corpus —
 * it bounds the TYPE, not the domain, and a node needing a tighter limit says so
 * in its port description rather than by minting a narrower type.
 *
 * NOT for a limit that must be positive. `--top 0` is a legitimate request for
 * nothing, and a type that forbade it would be asserting a policy that belongs
 * to the flag.
 */
export const CountSchema = z
  .number()
  .int()
  .min(0)
  .max(1_000_000_000)
  .describe("A non-negative count — how many of something, or how many to show. Zero is a real answer.");

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
  .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
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
  Timestamp: TimestampSchema,
  TimeWindow: TimeWindowSchema,
  Flag: FlagSchema,
  BeanStatus: BeanStatusSchema,
  RepoPath: RepoPathSchema,
  Url: UrlSchema,
  Branch: BranchSchema,
  RepoFullName: RepoFullNameSchema,
  ChangeProposalNumber: ChangeProposalNumberSchema,
  Markdown: MarkdownSchema,
  Text: TextSchema,
  FilesystemPath: FilesystemPathSchema,
  Slug: SlugSchema,
  ContentType: ContentTypeSchema,
  LinkMode: LinkModeSchema,
  LakeCacheAction: LakeCacheActionSchema,
  NamespaceLayer: NamespaceLayerSchema,
  PreferenceAction: PreferenceActionSchema,
  CommitSha: CommitShaSchema,
  RenderEvent: RenderEventSchema,
  RenderFormat: RenderFormatSchema,
  PreviewFormat: PreviewFormatSchema,
  RenderScope: RenderScopeSchema,
  LatexEngine: LatexEngineSchema,
  MathRenderer: MathRendererSchema,
  PrintMode: PrintModeSchema,
  LinkStyle: LinkStyleSchema,
  ReadmeSection: ReadmeSectionSchema,
  TranslationLevel: TranslationLevelSchema,
  Count: CountSchema,
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
  "Timestamp",
  // A count with a unit or an ISO date; nothing else parses. See the schema.
  "TimeWindow",
  // Not a string at all, so it cannot carry a payload.
  "Flag",
  "BeanStatus",
  "RepoPath",
  "Url",
  "Branch",
  "RepoFullName",
  "ChangeProposalNumber",
  "Slug",
  // Every enum below is injection-safe by construction: a value outside the
  // member list does not parse, and no member contains a shell metacharacter.
  // This is the cheapest form of the whole argument — the payload is not
  // rejected, it is unrepresentable.
  "ContentType",
  "LinkMode",
  "LakeCacheAction",
  "NamespaceLayer",
  "PreferenceAction",
  "CommitSha",
  "RenderEvent",
  "RenderFormat",
  "PreviewFormat",
  "RenderScope",
  "LatexEngine",
  "MathRenderer",
  "PrintMode",
  "LinkStyle",
  "ReadmeSection",
  "TranslationLevel",
  "Count",
  "Dpi",
  "Port",
  // Deliberately absent: `Text`, `FilesystemPath`, `DecisionFacts`. Each is
  // documented above with the reason it cannot be a command-line word.
]);

/** Is this type admissible as a command-line argument? */
export function isInjectionSafe(name: string): boolean {
  return INJECTION_SAFE.has(name as ToolTypeName);
}
