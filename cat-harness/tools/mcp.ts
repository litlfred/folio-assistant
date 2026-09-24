/**
 * The Tool nodes for the twenty tools this instance already serves over MCP.
 *
 * ## Why these exist as nodes at all
 *
 * Before this file, the MCP surface was a fact about `src/server.ts` and
 * nothing else: twenty `server.tool(name, description, shape, handler)` calls
 * whose contract lived in TypeScript closures. Nothing could ask which skill a
 * served tool implements, nothing could check that two mechanisms for one skill
 * agree about their inputs, and `mcp-contract`'s equivalence check had only one
 * side of the comparison. A Tool node is the other side.
 *
 * ## How the contracts here were obtained
 *
 * **Read from the registrars, not from the source text.** `bun run mcp:capture`
 * mounts each `register*` export against a capture object and reads the real
 * Zod shapes, which is how the required/optional split and every enum's member
 * list below were established. The first attempt regex-scanned the source and
 * produced parameter names lifted out of description prose — `skill_fetch`
 * appeared to take `Examples` and `Local`. A contract that agrees with nothing
 * is worse than no contract, because the next check trusts it.
 *
 * Re-run `bun run mcp:capture` after changing a registrar, and bring this file
 * with it. `scripts/check-tools.ts` catches a type reference that does not
 * resolve; it cannot catch a port this file forgot, which is what that command
 * is for.
 *
 * ## Why `inProcess` and not `mcp` alone
 *
 * `ToolDefinitionSchema` refuses a Tool whose only invocation is `invoke.mcp`,
 * because such a Tool is not runnable by the harness that defines it and
 * projecting it would emit a server proxying itself. Every tool here is a
 * function in this repository, so `inProcess` names the module and `mcp` names
 * the served alias beside it — the served name is a fact worth recording, not
 * the only way in.
 *
 * ## Ids are hyphenated; MCP names are not
 *
 * `ToolId` is `^[a-z][a-z0-9-]*$`, and the MCP names use underscores. Rather
 * than widen the id pattern to accommodate one serving convention, the id is
 * the hyphenated form and `invoke.mcp.tool` carries the exact served name. The
 * mapping is therefore written down once per tool instead of being a rule a
 * reader has to know — the owner's standing preference against a consumer
 * having to manipulate a string to follow a link.
 *
 * @module tools/mcp
 */
import { defineTool, type ToolDefinition } from "../schemas/tool.js";
import type { ToolTypeName } from "../schemas/tool-types.js";

/** Mint the IRI for one shared type against the publication base. */
type TypeIri = (name: ToolTypeName) => string;

/**
 * The Tool nodes for the served MCP surface.
 *
 * Takes the IRI minter rather than a base URL so that there is exactly one
 * place an IRI is formed, shared with `tools/index.ts` — a second call site
 * spelling the fragment itself is how a staging build once published `io`
 * references pointing at a canonical document that did not have them yet.
 */
