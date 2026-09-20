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

import { defineTool, type ToolDefinition } from "../../schemas/tool.js";
import { toolTypeIri } from "../../schemas/tool-types.js";
import { mcpTools } from "./mcp.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

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
      install: { cli: "pip install pymupdf pypdf pillow && apt-get install -y tesseract-ocr poppler-utils" },
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
          "It adds nothing for archives, spreadsheets or metadata — `ingest-stdlib` already does those, and does them where this cannot run. It is also NOT available in CI here, so anything gated on it is a path CI cannot test, which is the `5rfy` defect (a gate that never fires).",
        cost:
          "Three installs and a system package, and they are not independent: `pypdf` image extraction needs `Pillow`, and `cryptography` panics under pyo3 on import when `cffi` is missing. Measured 2026-09-19 in this container. Add CI minutes on every run if it is ever installed there, and a toolchain to keep current.",
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

    // The twenty tools this instance already serves over MCP. Kept in a sibling
    // module because they are a MIGRATION of an existing surface rather than
    // hand-authored nodes: they are regenerable from `bun run mcp:capture`, and
    // mixing them in here would blur which of the two a reader is looking at.
    ...mcpTools(t),
  ];
}
