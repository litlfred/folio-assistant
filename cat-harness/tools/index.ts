/**
 * This instance's Tool nodes — the `tools` graph.
 *
 * A **skill** states a capability generically; a **Tool** is one concrete way
 * to exercise it. See `skills/folio-core/skills-and-tools.md`.
 *
 * Authored as TypeScript calling `defineTool`, so a malformed node fails at
 * `tsc` and in the editor rather than at CI — the carrier decision applied to
 * instances as well as to the schema. The JSON-LD and JSON Schema renderings
 * are generated from these.
 *
 * ## The base URL
 *
 * I/O type IRIs are minted against the instance's `canonicalUrl` at load, not
 * written out, so relocating the publication base does not require editing
 * every Tool. `toolTypeIri` is the one place an IRI is formed.
 *
 * @module tools
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { defineTool, type ToolDefinition } from "../schemas/tool.js";
import { toolTypeIri } from "../schemas/tool-types.js";
import { mcpTools } from "./mcp.js";

// The INSTANCE root — `<repo>/cat-harness`, where `harness.json` lives.
//
// Was `"..", ".."`, which reached the repository root, and that was the same
// directory as the instance root until the move (bean `wggr`). Afterwards it
// overshot by one: `decl()` found no declaration, `base()` returned "", every
// `io` IRI came out relative, and Zod rejected the lot with "io schema
// references must be absolute IRIs". Seven failures from one segment.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The declared publication base, or a local placeholder when none is set. */
function base(): string {
  return decl().canonicalUrl ?? "";
}

/**
 * This instance's artefact stub, read from the declaration.
 *
 * NEVER written in. `<stub>.schema.json` is one of the artefacts declared
 * below, and an instance that renames itself — the `folio-assistant` /
 * `cat-harness` question still open at the time of writing — must not have to
 * edit a Tool node for the declaration to stay true.
 */
function stub(): string {
  const d = decl();
  return d.stub ?? d.name ?? "instance";
}

function decl(): { canonicalUrl?: string; stub?: string; name?: string } {
  const p = join(ROOT, "harness.json");
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as ReturnType<typeof decl>;
  } catch {
    return {};
  }
}