export function mcpTools(t: TypeIri): ToolDefinition[] {
  /** Every tool here is a TypeScript function in this repository. */
  const inProcess = (module: string, mcpName: string) => ({
    inProcess: { module },
    mcp: { tool: mcpName },
  });

  /** Nothing to fetch: the code ships with the harness. */
  const bundled = { none: true } as const;

  return [
    defineTool({
      id: "check-dependencies",
      title: "Dependency probe",
      description:
        "Report which of the harness's optional and required dependencies are present on this machine, and what each unmet one blocks.",
      install: bundled,
      invoke: { ...inProcess("src/tools/check-deps.ts", "check_dependencies"), shell: "bun run cat-harness/src/index.ts --check-deps" },
      io: {
        inputs: [
          {
            name: "required_only",
            schema: t("Flag"),
            required: false,
            arg: { flag: "--required-only" },
            description: "Report only the dependencies without which the harness cannot run.",
          },
        ],
        outputs: [{ name: "report", schema: t("Markdown"), description: "Per-dependency: present, absent, or could not be determined." }],
      },
      satisfies: ["verify-local-substrate"],
      requires: { network: false },
    }),

    defineTool({
      id: "folio-init",
      title: "Scaffold a folio",
      description:
        "Create a new folio repository that uses this platform — folio/, uploads/, library/, the first manifests, the builder shim, agent files, and the link back to the platform.",
      install: bundled,
      invoke: { ...inProcess("src/tools/folio-init.ts", "folio_init"), shell: "bun run init-folio" },
      io: {
        inputs: [
          { name: "title", schema: t("Text"), required: true, description: "The folio's human title." },
          {
            name: "authors",
            schema: t("Text"),
            required: true,
            repeated: true,
            description: "One entry per author. Repeated rather than a joined string: a name may contain the separator.",
          },
          { name: "content_type", schema: t("ContentType"), required: false, arg: { flag: "--content-type" } },
          { name: "slug", schema: t("Slug"), required: false, arg: { flag: "--slug" } },
          // `dir` and `assistant_path` are FilesystemPath, not RepoPath: a new
          // folio is created OUTSIDE this repository and `../folio-assistant`
          // is the ordinary sibling link. Neither is admissible as a
          // command-line word, which is why neither carries an `arg`.
          { name: "dir", schema: t("FilesystemPath"), required: false, description: "Where to create the folio." },
          { name: "link", schema: t("LinkMode"), required: false, arg: { flag: "--link" } },
          { name: "assistant_path", schema: t("FilesystemPath"), required: false, description: "Path to the platform checkout, for a sibling link." },
          { name: "force", schema: t("Flag"), required: false, arg: { flag: "--force" } },
          { name: "dry_run", schema: t("Flag"), required: false, arg: { flag: "--dry-run" } },
        ],
        outputs: [{ name: "report", schema: t("Markdown"), description: "What was written, or what would have been under --dry-run." }],
      },
      satisfies: ["repo-conversion", "getting-started"],
      requires: { network: false },
    }),

    defineTool({
      id: "paper-preferences",
      title: "Rendering preferences",
      description: "Read, write or clear the stored rendering preferences — engine, format, scope, math renderer, print mode.",
      install: bundled,
      invoke: inProcess("src/tools/preferences.ts", "paper_preferences"),
      io: {
        inputs: [
          { name: "action", schema: t("PreferenceAction"), required: false, arg: { flag: "--action" } },
          { name: "render_format", schema: t("RenderFormat"), required: false, arg: { flag: "--render-format" } },
          { name: "render_scope", schema: t("RenderScope"), required: false, arg: { flag: "--render-scope" } },
          { name: "latex_engine", schema: t("LatexEngine"), required: false, arg: { flag: "--latex-engine" } },
          { name: "math_renderer", schema: t("MathRenderer"), required: false, arg: { flag: "--math-renderer" } },
          { name: "auto_preview", schema: t("Flag"), required: false, arg: { flag: "--auto-preview" } },
          { name: "formula_dpi", schema: t("Dpi"), required: false, arg: { flag: "--formula-dpi" } },
          { name: "default_chapter", schema: t("RepoPath"), required: false, arg: { flag: "--default-chapter" } },
          { name: "print_mode", schema: t("PrintMode"), required: false, arg: { flag: "--print-mode" } },
          { name: "compact_inline_refs", schema: t("Flag"), required: false, arg: { flag: "--compact-inline-refs" } },
        ],
        outputs: [{ name: "preferences", schema: t("Markdown"), description: "The preferences after the call." }],
      },
      satisfies: ["build-pdf", "build-docs"],
      requires: { network: false },
    }),

    defineTool({
      id: "paper-preview",
      title: "Open a render",
      description: "Open a rendered PDF, HTML page or image in the system browser, or list the renders available to open.",
      install: bundled,
      invoke: inProcess("src/tools/preview.ts", "paper_preview"),
      io: {
        inputs: [
          { name: "file", schema: t("RepoPath"), required: false, arg: { positional: 0 } },
          // `PreviewFormat`, not `RenderFormat`: this opens what was built,
          // which includes a `png` nothing chooses to render a whole folio as.
          { name: "format", schema: t("PreviewFormat"), required: false, arg: { flag: "--format" } },
          { name: "list", schema: t("Flag"), required: false, arg: { flag: "--list" } },
        ],
        outputs: [{ name: "opened", schema: t("Markdown"), description: "What was opened, or the list of candidates." }],
      },
      satisfies: ["rendering-auditor", "staging-review"],
      requires: { network: false },
    }),

    defineTool({
      id: "readme-audit",
      title: "Audit README links",
      description:
        "Verify every Markdown link in a folio's README still resolves — relative paths against the tree, repo refs against a real ls-tree, Pages URLs against the publish ref. Writes nothing.",
      install: bundled,
      invoke: { ...inProcess("src/tools/readme-audit.ts", "readme_audit"), shell: "bun run readme:audit" },
      io: {
        inputs: [
          { name: "file", schema: t("RepoPath"), required: false, arg: { positional: 0 }, description: "The file to audit; the README by default." },
          { name: "fetch", schema: t("Flag"), required: false, arg: { flag: "--fetch" }, description: "Also dereference external URLs." },
          { name: "dir", schema: t("FilesystemPath"), required: false, description: "The folio root, when not the working directory." },
        ],
        outputs: [
          {
            name: "findings",
            schema: t("Markdown"),
            description: "Resolved, dead, or NOT CHECKED — the third state is never rendered as either of the other two.",
          },
        ],
      },
      satisfies: ["docs-generation"],
      requires: { network: false },
    }),

    defineTool({
      id: "render-order",
      title: "The render pipeline, in dependency order",
      description:
        "Flatten the repository's renders into the order their `needs` imply, and optionally run them. Two stages: the current declared state as json/jsonld and the README derived from it are FATAL; the dynamic renderers (viewers, visualisers, doc pages, diagrams) skip and log; the dynamic-state export closes it. A cycle or a missing dependency yields NO order rather than a partial one.",
      install: bundled,
      invoke: { ...inProcess("src/tools/render-order.ts", "render_order"), shell: "bun run render" },
      io: {
        inputs: [
          {
            name: "dry_run",
            schema: t("Flag"),
            required: false,
            arg: { flag: "--dry-run" },
            description: "Print the flattened order and each step's failure policy without running anything.",
          },
        ],
        outputs: [
          {
            name: "report",
            schema: t("Markdown"),
            description:
              "Per step: ran, failed, skipped, or PENDING — declared with no implementation yet, which is never rendered as a pass.",
          },
        ],
      },
      satisfies: ["docs-generation"],
      requires: { network: false },
    }),

    defineTool({
      id: "readme-sync",
      title: "Sync generated README sections",
      description:
        "Rewrite each generated README region, and only where the README already carries that section's marker pair. Nothing outside a marked region is touched.",
      install: bundled,
      invoke: { ...inProcess("src/tools/readme-sync.ts", "readme_sync"), shell: "bun run readme:sync" },
      io: {
        inputs: [
          { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Fail if any section is stale; write nothing." },
          {
            name: "only",
            schema: t("ReadmeSection"),
            required: false,
            repeated: true,
            arg: { flag: "--only" },
            description: "Restrict to these sections. Repeated: the flag is emitted once per section.",
          },
          { name: "link_style", schema: t("LinkStyle"), required: false, arg: { flag: "--link-style" } },
          { name: "fetch", schema: t("Flag"), required: false, arg: { flag: "--fetch" } },
          { name: "dir", schema: t("FilesystemPath"), required: false },
        ],
        outputs: [{ name: "report", schema: t("Markdown"), description: "Per section: written, unchanged, or skipped because it could not be determined." }],
      },
      satisfies: ["docs-generation"],
      requires: { network: false },
    }),

    defineTool({
      id: "skill-fetch",
      title: "Fetch a skill",
      description: "Load one skill's instruction body for the agent to follow, from the local packages or an external bundle.",
      install: bundled,
      invoke: inProcess("src/tools/skill-fetch.ts", "skill_fetch"),
      io: {
        inputs: [
          { name: "skill", schema: t("SkillName"), required: true, arg: { positional: 0 } },
          { name: "package_name", schema: t("PackageName"), required: false, arg: { flag: "--package" } },
        ],
        outputs: [{ name: "instructions", schema: t("Markdown"), description: "The skill's instruction body." }],
      },
      satisfies: ["skills-and-tools"],
      requires: { network: false },
    }),

    defineTool({
      id: "skill-list",
      title: "List skills",
      description: "Every skill this instance can resolve, with its one-line summary. The entry point AGENTS.md sends an agent to first.",
      install: bundled,
      invoke: inProcess("src/tools/skill-fetch.ts", "skill_list"),
      io: {
        inputs: [],
        outputs: [{ name: "skills", schema: t("Markdown"), description: "Name and summary per skill." }],
      },
      satisfies: ["skills-and-tools"],
      requires: { network: false },
    }),

    defineTool({
      id: "stakeholder-map",
      title: "Stakeholder map",
      description:
        "Given the paths a proposed change touches, report which skills change, which roles declare them, and who therefore has a stake in the review.",
      install: bundled,
      invoke: { ...inProcess("src/tools/stakeholder-map.ts", "stakeholder_map"), shell: "bun run stakeholder-map" },
      io: {
        inputs: [
          {
            name: "paths",
            schema: t("RepoPath"),
            required: true,
            repeated: true,
            arg: { positional: 0 },
            description: "The changed paths. A repeated positional, so it is last on the command line.",
          },
        ],
        outputs: [{ name: "stakeholders", schema: t("Markdown"), description: "Skills, roles and the people each role names." }],
      },
      satisfies: ["role-model", "coordinate"],
      requires: { network: false },
    }),

    defineTool({
      id: "translation-extract",
      title: "Extract translatable strings",
      description: "Segment a folio's prose into a GNU gettext .pot template, leaving code, math and identifiers untranslated.",
      install: bundled,
      invoke: inProcess("src/tools/translation.ts", "translation_extract"),
      io: {
        inputs: [
          { name: "path", schema: t("RepoPath"), required: true, arg: { positional: 0 }, description: "A markdown file or a directory of them." },
          { name: "locale", schema: t("Locale"), required: false, arg: { flag: "--locale" } },
          { name: "project_name", schema: t("Text"), required: false, description: "Recorded in the .pot header." },
        ],
        outputs: [{ name: "pot", schema: t("RepoPath"), description: "The template written." }],
      },
      satisfies: ["translation-manager"],
      requires: { network: false },
    }),

    defineTool({
      id: "translation-inject",
      title: "Inject translations",
      description: "Produce a translated copy of a source markdown file from a .po, using the same segmentation the extractor used.",
      install: bundled,
      invoke: inProcess("src/tools/translation.ts", "translation_inject"),
      io: {
        inputs: [
          { name: "source", schema: t("RepoPath"), required: true, arg: { positional: 0 } },
          { name: "po_file", schema: t("RepoPath"), required: true, arg: { positional: 1 } },
          { name: "locale", schema: t("Locale"), required: true, arg: { flag: "--locale" } },
        ],
        outputs: [{ name: "translated", schema: t("RepoPath"), description: "The translated copy written." }],
      },
      satisfies: ["translation-manager"],
      requires: { network: false },
    }),

    defineTool({
      id: "translation-status",
      title: "Translation coverage",
      description: "Per-locale translation coverage, computed from the .po files under the translations directory.",
      install: bundled,
      invoke: inProcess("src/tools/translation.ts", "translation_status"),
      io: {
        inputs: [{ name: "locale", schema: t("Locale"), required: false, arg: { flag: "--locale" }, description: "Absent means every locale." }],
        outputs: [{ name: "coverage", schema: t("Markdown"), description: "Translated, fuzzy and untranslated counts per locale." }],
      },
      satisfies: ["translation-manager"],
      requires: { network: false },
    }),

    defineTool({
      id: "translation-signoff",
      title: "Sign off a translation",
      description:
        "Record a translation as official — who signed off, when, and the hash of the source it was signed against, so a later source edit is detectable.",
      install: bundled,
      invoke: inProcess("src/tools/translation.ts", "translation_signoff"),
      io: {
        inputs: [
          { name: "locale", schema: t("Locale"), required: true, arg: { flag: "--locale" } },
          { name: "source", schema: t("RepoPath"), required: true, arg: { positional: 0 } },
          // A person's name, so `Text` and no `arg`: it is not a command-line
          // word, and the sign-off is an in-process call anyway.
          { name: "signed_off_by", schema: t("Text"), required: true, description: "Who is signing off." },
          { name: "level", schema: t("TranslationLevel"), required: false, arg: { flag: "--level" } },
        ],
        outputs: [{ name: "record", schema: t("Markdown"), description: "The sign-off recorded, including the source hash." }],
      },
      satisfies: ["translation-manager", "decision-audit"],
      requires: { network: false },
    }),

    defineTool({
      id: "translation-validate",
      title: "Validate a translation",
      description: "Check a .po against its .pot — every msgid present, none obsolete, placeholders preserved.",
      install: bundled,
      invoke: inProcess("src/tools/translation.ts", "translation_validate"),
      io: {
        inputs: [
          { name: "pot_file", schema: t("RepoPath"), required: true, arg: { positional: 0 } },
          { name: "po_file", schema: t("RepoPath"), required: true, arg: { positional: 1 } },
          { name: "source", schema: t("RepoPath"), required: false, arg: { flag: "--source" }, description: "Also check the .pot is current for this source." },
        ],
        outputs: [{ name: "findings", schema: t("Markdown"), description: "Missing, obsolete and malformed entries." }],
      },
      // NOT `content-validate`: that edge was here and `check:tools` now
      // refuses it. The skill's contract requires `targetPath` — it validates
      // a folio's content — while this validates a .po against its .pot. Two
      // things called validation are not one skill.
      satisfies: ["translation-manager"],
      requires: { network: false },
    }),

    defineTool({
      id: "work-plan-prime",
      title: "Prime the work plan",
      description:
        "Load the current work plan for this session — the same committed beans store the CLI reads, so a fresh container starts from the plan rather than from nothing.",
      install: bundled,
      invoke: { ...inProcess("src/tools/beans-prime.ts", "work_plan_prime"), shell: "beans prime" },
      io: {
        inputs: [],
        outputs: [{ name: "priming", schema: t("Markdown"), description: "Open items, the roadmap, and what each is waiting on." }],
      },
      // The same skills `beans-cli` and `beans-manual` satisfy for reading, and
      // for the same reason: an agent must be able to reach the plan by
      // whichever mechanism this container actually has.
      satisfies: ["todo-manager", "bean-coordination", "session-intent", "pending-show"],
      requires: { network: false },
    }),

    defineTool({
      id: "workflow-list",
      title: "List processes",
      description: "The BPMN processes this instance defines, and the instances currently open against them.",
      install: bundled,
      invoke: inProcess("src/tools/workflow.ts", "workflow_list"),
      io: {
        inputs: [],
        outputs: [{ name: "processes", schema: t("Markdown"), description: "Each process, its policy, and its open instances." }],
      },
      satisfies: ["process-state"],
      requires: { network: false },
    }),

    defineTool({
      id: "workflow-start",
      title: "Start a process instance",
      description:
        "Open an instance of a process for a subject. Idempotent: an existing instance for the same subject is returned rather than duplicated.",
      install: bundled,
      invoke: inProcess("src/tools/workflow.ts", "workflow_start"),
      io: {
        inputs: [
          { name: "process", schema: t("ProcessId"), required: true, arg: { positional: 0 } },
          { name: "subject", schema: t("Text"), required: true, description: "What the instance is about — a block label, a release, a bean." },
          { name: "bean", schema: t("BeanId"), required: false, arg: { flag: "--bean" }, description: "The work-plan item this instance carries out." },
        ],
        outputs: [{ name: "instance", schema: t("InstanceId"), description: "The instance opened or found." }],
      },
      satisfies: ["process-state", "bean-coordination"],
      requires: { network: false },
    }),

    defineTool({
      id: "workflow-next",
      title: "What is enabled now",
      description: "The activities an instance may work right now, each with the lane that owns it and the skill that implements it.",
      install: bundled,
      invoke: inProcess("src/tools/workflow.ts", "workflow_next"),
      io: {
        inputs: [{ name: "instance", schema: t("InstanceId"), required: true, arg: { positional: 0 } }],
        outputs: [{ name: "enabled", schema: t("Markdown"), description: "Activity, lane and skill for each enabled step." }],
      },
      satisfies: ["process-state"],
      requires: { network: false },
    }),

    defineTool({
      id: "workflow-gate",
      title: "May this step be performed?",
      description:
        "Ask before doing work a strict process governs. The content-agnostic processes refuse a step that is not enabled; the per-content-type ones advise.",
      install: bundled,
      invoke: inProcess("src/tools/workflow.ts", "workflow_gate"),
      io: {
        inputs: [
          { name: "instance", schema: t("InstanceId"), required: true, arg: { positional: 0 } },
          { name: "activity", schema: t("NodeId"), required: true, arg: { positional: 1 } },
          { name: "actor", schema: t("Text"), required: false, description: "The declared actor who would perform it; checked against the lane's role and the ODRL policies (issue #1207)." },
          { name: "target", schema: t("Text"), required: false, description: "The content it would act on, for the access check." },
        ],
        outputs: [{ name: "verdict", schema: t("Markdown"), description: "Permitted, refused with the reason, or advisory — and the task-authorization verdict." }],
      },
      satisfies: ["process-state"],
      requires: { network: false },
    }),

    defineTool({
      id: "workflow-complete",
      title: "Complete a step",
      description:
        "Record an enabled step as done — or supply the facts a decision gateway is computed from — and advance the instance. Refuses a step that is not enabled.",
      install: bundled,
      invoke: inProcess("src/tools/workflow.ts", "workflow_complete"),
      io: {
        inputs: [
          { name: "instance", schema: t("InstanceId"), required: true, arg: { positional: 0 } },
          { name: "node", schema: t("NodeId"), required: true, arg: { positional: 1 } },
          {
            name: "outcome",
            schema: t("NodeId"),
            required: false,
            arg: { flag: "--outcome" },
            description: "Which branch a plain gateway takes. Refused at a gateway backed by a decision table — asserting the answer would defeat the table.",
          },
          {
            name: "facts",
            schema: t("DecisionFacts"),
            required: false,
            description: "Facts a DMN table is evaluated against. Structured, so it is never a command-line word.",
          },
          { name: "actor", schema: t("Text"), required: false, description: "The declared actor who performed the step. Checked against the lane's role and the ODRL policies before anything is recorded (issue #1207)." },
          { name: "target", schema: t("Text"), required: false, description: "The content the step acted on, for the access check." },
          // Free prose, and prose is not a command-line word — see
          // `tool-types` on why `Markdown` is excluded from INJECTION_SAFE.
          { name: "note", schema: t("Markdown"), required: false, arg: { stdin: true }, description: "Appended to the instance's bean." },
        ],
        outputs: [{ name: "position", schema: t("Markdown"), description: "The instance's new position, and what is enabled next." }],
      },
      // NOT `dmn-authoring`: EVALUATING a decision table is not AUTHORING
      // one, and the skill's contract says so — it requires `decisionName` and
      // `inputVariables`, which are what you supply to write a table, not to
      // answer one. `check:tools` refuses the edge.
      satisfies: ["process-state", "bean-coordination"],
      requires: { network: false },
    }),
  ];
}
