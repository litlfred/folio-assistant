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

    // ── The export itself, which five nodes claimed and none performed ────
    //
    // `kg-export` was already `satisfies`-covered FIVE times over —
    // `pages-publish`, `serve-rendering` and the three schema carriers below —
    // and not one of them runs an export. `pages-publish` publishes a built
    // directory; `serve-rendering` serves one; the carriers regenerate JSON
    // Schemas through `kg:schema`. The command that builds the graph rendering
    // in the first place, `bun run kg:export`, was reachable from no node.
    //
    // That is worth a comment rather than a silent addition, because
    // `check:tools` reported this skill as covered throughout and was right to:
    // coverage is a relation between a Tool and a SKILL, and a skill can be
    // satisfied by neighbours of its mechanism. Found 2026-09-20 while working
    // bean `d308`, whose whole premise is that code with no node is invisible
    // even when its skill looks served. This node is that premise's first
    // instance in the graph rather than in a bean.
    defineTool({
      id: "kg-graph-export",
      title: "Knowledge-graph export",
      description:
        "Dump this instance's knowledge graph — skills, BPMN activities and their lanes, roles, actors, directories — to one JSON-LD document for publication. The export is data; something else draws it.",
      install: { none: true },
      invoke: { shell: "bun run kg:export" },
      io: {
        inputs: [
          // The script reads `KG_BASE_URL` when the flag is absent, and falls
          // back to `harness.json`'s `canonicalUrl`. Declared as the flag
          // because that is the arm a caller controls; the other two are
          // defaults, not inputs.
          { name: "baseUrl", schema: t("Url"), required: false, arg: { flag: "--base-url" }, description: "Publication base the node IRIs are minted against; a preview passes its own." },
          { name: "out", schema: t("RepoPath"), required: false, arg: { flag: "--out" }, description: "Where to write; defaults to `_kg/<stub>.jsonld`, which is build output and gitignored." },
        ],
        outputs: [
          { name: "graph", schema: t("RepoPath"), description: "The written JSON-LD document." },
          // A source that cannot be read is reported and counted, never
          // dropped — the script's own three-state rule, and it belongs in the
          // contract rather than only in its header. An export that quietly
          // omits half a corpus looks well-formed to a consumer, which is bean
          // `dh4f`.
          { name: "problems", schema: t("Text"), description: "Sources that could not be read, counted rather than silently omitted." },
        ],
      },
      satisfies: ["kg-export"],
      // No `alternativeTo`, deliberately. The four siblings sharing this skill
      // are COMPLEMENTARY steps — export, then publish, then serve — not four
      // ways to do one thing, and the schema's own note on that field says a
      // rule keyed on "shares a skill" would demand comparative prose where
      // there is nothing to compare. Exactly one pair in this instance is
      // genuinely substitutable, and it is `beans-cli` / `beans-manual`.
      requires: { runtime: ["bun"], network: false },
    }),

    // ── The site's visual assets, which had no SKILL until 2026-09-20 ─────
    //
    // These two were blocked rather than missing. Both are committed, published,
    // single-file artefacts — the exact shape `maintains` exists for — and
    // neither could be declared, because `satisfies` requires a skill and no
    // skill stated the capability. `kg-export` serializes the graph to JSON;
    // `rendering-auditor` audits a content block's visual output; neither is
    // "render the graph's asset nodes into the site's stylesheets".
    //
    // That is the THIRD mismatch in `covered-is-not-reachable`: a mechanism with
    // no skill, invisible to `tools:coverage` by construction because it
    // enumerates skills and asks which lack Tools. The skill was authored first,
    // on the owner's decision (bean `yean`), and deliberately names no script —
    // a skill written to give a command somewhere to point is a Tool with front
    // matter that passes every check and teaches nothing.
    //
    // They are siblings rather than alternatives: one renders theme tokens and
    // the other avatar glyphs, and a caller wanting either is not served by the
    // other.
    defineTool({
      id: "themes-css",
      title: "Theme stylesheet",
      description:
        "Render the declared theme nodes into the stylesheet the site serves. The nodes are the source: a colour has one home, and light and dark are two valuations of one token set rather than two hand-kept blocks.",
      install: { none: true },
      invoke: { shell: "bun run themes:css" },
      io: {
        inputs: [
          { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Compare against the committed copy and fail if stale, instead of writing." },
        ],
        outputs: [{ name: "stylesheet", schema: t("RepoPath"), description: "The generated stylesheet. Build output that happens to be committed, so it is readable on the forge — never hand-edited." }],
      },
      satisfies: ["site-presentation-assets"],
      maintains: [
        { source: "schemas/themes.ts", artefact: "assets/css/themes.css", format: "css" },
      ],
      requires: { runtime: ["bun"], network: false },
    }),

    defineTool({
      id: "avatars-css",
      title: "Avatar stylesheet",
      description:
        "Render the declared avatar nodes — an actor's glyph and colours, including the overlay states — into the stylesheet the site serves.",
      install: { none: true },
      invoke: { shell: "bun run avatars:css" },
      io: {
        inputs: [
          { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Compare against the committed copy and fail if stale, instead of writing." },
        ],
        outputs: [{ name: "stylesheet", schema: t("RepoPath"), description: "The generated stylesheet. Never hand-edited." }],
      },
      satisfies: ["site-presentation-assets"],
      maintains: [
        { source: "schemas/avatars.ts", artefact: "assets/css/avatars.css", format: "css" },
      ],
      requires: { runtime: ["bun"], network: false },
    }),

    // ── The generated reference, which `docs-generation` did not reach ────
    //
    // `docs-generation` was already covered — by `readme-audit` and
    // `readme-sync`, which maintain a README's generated SECTIONS. Neither
    // generates a page of the documentation site, and the two generators that do
    // were reachable from no node.
    //
    // That is the THIRD instance of one shape in this session: a skill satisfied
    // by the neighbours of its mechanism while the mechanism stays invisible.
    // `kg-export` was the first (five nodes, none performing an export) and this
    // is the second and third. It is worth naming as a pattern rather than
    // recording three times as a coincidence — `check:tools` answers "does this
    // skill have a Tool", and nothing yet answers "is this command reachable",
    // which is bean `d308`.
    //
    // Neither carries `maintains`, and that is a judgement not an omission. Each
    // writes ONE PAGE PER SUBJECT plus an index — tens of files — and
    // `maintains.artefact` is a single path. A declaration naming one page out of
    // tens would be false in the specific way that is worse than absent: it would
    // look like a complete provenance record.
    defineTool({
      id: "schema-docs",
      title: "Skill contract reference",
      description:
        "Render each skill's input/output JSON Schema as a browsable Markdown reference page, with an index. The generated pages are committed so they are readable on the forge as well as on the site.",
      install: { none: true },
      invoke: { shell: "bun run scripts/gen-schema-docs.ts" },
      io: {
        inputs: [
          { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Compare against the committed pages and fail if stale, instead of writing." },
        ],
        outputs: [{ name: "pages", schema: t("RepoPath"), description: "The generated reference directory. Never hand-edited." }],
      },
      satisfies: ["docs-generation"],
      requires: { runtime: ["bun"], network: false },
    }),

    defineTool({
      id: "skill-docs",
      title: "Skill instruction reference",
      description:
        "Render the skill instruction bodies — the prose an agent actually loads — as browsable pages with an index, so a reader can see what an agent is told without cloning the repository.",
      install: { none: true },
      invoke: { shell: "bun run scripts/gen-skill-docs.ts" },
      io: {
        inputs: [
          { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Compare against the committed pages and fail if stale, instead of writing." },
        ],
        outputs: [{ name: "pages", schema: t("RepoPath"), description: "The generated instruction directory. Never hand-edited." }],
      },
      // Sibling of `schema-docs`, not an alternative to it: one renders a
      // skill's CONTRACT and the other its INSTRUCTIONS, and a reader wanting
      // either is not served by the other. Complementary, so no
      // `alternativeTo` — the field's own note warns against deriving that
      // relation from a shared skill.
      satisfies: ["docs-generation"],
      requires: { runtime: ["bun"], network: false },
    }),

    // ── The two JSON-LD artefacts a consumer dereferences ─────────────────
    //
    // Both are `maintains` nodes in the same sense as the three zod carriers
    // below, and they were missing for the same reason those were: the relation
    // between a source module and the public document it keeps true lived in a
    // `package.json` script and nowhere a tool could read it.
    //
    // They are separate nodes because they answer different questions. A
    // consumer that meets `folio:Actor` needs the VOCABULARY to learn what it
    // means; a consumer parsing a block needs the CONTEXT to expand its keys.
    // One document cannot be both: `<base>/ns` has to be a directory for
    // `ns/content/v1.jsonld` to sit under it, which is why the vocabulary is
    // `ns/vocabulary.jsonld` and not `ns` itself.
    defineTool({
      id: "ns-vocabulary",
      title: "Namespace vocabulary",
      description:
        "Emit the folio namespace as a document that dereferences — one node per class and property, each with an @id, a type, a label and a definition, so a consumer holding only the JSON-LD can resolve any term it meets.",
      install: { none: true },
      invoke: { shell: "bun run ns:export" },
      io: {
        inputs: [
          { name: "layer", schema: t("NamespaceLayer"), required: false, arg: { flag: "--layer" }, description: "Emit one namespace layer — `bootstrap` for the layer that must resolve before anything else does." },
          { name: "out", schema: t("RepoPath"), required: false, arg: { flag: "--out" }, description: "Where to write; defaults under `_kg/`, which is build output." },
        ],
        outputs: [{ name: "vocabulary", schema: t("RepoPath"), description: "The written namespace document." }],
      },
      satisfies: ["kg-export"],
      // The PRIMARY job is the graph documenting itself — the owner's
      // correction, 2026-09-19, and the order matters. That `--check` also lets
      // CI assert every minted term is defined is a second use of one artefact,
      // not the reason it exists. Stated here because a node whose description
      // led with "conformance test" would invert that and invite someone to
      // drop the document once CI was satisfied another way.
      maintains: [
        { source: "schemas/vocabulary.ts", artefact: "ns/vocabulary.jsonld", format: "json-ld" },
      ],
      requires: { runtime: ["bun"], network: false },
    }),

    defineTool({
      id: "content-context",
      title: "Content JSON-LD context",
      description:
        "Emit the published JSON-LD `@context` that both populations share — authored block siblings and ingested `library/**` nodes reference it by URL — generated from its TypeScript definition rather than hand-kept.",
      install: { none: true },
      invoke: { shell: "bun run scripts/gen-jsonld-context.ts" },
      io: {
        inputs: [
          // `--check` is the CI arm: it compares against the committed copy and
          // fails rather than writing, like every other generated file here.
          { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Compare against the committed copy and fail if stale, instead of writing." },
        ],
        outputs: [{ name: "context", schema: t("RepoPath"), description: "`ns/content/v1.jsonld`, the document served at CONTENT_CONTEXT_URL." }],
      },
      satisfies: ["kg-export"],
      // Load-bearing and currently LOSSY, which is bean `ovkk`: the @context
      // declares fewer terms than the graph uses, so a conforming JSON-LD
      // processor silently drops the property occurrences it cannot expand.
      // A node here does not fix that. It makes the artefact's source
      // addressable, which is what a fix has to start from — and it is why this
      // node is worth having before the gap is closed rather than after.
      maintains: [
        { source: "schemas/jsonld.ts", artefact: "ns/content/v1.jsonld", format: "json-ld" },
      ],
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