export function tools(baseUrl?: string): ToolDefinition[] {
  const B = baseUrl ?? base();
  const t = (n: Parameters<typeof toolTypeIri>[1]): string => toolTypeIri(B, n);

  return [
    // ── The one tool an agent has before it has any tooling.
    //
    // Bean `3jj9`, and the owner's ruling that human/agent and agent/agent
    // interaction is documented as a skill plus a tool. The SKILL lives in
    // `bootstrap/skills/discussion.md`, because an Initiator must be able to
    // READ it with nothing installed; the typed node lives here, because a
    // Tool is cat-harness's vocabulary and bootstrap may not import it.
    //
    // `invoke: { manual: true }` — "performed by a person following the
    // skill, with no command", and the `beans-manual` precedent is explicit
    // that this has equal standing to a CLI rather than marking an
    // unfinished record. It is the honest declaration: there is no binary and
    // no endpoint, the mechanism is putting a question to a participant and
    // receiving an answer. Declaring a shell or an MCP name would assert
    // machinery that is not there, and an Initiator that trusted it would be
    // stuck at the first step of `initialize-harness` — the step this exists
    // to unblock. (`conversation: true` was the first draft; `tsc` refused it,
    // correctly — a new invoke kind for one tool is a vocabulary change, and
    // `manual` already means this.)
    //
    // It DOES NOT DECIDE. It carries a question out and an answer back; the
    // skill's judgement chooses what to ask and rules on when the answer
    // settles the matter. The output is a document conforming to
    // `discussion.output.schema.json`, which is what makes the task checkable
    // rather than "we discussed it".
    defineTool({
      id: "discuss",
      title: "discussion",
      description:
        "Put a question to a person or a sibling agent and receive an answer, to determine which harness this repository should become and which repositories are read from and written to. The two facts no file holds.",
      install: { none: true },
      invoke: { manual: true },
      io: {
        inputs: [
          { name: "question", schema: t("Text"), required: true, description: "The question as put, with its candidates named. One question where one will do." },
          { name: "askedOf", schema: t("Text"), required: true, description: "`person` or `agent` — symmetric participants, recorded because the answers are evidence of different weight." },
        ],
        outputs: [
          { name: "answer", schema: t("Text"), description: "The reply as received. Absent is a real result: it routes to `outcome: unsettled`, never to a guess." },
        ],
      },
      satisfies: ["discussion"],
      selection: {
        when:
          "A fact is needed that no file in reach holds — which harness, or which repositories. Narrow the candidates from context first; a repository already carrying `cat-harness/harness.json` is not a blank slate, and a question the agent could have answered itself wastes the one it is entitled to.",
        limits:
          "It cannot manufacture an answer. A participant may decline, and that is `outcome: unsettled` with what is still open — not an error and not a default. An agent that reaches for a documented default because nobody replied has produced a guess.",
        cost: "One round trip through a person's attention, which is the most expensive input in the system and the reason the skill's rule is to ask once.",
      },
      requires: {},
    }),

    defineTool({
      id: "beans-cli",
      title: "beans CLI",
      description:
        "Read and write the work plan with the `beans` binary. The normal mechanism when it is installed.",
      install: { cli: "scripts/install-beans.sh" },
      invoke: { shell: "beans" },
      io: {
        inputs: [
          { name: "id", schema: t("BeanId"), required: false, arg: { positional: 0 }, description: "The bean to act on; absent for list/create." },
          { name: "status", schema: t("BeanStatus"), required: false, arg: { flag: "--status" } },
          { name: "body", schema: t("Markdown"), required: false, arg: { stdin: true } },
        ],
        outputs: [{ name: "bean", schema: t("BeanId"), description: "The bean created or updated." }],
      },
      satisfies: [
        "bean-coordination", "todo-manager", "pending-show",
        "session-intent", "continual-progress", "idle-backlog",
      ],
      alternativeTo: ["beans-manual"],
      selection: {
        when:
          "The normal case, once `scripts/install-beans.sh` has run. It is the only arm that can answer what an item IS or what it waits on — the fallback gives titles and statuses and nothing else — so any work that involves choosing, claiming or reasoning about an item wants this one.",
        limits:
          "Absent on a fresh container until installed, and the install can fail. It is third-party, which is why `.beans.yml` is one of the two configuration paths `check:harness-dirs` cannot remove. When it is missing, `beans-manual` writes the same store in the same layout and this reads back everything it wrote.",
        cost: "One install step per container, and it wants network to fetch. Nothing at runtime after that.",
      },
      requires: { runtime: ["go"], network: true },
    }),

    defineTool({
      id: "beans-manual",
      title: "beans, by hand",
      description:
        "Read and write the same work plan without the CLI — `scripts/beans-fallback.ts`, or editing a bean's front matter directly. Equal standing to the CLI, not a degraded mode.",
      // Nothing to install: the store is files in the repository. Stated
      // explicitly so "no install step" is distinguishable from "unfinished
      // record" — the distinction the `none` flag exists for.
      install: { none: true },
      invoke: { shell: "bun run beans:fallback", manual: true },
      io: {
        inputs: [
          { name: "id", schema: t("BeanId"), required: false, arg: { positional: 0 } },
          { name: "status", schema: t("BeanStatus"), required: false, arg: { flag: "--status" } },
          { name: "body", schema: t("Markdown"), required: false, arg: { stdin: true } },
        ],
        outputs: [{ name: "bean", schema: t("BeanId") }],
      },
      // The SAME six skills as beans-cli. That is the point of the pair: an
      // agent in a fresh container with no `beans` on PATH must still find a
      // mechanism, which is the 2026-09-18 failure where a session read the
      // plan and touched nothing.
      satisfies: [
        "bean-coordination", "todo-manager", "pending-show",
        "session-intent", "continual-progress", "idle-backlog",
      ],
      alternativeTo: ["beans-cli"],
      selection: {
        when:
          "When the CLI is not installed and cannot be — not a rare case: a fresh container has no `beans` on PATH. Equal standing, not a degraded mode. An agent that knows only the CLI reads the plan and touches nothing, which is exactly the 2026-09-18 session that completed two merged PRs' worth of durable work UNCLAIMED.",
        limits:
          "Titles and statuses only. It cannot say what an item is, what it depends on, or what it waits on — enough to CLAIM and to record, not enough to CHOOSE. Install `beans-cli` when the choice is the point.",
        cost:
          "None. The store is files in the repository, so this needs a filesystem and nothing else — which is also why it is the arm that survives an air-gapped or sovereign-compute instance.",
      },
      requires: { network: false },
    }),

    // ── The ingest pair ────────────────────────────────────────────────
    //
    // Two Tools, one skill, deliberately. `library-ingestion` states the
    // capability; these are the two mechanisms, and which one an agent can
    // use is a fact about the MACHINE rather than about the document.
    //
    // The split is not stdlib-for-its-own-sake. It is where the dependency
    // boundary actually falls: reading a zip's central directory, sniffing
    // magic bytes and parsing an xlsx's XML are all in the Python standard
    // library, while rendering a PDF's text layer is not and never will be.
    // Measured 2026-09-19: reaching a working image extractor in a bare
    // container took three installs (`pypdf`, then `cffi` — whose absence
    // makes `cryptography` panic under pyo3 on IMPORT — then `Pillow`).
    //
    // Bean `68dt` asked whether to declare Python dependencies and install
    // them in CI. This reframes it: the dependency posture becomes a property
    // of a named Tool that an agent can read, instead of a repository-wide
    // yes/no nobody can see from a skill.
    defineTool({
      id: "ingest-stdlib",
      title: "Ingest, standard library only",
      description:
        "Ingest an upload into `library/` using only the Python standard library — archive listings, CSV and spreadsheet records, technical file metadata, and the content sniff that routes a file to its rung.",
      // Nothing to install: `zipfile`, `tarfile`, `csv`, `xml.etree` and
      // `hashlib` ship with Python. Stated, so "needs nothing" is
      // distinguishable from an unfinished record.
      install: { none: true },
      invoke: { shell: "bun run scripts/ingest-document.ts" },
      requires: { runtime: ["python3"], network: false },
      io: {
        inputs: [
          { name: "file", schema: t("RepoPath"), required: true, arg: { positional: 0 }, description: "The upload to ingest, under the declared `uploads` graph." },
          { name: "outdir", schema: t("RepoPath"), required: false, arg: { flag: "--outdir" }, description: "Library root; defaults to the declared `library` graph." },
          { name: "dryRun", schema: t("Flag"), required: false, arg: { flag: "--dry-run" }, description: "Report the chosen rung and stop." },
        ],
        outputs: [{ name: "slug", schema: t("Slug"), description: "The library entry written." }],
      },
      satisfies: ["library-ingestion"],
      alternativeTo: ["ingest-extended"],
      selection: {
        when:
          "Reach for this first, and in CI always. It is the only one of the pair that runs where nothing has been installed — which is every fresh container and every CI job here, since the workflow installs `ruff` and nothing else. It covers archives, CSV and spreadsheets, technical metadata, and the sniff that decides which rung a file takes, including the OOXML/ODF container check that stops a workbook being listed as a bag of XML parts.",
        limits:
          "It cannot read a PDF. Text layer, embedded outline, page rendering, OCR and image extraction all need a backend it deliberately does not have, so a PDF routes to `undetermined` and is REFUSED rather than half-ingested. `ingest-extended` is the sibling that does those.",
        cost:
          "None beyond `python3` itself. No wheels, no C toolchain, no network, nothing to keep current, and no CI minutes spent installing.",
      },
    }),

    defineTool({
      id: "ingest-extended",
      title: "Ingest, with PDF and image extensions",
      description:
        "Ingest a PDF into `library/` — embedded outline, page text, OCR for scans, and image extraction — using PyMuPDF, tesseract and pypdf with Pillow.",
      // The requirements file, NOT a pip line spelled out here. That line was
      // a second spelling of `schemas/python-deps.ts` and would have drifted
      // from it — it already omitted `cryptography`, which the declaration's
      // own checker caught. `requirements.txt` is generated from the
      // declaration; the apt packages are not pip-installable and stay named.
      install: { cli: "pip install -r requirements.txt -r requirements-extended.txt && apt-get install -y tesseract-ocr poppler-utils" },
      invoke: { shell: "bun run scripts/ingest-document.ts" },
      requires: { runtime: ["python3", "pymupdf", "tesseract"], network: false },
      io: {
        inputs: [
          { name: "file", schema: t("RepoPath"), required: true, arg: { positional: 0 }, description: "The PDF to ingest, under the declared `uploads` graph." },
          { name: "outdir", schema: t("RepoPath"), required: false, arg: { flag: "--outdir" } },
          { name: "dryRun", schema: t("Flag"), required: false, arg: { flag: "--dry-run" } },
        ],
        outputs: [{ name: "slug", schema: t("Slug"), description: "The library entry written." }],
      },
      satisfies: ["library-ingestion"],
      alternativeTo: ["ingest-stdlib"],
      selection: {
        when:
          "Reach for this when the upload is a PDF and you need its CONTENT — an outline-bearing document read at chapter granularity, a text-layer document read at page granularity, or a scan that must be OCR'd first. Confirm the backend is present before relying on it: `bun run src/index.ts --check-deps`, or simply run the pair's entry point, which reports `no PDF backend` rather than guessing.",
        limits:
          "It adds nothing for archives, spreadsheets or metadata — `ingest-stdlib` already does those, and does them where this cannot run. Its PDF rungs ARE testable in CI as of `68dt`, which installs the lean set; the table rung (`pdf-tables.py`, camelot) is the one part that still is not, and anything gated on THAT remains a path CI cannot exercise — the `5rfy` defect.",
        cost:
          "Measured 2026-09-20: the lean set is 144 MB and CI installs it, so the PDF rungs ARE exercised there now. `camelot-py` for `pdf-tables.py` is the part CI still skips — 912 KB itself, but 323 MB with numpy, pandas and OpenCV, more than the whole lean set. The dependencies are not independent either: `pypdf` image extraction needs `Pillow`, and `cryptography` panics under pyo3 on IMPORT when `cffi` is missing. All of it is declared in `schemas/python-deps.ts`, so the cost is read rather than rediscovered.",
      },
    }),

    defineTool({
      id: "github",
      title: "GitHub",
      description:
        "Open and drive change proposals on GitHub — branches, pull requests, reviews, checks. One forge among possible others; the skills it satisfies name none.",
      install: { cli: "gh" },
      invoke: {
        shell: "gh",
        // An MCP arm exists where a server is mounted, but it is never the only
        // one: the harness runs `shell`.
        mcp: { tool: "mcp__github__*" },
      },
      io: {
        inputs: [
          { name: "branch", schema: t("Branch"), required: false, arg: { flag: "--head" } },
          { name: "number", schema: t("ChangeProposalNumber"), required: false, arg: { positional: 0 } },
          // Free prose is NOT a command-line word. `gh` takes it as
          // `--body-file -`, which is why `stdin` exists as an arg kind.
          { name: "body", schema: t("Markdown"), required: false, arg: { stdin: true } },
        ],
        outputs: [{ name: "url", schema: t("Url"), description: "The change proposal or comment created." }],
      },
      satisfies: ["prepare-merge-auto", "pickup", "watch", "coordinate"],
      requires: { network: true },
    }),

    defineTool({
      id: "pages-publish",
      title: "GitHub Pages publish",
      description:
        "Push a built directory to the `gh-pages` branch, where it is served. How the knowledge graph and its schema reach a URL.",
      install: { none: true },
      invoke: { shell: ".github/workflows/docs-site.yml" },
      io: {
        inputs: [
          { name: "directory", schema: t("RepoPath"), required: true, arg: { positional: 0 }, description: "The built tree to publish." },
          { name: "baseUrl", schema: t("Url"), required: false, arg: { flag: "--base-url" }, description: "Publication base; a preview passes its own." },
        ],
        outputs: [{ name: "url", schema: t("Url"), description: "Where the tree is served." }],
      },
      satisfies: ["kg-export"],
      requires: { network: true },
    }),

    // ── The other publication host ────────────────────────────────────────
    //
    // `pages-publish` above is one value of the `publication host` axis in
    // `docs/proposals/deployment-topologies.md`. Four topologies in #363 do
    // not have it at all — local git only, private repo, developer and
    // self-sovereign — and before this node they had no publication
    // mechanism, only a skill saying what one would have to do.
    //
    // ONE tool here, not two, and that is a retreat from this bean's own
    // plan. `0hi8` said two implementations, because one is an assertion and
    // two is a demonstration — the argument `4dbr` makes about a second
    // forge. It still holds. But the obvious second candidate is a generic
    // static server, and it does NOT satisfy `compound-extension-wins`:
    // every OS table resolves `.schema.json` to `application/json`. Caddy
    // configured per-path would satisfy it and is not installed here, so
    // declaring it would be asserting conformance nobody measured. Left
    // open on the bean rather than claimed.
    defineTool({
      id: "serve-rendering",
      title: "Local rendering server",
      description:
        "Serve an instance's renderings over local HTTP with their declared media types. The publication host wherever GitHub Pages is absent, and the only host that can enforce `application/ld+json` at all.",
      install: { none: true },
      invoke: { shell: "bun run serve:rendering" },
      io: {
        inputs: [
          { name: "directory", schema: t("RepoPath"), required: false, arg: { flag: "--dir" }, description: "Tree to serve; defaults to the built site when present." },
          { name: "port", schema: t("Port"), required: false, arg: { flag: "--port" }, description: "0 binds a free port, which is what the tests use." },
        ],
        outputs: [{ name: "url", schema: t("Url"), description: "Where the tree is being served." }],
      },
      satisfies: ["serving-renderings"],
      // No network: it BINDS one, it does not reach out. `requires.network`
      // means "needs egress", and conflating the two would mark this
      // unavailable on exactly the air-gapped topology it exists for.
      requires: { runtime: ["bun"], network: false },
    }),

    // ── Running the checks CI runs ────────────────────────────────────────
    //
    // `tools/` is an INHERITED declaration and `.github/workflows/` is not:
    // a downstream instance gets this node and none of the gates it names.
    // That asymmetry is the whole business case for the node.
    defineTool({
      id: "gates",
      title: "The platform's quality gates",
      description:
        "Run the checks CI runs, derived from the workflow rather than listed here. One Tool for all of them, not one per gate: the list is computed from `.github/workflows/code-quality-gates.yml` at call time, so it cannot drift from what CI actually enforces.",
      install: { none: true },
      invoke: { shell: "bun run gates" },
      io: {
        inputs: [
          { name: "all", schema: t("Flag"), required: false, arg: { flag: "--all" }, description: "Add the jobs that need a browser; the default is the fast set." },
          { name: "list", schema: t("Flag"), required: false, arg: { flag: "--list" }, description: "Print the derived gates and exit, running none." },
        ],
        outputs: [{ name: "report", schema: t("Text"), description: "One line per gate, then a pass count or the failures. Exit non-zero on any failure." }],
      },
      // ONE node, and that is the design rather than a shortcut — bean
      // `folio-assistant-ppkm`, route B of `folio-assistant-3lbz`.
      //
      // The obvious reading of "bind the gates as Tool nodes" is one node per
      // gate. The audit that proposed route B named the cost of that itself:
      // the Tool list becomes A SECOND ANSWER to "what are the gates", free
      // to disagree with `gates.ts` the moment either changes. `gates.ts`
      // derives the list from the workflow, so 43 hand-written nodes would be
      // 43 copies of a fact that is already computed.
      //
      // Two further reasons, both measured. `Gate` carries `{ job, step,
      // command }` and NO skill binding, so each of the 43 would need an
      // invented `satisfies:` — 43 judgements, none derived from anything.
      // And route A settled the same question one bean earlier, on the
      // owner's own instruction about Zod schemas: "a Tool per Zod schema...
      // no, but there should be common patterns (single pattern?) with some
      // parameters more or less".
      //
      // Per-gate discoverability is still reachable, and the way to get it is
      // to give `Gate` a declared skill in the workflow the list is derived
      // FROM — not to hand-maintain the nodes here.
      satisfies: ["platform-gates", "prepare-merge", "continual-progress"],
      requires: { runtime: ["bun"], network: false },
      selection: {
        when:
          "Before any push, and as the answer to \"what checks this?\". It matters most where CI is not: `tools/` is an INHERITED declaration and `.github/workflows/` is not, so a downstream instance gets this Tool and none of the gates it names. #363's self-sovereign topology has no CI at all.",
        limits:
          "It runs what the workflow declares, so a check CI does not run is a check this does not run — that is the point, not a gap. The default omits the browser jobs; `--all` adds them, and `render:bpmn:check` needs Chromium.",
        cost: "The fast set is about a minute, dominated by `bun test`. `--all` adds a browser render.",
      },
    }),

    // ── The zod modules that maintain this instance's public schemas ──────
    //
    // The owner's requirement: "the zod(.ts) should be tool KG nodes that
    // implement maintaining a json-ld/json schema for public authoritative".
    // Each of these three IS the definition of an artefact the instance
    // publishes, and until now that relation lived only in a local array
    // inside `scripts/harness-schema-export.ts`.
    //
    // They satisfy `kg-export`, the skill that covers rendering the instance's
    // own graph and schemas. `invoke.shell` is the command that regenerates
    // them, so the node says how to exercise it rather than only what it is.
    defineTool({
      id: "kg-validate",
      title: "Validate a node in the graph",
      description:
        "Check one file against the schema for its graph kind. ONE tool rather than one per schema: the declaration already says which directory holds which kind, so the kind is the parameter and the lookup does the rest.",
      install: { none: true },
      invoke: { shell: "bun run kg:validate" },
      io: {
        inputs: [
          { name: "path", schema: t("RepoPath"), required: true, arg: { positional: 0 }, description: "The node to check. Its graph kind is resolved from the declared directory that contains it." },
          { name: "lenient", schema: t("Flag"), required: false, arg: { flag: "--lenient" }, description: "Accept partial coverage knowingly: downgrade could-not-determine from an error to a warning." },
        ],
        // `Text`, not a bespoke verdict type: the tool's answer is the exit
        // code plus one line per file, and minting a type for "three states
        // and a reason" would be a vocabulary entry with one user.
        outputs: [{ name: "report", schema: t("Text"), description: "One line per file — valid, invalid with the failing paths, or could-not-determine with the reason. Exit 0 valid, 1 invalid or undetermined, 2 misuse." }],
      },
      // The FIRST tool bound to this skill. Measured 2026-09-20: of ten Tool
      // nodes, none validated anything and none named `kg-navigation`, while
      // 199 Zod schemas sat unreachable from the graph (bean `3lbz`).
      satisfies: ["kg-navigation"],
      requires: { runtime: ["bun"], network: false },
      selection: {
        when:
          "Whenever a node's shape matters and you are not in this repository's CI. That is the case the tool exists for: `tools/` is an INHERITED declaration and `.github/workflows/` is not, so a downstream instance gets this and gets none of the 41 gates. #363's self-sovereign topology has no CI to inherit from at all.",
        limits:
          "It can only check a kind that declares a validator — 2 of 16 today, so most nodes come back UNDETERMINED and it exits non-zero saying so. That is the honest state rather than a gap to paper over: `qa`, the largest generated graph here, has no Zod schema anywhere. `bun run check:kind-validators` reports the coverage.",
        cost: "One module import per kind. Nothing to install, no network.",
      },
    }),

    defineTool({
      id: "cat-harness-schema",
      title: "Instance declaration schema",
      description:
        "The zod definition of `harness.json` — what an instance may declare about itself — and the published JSON Schema generated from it.",
      install: { none: true },
      invoke: { shell: "bun run kg:schema" },
      io: {
        inputs: [
          { name: "baseUrl", schema: t("Url"), required: false, arg: { flag: "--base-url" }, description: "Publication base; a preview passes its own." },
        ],
        outputs: [{ name: "schema", schema: t("RepoPath"), description: "The written JSON Schema." }],
      },
      satisfies: ["kg-export"],
      maintains: [
        { source: "schemas/cat-harness.ts", artefact: `${stub()}.schema.json`, format: "json-schema" },
      ],
    }),

    defineTool({
      id: "tool-schema",
      title: "Tool node schema",
      description:
        "The zod definition of a Tool node — what `defineTool` accepts — and the published JSON Schema generated from it.",
      install: { none: true },
      invoke: { shell: "bun run kg:schema" },
      io: {
        inputs: [
          { name: "baseUrl", schema: t("Url"), required: false, arg: { flag: "--base-url" } },
        ],
        outputs: [{ name: "schema", schema: t("RepoPath") }],
      },
      satisfies: ["kg-export"],
      maintains: [{ source: "schemas/tool.ts", artefact: "tool.schema.json", format: "json-schema" }],
    }),

    defineTool({
      id: "tool-types-schema",
      title: "Tool I/O type vocabulary",
      description:
        "The zod definitions of the shared types a Tool's inputs and outputs reference by IRI, and the published JSON Schema whose `$defs` those IRIs point into.",
      install: { none: true },
      invoke: { shell: "bun run kg:schema" },
      io: {
        inputs: [
          { name: "baseUrl", schema: t("Url"), required: false, arg: { flag: "--base-url" } },
        ],
        outputs: [{ name: "schema", schema: t("RepoPath") }],
      },
      satisfies: ["kg-export"],
      maintains: [
        { source: "schemas/tool-types.ts", artefact: "tool-types.schema.json", format: "json-schema" },
      ],
    }),

    // ── Logging ────────────────────────────────────────────────────────
    //
    // Declared HERE although the skill and the sub-process it serves live in
    // `bootstrap/`, and that is a limitation rather than a decision. Tool
    // collection is import-bound — `tools/index.ts` merges what it imports —
    // so a Tool node contributed by a nested instance is not reachable from
    // the barrel yet. Bean `gn4l`. When it is, this node moves to
    // `bootstrap/tools/` unchanged, and nothing that references it by id
    // notices.
    defineTool({
      id: "log-message",
      title: "Log a message to the discussion",
      description:
        "Write a log line where the human actor will read it: the discussion you are already in. Takes the five required fields and the optional body, and renders them as one entry.",
      // The destination is a conversation. There is nothing to install and
      // there could not be — that is the property that makes it the arm an
      // Initiator can always reach.
      install: { none: true },
      // `manual`, and honestly so. The agent composes the entry and sends it;
      // no command runs. Modelling it as an absent `shell` would have made it
      // indistinguishable from an unfinished record — the distinction
      // `beans-manual` established.
      invoke: { manual: true },
      io: {
        // No `arg` on any input: a manual Tool has no command line, so the
        // inputs are the contract rather than argv. That is also why `actor`
        // and `message` may be `Text` and `body` may be `Markdown` here —
        // injection-safety constrains command-line WORDS, and there are none.
        inputs: [
          { name: "timestamp", schema: t("Timestamp"), required: true, description: "When it happened, as an ISO-8601 UTC instant." },
          { name: "actor", schema: t("Text"), required: true, description: "WHO acted. Never the Logger: it receives and records, so it cannot know." },
          { name: "process", schema: t("ProcessId"), required: true, description: "The process the actor was inside, e.g. initialize-harness." },
          { name: "task", schema: t("NodeId"), required: true, description: "The step within it, e.g. A_Install." },
          { name: "message", schema: t("Text"), required: true, description: "What happened, in the one line somebody scanning will read." },
          { name: "body", schema: t("Markdown"), required: false, description: "The detail — a diff, an error, what was not where it should have been." },
        ],
        // The entry as rendered, so a caller can quote what it actually wrote
        // rather than reconstructing it from the six fields.
        outputs: [{ name: "entry", schema: t("Markdown"), description: "The entry as posted." }],
      },
      satisfies: ["log-message"],
      requires: { network: false },
    }),

    // The twenty tools this instance already serves over MCP. Kept in a sibling
    // module because they are a MIGRATION of an existing surface rather than
    // hand-authored nodes: they are regenerable from `bun run mcp:capture`, and
    // mixing them in here would blur which of the two a reader is looking at.
    ...mcpTools(t),
  ];
}
