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

    // ── The TeX checks, and the SECOND authoring skill with no mechanism ──
    //
    // `latex-authoring` is not satisfied here, and the reason is now a pattern
    // rather than an accident. Its contract requires `documentClass` and
    // `mainFile` — what you are AUTHORING. Nothing in the corpus accepts either:
    // `generate-main-tex` takes `--preamble`, `--chapters-dir` and `--out`.
    //
    // That is the same shape as `proof-verification` one group over, whose
    // contract requires `projectRoot` and finds no taker. **Authoring skills
    // name the artefact you are creating; the corpus has checking mechanisms.**
    // Two instances make it worth stating: a contract written from the authoring
    // side does not become satisfiable by pointing a checker at it, and forcing
    // the edge would make the node lie about its interface. Recorded on `jh2j`.
    //
    // These two satisfy `latex-validation`, which matches them exactly —
    // "validate LaTeX source files for syntactic correctness, structural
    // consistency, and adherence to project conventions" — and has no contract
    // to contradict. Complementary rather than alternative: one stops a compile
    // from failing, the other reports a defect in a compile that succeeded.
    defineTool({
      id: "latex-preflight",
      title: "LaTeX preflight",
      description:
        "Lint TeX source for the pdflatex-compile failure classes a permissive AST parser accepts — the ones that pass validation and then break the build.",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/content/pipeline/latex-preflight.ts" },
      io: {
        inputs: [
          { name: "json", schema: t("Flag"), required: false, arg: { flag: "--json" } },
          { name: "warn", schema: t("Flag"), required: false, arg: { flag: "--warn" }, description: "Report without failing — for a corpus not yet clean." },
        ],
        outputs: [{ name: "findings", schema: t("Text"), description: "Compile-breaking hazards, located. A clean run here is not a successful compile; it is the absence of these classes." }],
      },
      satisfies: ["latex-validation"],
      // No TeX distribution needed: this reads source and never invokes pdflatex.
      // Stated because the sibling `latex-overfull` DOES need a build log, and a
      // caller would otherwise assume both have the same prerequisites.
      requires: { runtime: ["bun"], network: false },
    }),

    defineTool({
      id: "latex-overfull",
      title: "LaTeX overfull-box report",
      description:
        "Turn a pdflatex log's Overfull \\hbox warnings into a located, actionable report, with a threshold so a long tail of trivial overruns does not bury the real ones.",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/content/pipeline/latex-overfull-report.ts" },
      io: {
        inputs: [
          // REQUIRED and positional — found by running it, not by reading it:
          // `usage: latex-overfull-report.ts <main.log> [--min N] …`. The first
          // draft of this node declared only the flags, which would have told a
          // caller the log was optional and sent them to a usage error.
          { name: "log", schema: t("RepoPath"), required: true, arg: { positional: 0 }, description: "The pdflatex log to read. Nothing to read means no answer, not a pass." },
          { name: "min", schema: t("Dpi"), required: false, arg: { flag: "--min" }, description: "Ignore overruns below this size — the long tail is noise, and reporting it hides the rest." },
          { name: "max", schema: t("Dpi"), required: false, arg: { flag: "--max" }, description: "Fail above this count, for use as a gate." },
          { name: "json", schema: t("Flag"), required: false, arg: { flag: "--json" } },
        ],
        outputs: [{ name: "report", schema: t("Text"), description: "Located overfull boxes. Requires a build log: with no log there is nothing to read, which is could-not-determine rather than clean." }],
      },
      satisfies: ["latex-validation"],
      // Reads a pdflatex LOG, so it needs a build to have happened — not a TeX
      // distribution of its own. The distinction matters to a caller deciding
      // whether to run it: no log means no answer, not a pass.
      requires: { runtime: ["bun"], network: false },
    }),

    // ── The Lean family, which is a FAMILY and not one command ────────────
    //
    // Bean `eu38` wrote the caution before the work: 16 entry points spanning
    // setup, build, cache and audit is not one command with modes, and forcing
    // them into one node would produce exactly the invoke-a-string-and-hope node
    // the schema refuses elsewhere. The inventory bore that out — four concerns,
    // and all eight candidate skills exist and are uncovered.
    //
    // Three are declared here. The audit half — `proof-verification`,
    // `lean-completeness-audit`, `lean-proof-vacuity-audit` — stays on the bean
    // rather than being guessed at in the same commit.
    //
    // ## None of these can be EXERCISED in this repository
    //
    // The platform carries no folio, and no Lean toolchain is installed here, so
    // what was verified is the CONTRACT — `satisfies` resolves and agrees with
    // each skill's own I/O contract, every io type is declared, every argv input
    // is injection-safe. The mechanism is verified downstream, in a folio.
    // `requires.runtime` says so rather than leaving a caller to find out, which
    // is the posture bean `h588` established for FHIR and which turns out to be
    // the general case for six of the thirteen groups in `d308`.
    defineTool({
      id: "lean-build",
      title: "Lean build",
      description:
        "Build every Lean project in the workspace from the root Lake manifest, so cross-package dependencies resolve against it rather than a possibly-stale per-paper manifest. Writes a committable build-status sidecar every run.",
      install: { none: true },
      invoke: { shell: "scripts/lean-build-all.sh" },
      io: {
        inputs: [
          { name: "paper", schema: t("Slug"), required: false, arg: { flag: "--paper" }, description: "Build one paper instead of all of them." },
          { name: "cache", schema: t("Flag"), required: false, arg: { flag: "--cache" }, description: "Fetch the Mathlib cache first. A from-source Mathlib build is 30–60 minutes against ~2 for a restore." },
          { name: "update", schema: t("Flag"), required: false, arg: { flag: "--update" }, description: "Run `lake update` before building." },
          { name: "logDir", schema: t("RepoPath"), required: false, arg: { flag: "--log-dir" }, description: "Where logs and the status sidecar go." },
        ],
        outputs: [
          { name: "status", schema: t("RepoPath"), description: "`lean-build-status.json` — committable, so a green build is distinguishable from one nobody ran." },
        ],
      },
      // NOT `lean-formalization`, and NOT `proof-verification`. Both read right
      // and `check:tools` refused both, on the skills' own I/O contracts:
      //
      // - `lean-formalization` requires `sourceFile` and `targetModule`, because
      //   it formalises A CLAIM into A MODULE. Building the workspace is not that.
      // - `proof-verification` requires `projectRoot`. This script DISCOVERS the
      //   root — it "can be invoked from any directory" and builds from the repo
      //   root so cross-package deps resolve against the root manifest — so
      //   declaring a `projectRoot` input would make the node lie about its
      //   interface to satisfy a check.
      //
      // `lean-build-fix` is the honest one, and not merely because it has no
      // contract to contradict: it says it works by "parsing lake build output",
      // so a Tool that produces that output is one concrete way to exercise it.
      // It is the build half of that skill's loop, not the whole loop.
      satisfies: ["lean-build-fix"],
      requires: { runtime: ["bash", "lean", "lake"], network: true },
    }),

    defineTool({
      id: "lean-cache",
      title: "Lake olean cache",
      description:
        "Restore, verify, seed and diagnose the prebuilt `.lake/` artefacts for a Lean package. Always try `restore` first: a from-source Mathlib build is 30–60 minutes, a restore about two.",
      install: { none: true },
      invoke: { shell: "scripts/lake-cache.sh" },
      io: {
        inputs: [
          { name: "action", schema: t("LakeCacheAction"), required: true, arg: { positional: 0 }, description: "The verb. `doctor` exists because a restore that silently missed used to look exactly like one that worked." },
          { name: "lakeRoot", schema: t("RepoPath"), required: false, arg: { flag: "--lake-root" }, description: "The package whose `.lake/` is acted on." },
          { name: "package", schema: t("PackageName"), required: false, arg: { flag: "--package" } },
        ],
        outputs: [{ name: "result", schema: t("Text"), description: "A real hit, a miss, or a diagnosis — never a miss that reads as a hit." }],
      },
      satisfies: ["lean-cache-restore"],
      requires: { runtime: ["bash", "git", "lake"], network: true },
    }),

    defineTool({
      id: "lean-toolchain-setup",
      title: "Lean toolchain install",
      description:
        "Install the toolchain pinned in `lean-toolchain`, fetching it from the GitHub release rather than through elan's downloader. Idempotent, and it detects partial state rather than re-downloading.",
      // It IS the install step, so `install.cli` names itself: an agent that needs
      // Lean runs this, and `install.none` would say no step exists.
      install: { cli: "scripts/setup-lean-toolchain.sh" },
      invoke: { shell: "scripts/setup-lean-toolchain.sh" },
      io: {
        inputs: [],
        outputs: [{ name: "toolchain", schema: t("Text"), description: "The linked toolchain name, and the per-repo override that selects it." }],
      },
      satisfies: ["lean-environment-setup"],
      // Network, and a specific reason worth carrying: `release.lean-lang.org`
      // answers 403 "Host not in allowlist" from this container's network policy,
      // which is what breaks `elan toolchain install` and why this script exists
      // at all. An agent reading only `network: true` would retry elan.
      requires: { runtime: ["bash", "curl", "elan"], network: true },
    }),

    // ── The Lean audit half, and the one skill still without a mechanism ──
    //
    // `proof-verification` is NOT satisfied here, and that is a finding rather
    // than an omission. Its contract requires `projectRoot`, and nothing in this
    // corpus accepts one — the only root-shaped flag anywhere in the Lean scripts
    // is `--content-root`, which names where content BLOCKS live, not the Lean
    // package. Typing that as `projectRoot` would be the lie `lean-build` already
    // refused to tell. So the skill has an I/O contract and no mechanism that can
    // meet it; recorded on bean `eu38`.
    defineTool({
      id: "lean-coverage",
      title: "Lean coverage",
      description:
        "Count how many provable blocks — theorem, lemma, proposition, corollary — carry a full Lean proof rather than a sorry, per paper. The completeness half of the Lean audit: what is formalised, and what is still a gap.",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/scripts/lean-coverage.ts" },
      io: {
        inputs: [
          { name: "paper", schema: t("Slug"), required: false, arg: { flag: "--paper" }, description: "One paper instead of all." },
          { name: "contentRoot", schema: t("RepoPath"), required: false, arg: { flag: "--content-root" }, description: "Where content blocks live. NOT a Lean project root — see the note above this node." },
          { name: "json", schema: t("Flag"), required: false, arg: { flag: "--json" } },
          { name: "out", schema: t("RepoPath"), required: false, arg: { flag: "--out" } },
        ],
        outputs: [
          { name: "coverage", schema: t("Text"), description: "Provable blocks, and how many are sorry-free. A count, not a verdict: a sorry-free proof can still be vacuous, which is the sibling node's question." },
        ],
      },
      satisfies: ["lean-completeness-audit"],
      // Exits 1 in the platform repo, by design and with a good message: "papers
      // live in a folio. Run this from the content repo, or name a paper
      // explicitly." That is the script refusing rather than reporting a silent
      // empty result, and it is the behaviour to want.
      //
      // Written down because the refusal LOOKS like a broken `invoke` to anyone
      // who runs it here — and this node was nearly discarded on exactly that
      // reading, off a pipeline's exit code rather than the script's.
      requires: { runtime: ["bun"], network: false },
    }),

    defineTool({
      id: "lean-audit",
      title: "Lean vacuity audit",
      description:
        "Inspect Lean declarations chapter by chapter for proofs that type-check, are sorry-free and axiom-clean, and still carry no mathematical content — assuming what they claim, concluding something trivially true, or resting on a false premise.",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/scripts/lean-audit.ts" },
      io: {
        inputs: [
          { name: "chapter", schema: t("Slug"), required: false, arg: { flag: "--chapter" }, description: "One chapter instead of the whole corpus." },
          { name: "strict", schema: t("Flag"), required: false, arg: { flag: "--strict" } },
          { name: "checkAxioms", schema: t("Flag"), required: false, arg: { flag: "--check-axioms" }, description: "Axiom-cleanliness is a separate question from vacuity: a proof can be axiom-clean and still assume its conclusion." },
          { name: "json", schema: t("Flag"), required: false, arg: { flag: "--json" } },
        ],
        outputs: [
          { name: "findings", schema: t("Text"), description: "Sorry inventory and trivial-truth detections. Sibling of `lean-coverage`, not an alternative to it: that one COUNTS what is proved, this one asks whether a proof says anything." },
        ],
      },
      satisfies: ["lean-proof-vacuity-audit"],
      // Same refusal as its sibling in the platform repo, and for the same
      // reason: no folio, so no papers to audit. Exit 1 with an explanation.
      requires: { runtime: ["bun"], network: false },
    }),

    // ── The audits, which had no node while auditing the graph that holds ─
    //
    // `tool-coverage.ts` has said since 2026-09-18 that its tier A "is the list
    // to act on", and `kg-audit` writes the committed verdict for every node in
    // the graph. Neither was reachable by asking that graph. A node here is the
    // premise of bean `d308` closing on itself: the instrument that finds
    // unreachable mechanisms was one.
    //
    // No `maintains` on either, for the reason `schema-docs` records: each writes
    // one artefact PER SUBJECT — a sidecar per node, an SVG per diagram — and
    // `maintains.artefact` is a single path, so naming one file out of hundreds
    // would read as a complete provenance record and be false.
    defineTool({
      id: "kg-audit",
      title: "Knowledge-graph audit",
      description:
        "Audit every join in the actor→role→skill→task sentence and write a committed QA sidecar per node. A printed verdict is gone; a sidecar is what makes \"unbound since it was drawn\" distinguishable from \"broken in the commit under review\".",
      install: { none: true },
      invoke: { shell: "bun run kg:audit" },
      io: {
        inputs: [
          { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Compare against the committed sidecars and fail on a critical finding or a stale one, instead of writing." },
          { name: "strict", schema: t("Flag"), required: false, arg: { flag: "--strict" }, description: "Promote `major` to failing as well. Not what CI runs; see the note on constant-red checks in `remote-skill-servable.test.ts`." },
        ],
        outputs: [
          { name: "sidecars", schema: t("RepoPath"), description: "The QA tree, mirroring each subject's own path — flat would collide, since several basenames already occur twice." },
          // `unknown` is a result, not an absence, and it belongs in the
          // contract: a criterion that could not be evaluated must not be read
          // as a pass, and a caller that cannot see the distinction will read it
          // as one.
          { name: "worstSeverity", schema: t("Text"), description: "critical, major, minor — or none. `unknown` findings are never a pass." },
        ],
      },
      satisfies: ["code-node-review"],
      requires: { runtime: ["bun"], network: false },
    }),

    defineTool({
      id: "bpmn-render",
      title: "BPMN diagram rendering",
      description:
        "Render each process diagram to SVG for the documentation site. The .bpmn file is the source of truth; the picture is generated from it, so a diagram and its image cannot disagree.",
      install: { none: true },
      invoke: { shell: "bun run render:bpmn" },
      io: {
        inputs: [
          { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Fail if any committed SVG is stale, instead of writing." },
        ],
        outputs: [{ name: "diagrams", schema: t("RepoPath"), description: "The generated SVG directory. Never hand-edited." }],
      },
      // NOT `bpmn-authoring`, and the refusal is worth recording. That edge was
      // written first and `check:tools` rejected it: the skill's own I/O
      // contract requires `processName`, because AUTHORING a process starts from
      // one. Rendering an existing diagram starts from the corpus and takes no
      // process name, so the edge asserted this Tool was a way to exercise a
      // skill it cannot exercise.
      //
      // That is `covered-is-not-reachable`'s rule enforced by machine rather
      // than by discipline — do not pick a skill to make a node validate — and
      // it is better than the discipline, because it caught the attempt. The
      // honest skill is the one `schema-docs` and `skill-docs` already satisfy:
      // a source in the graph, an artefact on the site, never hand-edited.
      satisfies: ["docs-generation"],
      // Needs a browser: bpmn-js renders through Chromium, which is why this is
      // in `gates --all` rather than the fast set. Stated here so an agent
      // choosing it on a headless box learns before running it, not after.
      requires: { runtime: ["bun", "chromium"], network: false },
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

    // The twenty tools this instance already serves over MCP. Kept in a sibling
    // module because they are a MIGRATION of an existing surface rather than
    // hand-authored nodes: they are regenerable from `bun run mcp:capture`, and
    // mixing them in here would blur which of the two a reader is looking at.
    ...mcpTools(t),
  ];
}
