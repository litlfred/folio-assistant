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
import { sessionTools } from "./sessions.js";
import { viewerTools } from "./viewers.js";
import { declarationPathIn } from "../schemas/cat-harness.js";

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
  const p = declarationPathIn(ROOT)!;
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
    // `bootstrap/skills/discussion.md`, because a Bootstrapping Agent must be able to
    // READ it with nothing installed; the typed node lives here, because a
    // Tool is cat-harness's vocabulary and bootstrap may not import it.
    //
    // `invoke: { manual: true }` — "performed by a person following the
    // skill, with no command", and the `beans-manual` precedent is explicit
    // that this has equal standing to a CLI rather than marking an
    // unfinished record. It is the honest declaration: there is no binary and
    // no endpoint, the mechanism is putting a question to a participant and
    // receiving an answer. Declaring a shell or an MCP name would assert
    // machinery that is not there, and a Bootstrapping Agent that trusted it would be
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
    // `folio-block-qa-summary` — bean `qbfi`, option 2. The review page's
    // heat map reads a folio's QA verdicts from a PUBLISHED summary. This
    // reads the committed `block-qa/v1` sidecars and runs no checker.
    defineTool({
      id: "folio-block-qa-summary",
      title: "Folio block QA summary",
      description:
        "Summarise a folio's committed per-block QA verdicts into one `block-qa.json` a staging preview publishes: each block is failing (a FRESH verdict failed, with the worst severity), stale (a verdict predates the block's current files), passing, or unaudited. Freshness is the QA sweep's own rule, including the uses-graph hash for graph-scoped criteria. Runs no checker and writes no verdict.",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/scripts/publish-block-qa.ts" },
      io: {
        inputs: [
          { name: "folio", schema: t("RepoPath"), required: true, arg: { flag: "--folio" }, description: "The folio's `folio` graph directory." },
          { name: "out", schema: t("RepoPath"), required: true, arg: { flag: "--out" }, description: "Where to write `block-qa.json`." },
          { name: "repo", schema: t("RepoPath"), required: false, arg: { flag: "--repo" }, description: "The folio's instance root, where verdicts are anchored. Default: found from `folio` exactly as the QA sweep finds it." },
        ],
        outputs: [
          { name: "block-qa", schema: t("RepoPath"), description: "A `folio-block-qa-summary/v1` file keyed by block label. Its counts go to stderr." },
        ],
      },
      satisfies: ["review-heatmap"],
      selection: {
        when: "A staging preview is being built and its review page's heat map should show QA per section, from what the folio's QA sweep last recorded.",
        limits:
          "Reports the LAST sweep: in a staging build, the sweep the job ran just before it (bean tw61); otherwise the committed verdicts. A folio never swept reads unaudited throughout. The instance root is found from --folio exactly as the sweep finds it, so a folio in a subfolder is read at its own root; the folio directory is read second, for folios swept before bean s3p2's fix.",
        cost: "One text walk of the folio and one read per sidecar. No network.",
      },
      requires: { runtime: ["bun"], network: false },
    }),
    defineTool({
      id: "folio-block-screenshots",
      title: "Folio block screenshots",
      description:
        "Picture each changed figure, diagram, table, equation or simulator block on the published main site and on a staging build, and compare the two pictures pixel by pixel in Chromium's canvas. Writes `visual-diff.json` (`folio-visual-diff/v1`: per block, the share of pixels changed beyond anti-aliasing, and the before, after and diff pictures) and `visual/*.png`, which the review page's visual renderer shows. A side that cannot be pictured (page or anchor missing) is recorded as missing, never drawn blank. Adds no dependency: Playwright is already the platform's browser driver.",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/scripts/block-screenshots.ts" },
      io: {
        inputs: [
          { name: "changeset", schema: t("RepoPath"), required: true, arg: { flag: "--changeset" }, description: "The preview's `changeset.json`: which blocks changed, and their kind on each side." },
          { name: "base", schema: t("RepoPath"), required: false, arg: { flag: "--base" }, description: "The published main site, as a directory (the publish branch's root)." },
          { name: "head", schema: t("RepoPath"), required: false, arg: { flag: "--head" }, description: "The staging build's site directory." },
          { name: "out", schema: t("RepoPath"), required: false, arg: { flag: "--out" }, description: "Where to write `visual-diff.json` and `visual/`: the site root, so the review page finds them." },
          { name: "count", schema: t("Flag"), required: false, arg: { flag: "--count" }, description: "Print how many changed blocks would be pictured, and stop, so a caller installs a browser only when there is work." },
        ],
        outputs: [
          { name: "visual-diff", schema: t("RepoPath"), description: "`<out>/visual-diff.json` and `<out>/visual/*.png`. A per-block summary goes to stderr." },
        ],
      },
      satisfies: ["visual-diff"],
      selection: {
        when: "A staging build changed a figure, diagram, table, equation or simulator, whose markup diff says little, and the reviewer needs to see before and after.",
        limits:
          "The number is how MUCH changed, never whether the change is right. A block's picture is its anchor down to the next anchor, so a page whose anchors are missing or misplaced pictures the wrong region. Pictures are of the light theme.",
        cost: "A Chromium launch and two page loads, one screenshot and one canvas compare per visual block. Nothing when no visual block changed.",
      },
      requires: { runtime: ["bun", "chromium"], network: false },
    }),
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
          "A fact is needed that no file in reach holds — which harness, or which repositories. Narrow the candidates from context first; a repository already carrying `cat-harness/cat-harness.json` is not a blank slate, and a question the agent could have answered itself wastes the one it is entitled to.",
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
      id: "pdf-cover",
      title: "PDF page raster",
      description:
        "Render one page of a PDF to a PNG — the thumbnail a repository listing shows — and print the provenance a catalogue needs to record it as DERIVED: source, digest, page, geometry, renderer.",
      // PyMuPDF only. Not the `ingest-extended` install line: that one also
      // brings tesseract and Pillow, which a page raster does not need, and a
      // Tool node that overstates its install is a Tool nobody can schedule.
      install: { cli: "pip install pymupdf" },
      invoke: { shell: "python3 cat-harness/scripts/pdf-cover.py" },
      requires: { runtime: ["python3", "pymupdf"], network: false },
      io: {
        inputs: [
          { name: "pdf", schema: t("RepoPath"), required: true, arg: { positional: 0 }, description: "The PDF to render from. Its bytes must be here; nothing is fetched." },
          { name: "out", schema: t("RepoPath"), required: true, arg: { flag: "--out" }, description: "The PNG to write." },
          { name: "page", schema: t("Count"), required: false, arg: { flag: "--page" }, description: "1-based page to render, default 1. Asking for a page past the end is refused, not clamped." },
          { name: "width", schema: t("Count"), required: false, arg: { flag: "--width" }, description: "Output width in pixels, default 300. `Count` admits zero and a zero width does not; the script refuses it rather than writing a 0x0 PNG, which is the tighter bound stated at the port as `CountSchema` asks. Height follows the page's own aspect and is never forced." },
          { name: "checkOnly", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Write nothing; exit non-zero if the target differs from what would be written." },
        ],
        outputs: [
          { name: "facts", schema: t("Text"), description: "With `--json`: source path and sha256, page, page count, point geometry, pixel geometry, output bytes and sha256, media type, renderer version. Everything a provenance record needs and nothing it has to guess." },
        ],
      },
      satisfies: ["asset-extraction"],
      selection: {
        when:
          "A listing needs a cover and the bytes are already held. It renders page 1 by default and calls that the cover, because page 1 is a determined answer and \"the cover\" is not — the same choice `pdf-pages.py` makes about sections.",
        limits:
          "It decides nothing beyond the raster. WHICH documents get a cover, where the file lands, and what the catalogue must say about the derivation are the instance's — see `who-iris/scripts/gen-covers.ts`, which refuses to write bytes for a THUMBNAIL that does not declare itself derived. It also cannot tell you whether the page it rendered IS the cover; it can only tell you it is page 1.",
        cost:
          "One PyMuPDF wheel, no network at run time, and a few milliseconds per page. Deterministic — identical input gives identical bytes, which is what lets a caller gate on `--check` rather than re-deciding.",
      },
    }),

    defineTool({
      id: "ingest-stdlib",
      title: "Ingest, standard library only",
      description:
        "Ingest an upload into `library/` using only the Python standard library — archive listings, CSV and spreadsheet records, technical file metadata, and the content sniff that routes a file to its rung.",
      // Nothing to install: `zipfile`, `tarfile`, `csv`, `xml.etree` and
      // `hashlib` ship with Python. Stated, so "needs nothing" is
      // distinguishable from an unfinished record.
      install: { none: true },
      invoke: { shell: "bun run cat-harness/scripts/ingest-document.ts" },
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
      invoke: { shell: "bun run cat-harness/scripts/ingest-document.ts" },
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

    // ── The preview host: one STAGING/<slug> per open pull request ─────────
    //
    // Tier A of `tools:coverage` on the strength of a `serviceTask` naming the
    // skill, and the workflow IS the whole of what `feature-staging.md` claims —
    // "branch creation, staging deployment, commit SHA stamping, and cleanup".
    // So `satisfies` is one skill and nothing is stretched to fit.
    //
    // A node over a workflow rather than a script, on the `pages-publish`
    // precedent: the mechanism genuinely is the workflow. It holds the gh-pages
    // checkout, the retry and the concurrency group, and a second pusher racing
    // those is how a deploy gets lost.
    defineTool({
      id: "feature-staging",
      title: "Stage a branch's preview",
      description:
        "Publish a branch's built site to `STAGING/<slug>/` on the publish branch, so a reviewer compares a rendered before and after rather than a description of one. Stamps the commit SHA, and removes the preview when its pull request closes.",
      install: { none: true },
      invoke: { shell: ".github/workflows/feature-staging.yml" },
      io: {
        inputs: [
          { name: "branch", schema: t("Branch"), required: false, arg: { flag: "--branch" }, description: "The branch to stage; blank stages the current one. On a pull request the workflow fires by itself and needs none of these." },
          // The two below are a DELETION trigger, and the node says so where a
          // caller reads it rather than only in the workflow's comments.
          { name: "cleanup_slug", schema: t("Slug"), required: false, arg: { flag: "--cleanup-slug" }, description: "DELETION: the `STAGING/<slug>` to remove, instead of staging anything. It exists because the label path cannot reach the previews the health sweep reports — being findable as an orphan REQUIRES the pull request to be closed, so the close event has already fired with no label (bean `w2g5`)." },
          { name: "cleanup_confirm", schema: t("Slug"), required: false, arg: { flag: "--cleanup-confirm" }, description: "The slug again, exactly. Anything else refuses. A confirmation therefore cannot be carried over from a previous run against a DIFFERENT preview, which a boolean would have allowed." },
        ],
        outputs: [{ name: "preview", schema: t("Url"), description: "Where the preview is served. A reviewer cannot assess a rendered artefact from a description of it, which is what this URL is for." }],
      },
      satisfies: ["feature-staging"],
      requires: { network: true },
      selection: {
        when:
          "On a pull request touching the docs, schemas, content or skills it fires on its own — reach for the dispatch arm only to stage a branch that has no open pull request, or to remove a preview the close event could not reach.",
        limits:
          "The removal arm is guarded THREE ways, and the guards are the point rather than ceremony: `workflow_dispatch` is available only to an actor with write access; `cleanup_confirm` must repeat the slug exactly; and the removal is preflighted at removal time against the same liveness signals the health sweep uses. That is `deletion-requires-confirmation` applied to the tool most able to break it — bean `plj1` is a workflow whose shape deleted every open pull request's preview without anybody deciding it. This node does not claim that skill, because implementing the discipline once is not the same as stating it.",
        cost: "A full site build plus a push to the publish branch. Concurrency is keyed on the branch or the cleanup slug, NOT the shared ref, so two cleanups of different previews no longer cancel each other (bean `xd1s`).",
      },
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
      // Bean `n350`: the Tool that publishes bootstrap's graph, so it also
      // satisfies the two skills that govern that graph. They live in
      // `bootstrap/skills/`; `check-tools` resolves them across instances.
      satisfies: ["kg-export", "bootstrap-graph-emission", "bootstrap-graph-publication"],
      // No `alternativeTo`, deliberately. The four siblings sharing this skill
      // are COMPLEMENTARY steps — export, then publish, then serve — not four
      // ways to do one thing, and the schema's own note on that field says a
      // rule keyed on "shares a skill" would demand comparative prose where
      // there is nothing to compare. Exactly one pair in this instance is
      // genuinely substitutable, and it is `beans-cli` / `beans-manual`.
      requires: { runtime: ["bun"], network: false },
    }),

    // ── The QA sweep: one node over a checker REGISTRY ─────────────────────
    //
    // 27 files in this group and 2 entry points, which is the shape `d308` argues
    // for rather than against: the group is already almost entirely
    // library-behind-one-command. So this is one node over `qa-sweep`, and the
    // checker registry underneath is untouched.
    //
    // **`qa-checker-discovery` is the extension point, not the entry point.** A
    // new criterion is added by registering a checker, never by adding a Tool —
    // a node per checker would put twenty-odd near-identical entries in the graph
    // and still not describe how a criterion gets registered.
    //
    // And unlike `latex-authoring` and `proof-verification` above, `content-test`'s
    // contract IS satisfiable: it requires `targetPath`, and `qa-sweep` takes a
    // content root as its first positional. Found by running it — `usage:
    // qa-sweep.ts <content-root> …`, exit 2 — rather than by reading for it.
    defineTool({
      id: "qa-sweep",
      title: "QA sweep",
      description:
        "Run every registered criterion over the blocks under a path and write a per-block QA sidecar. A sidecar rather than a console report, because a printed verdict cannot distinguish \"never checked\" from \"checked and clean\".",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/content/pipeline/qa-sweep.ts" },
      io: {
        inputs: [
          { name: "targetPath", schema: t("RepoPath"), required: true, arg: { positional: 0 }, description: "The content root to sweep. Absent, the command exits 2 with its usage — could-not-determine, not a clean sweep." },
          { name: "dryRun", schema: t("Flag"), required: false, arg: { flag: "--dry-run" }, description: "Report what would change without writing sidecars." },
          { name: "ci", schema: t("Flag"), required: false, arg: { flag: "--ci" }, description: "Fail on a finding rather than recording it." },
          { name: "json", schema: t("Flag"), required: false, arg: { flag: "--json" } },
          // `--only ID,ID` and `--axis NAME,NAME` are DELIBERATELY not declared.
          // Both take a comma-separated list inside one argv word, and the type
          // vocabulary has no honest shape for that: `Slug` forbids the comma,
          // `repeated` would claim the flag may be given more than once when the
          // script parses one list, and `Text` is refused on argv for exactly the
          // reason it would be wrong here. Adding a type to fit a flag rather than
          // to describe a value is how the vocabulary stops meaning anything, so
          // these two stay undeclared and documented rather than mistyped.
        ],
        outputs: [
          { name: "sidecars", schema: t("RepoPath"), description: "One `<block>.qa.json` per block, committed beside its subject." },
        ],
      },
      satisfies: ["content-test"],
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
      invoke: { shell: "cat-harness/scripts/lean-build-all.sh" },
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
      invoke: { shell: "cat-harness/scripts/lake-cache.sh" },
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
      invoke: { shell: "cat-harness/scripts/setup-lean-toolchain.sh" },
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

    // Wireframes (issue #1023): the mechanical half of `wireframe-design-review`.
    // It records per-viewport pass/fail entries and never a score, because the
    // `wiregen` methodology adopts the structure of its source's rating and
    // refuses the arithmetic.
    defineTool({
      id: "wireframe-check",
      title: "Wireframe check at web and mobile viewports",
      description:
        "Render each mid-fidelity wireframe candidate at a web viewport (1280x800) and a mobile viewport (390x844). For each viewport it records `script` entries for renders, no-overflow and no-placeholder, each pass or fail with a note. It writes a screenshot per viewport and a report.json, and exits non-zero on any fail.",
      install: { none: true },
      invoke: { shell: "bun run wireframe:check" },
      io: {
        inputs: [
          { name: "candidates", schema: t("RepoPath"), required: true, repeated: true, arg: { positional: 0 }, description: "Wireframe HTML files. Each must carry both a web and a mobile layout (responsive CSS or two layouts)." },
          { name: "out", schema: t("RepoPath"), required: false, arg: { flag: "--out" }, description: "Where screenshots and report.json go; default .build/wireframes." },
        ],
        outputs: [{ name: "report", schema: t("RepoPath"), description: "report.json: per candidate, per viewport, per criterion. The screenshots are beside it." }],
      },
      satisfies: ["wireframe-design-review"],
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
    // The two UML generators (bean `19cc`). Siblings rather than alternatives:
    // one draws every declared sub-graph from the registry, the other draws
    // the harness object model with its relationships, and neither covers
    // the other.
    defineTool({
      id: "uml-overview",
      title: "UML overview per named sub-graph",
      description:
        "Draw one UML class diagram per harness and one per named sub-graph it declares, as PlantUML and Mermaid from one model, with every class read from the graph kind's node schema, and render the PlantUML to the SVG each page shows (needs Java; the check does not). A kind with none is drawn as could-not-determine, never as an empty box.",
      install: { none: true },
      invoke: { shell: "bun run uml:overview" },
      io: {
        inputs: [
          { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Fail if any diagram, SVG or page is stale or orphaned, instead of writing." },
        ],
        outputs: [{ name: "diagrams", schema: t("RepoPath"), description: "uml/overview/ (.puml and .mmd), their SVG renderings, and the docs/uml/overview/ pages that show them." }],
      },
      satisfies: ["uml-overview"],
      requires: { runtime: ["bun"], network: false },
    }),

    defineTool({
      id: "uml-object-model",
      title: "Harness object model as PlantUML",
      description:
        "Draw the harness object model (Actor, Role, Skill, Process, Task, Todo, Bean, tests, schemas) with every attribute read from the schema behind it. Each relationship names the field that carries it, and the generator refuses to write if that field is gone.",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/scripts/gen-object-model-uml.ts" },
      io: {
        inputs: [
          { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Fail if the committed diagram is stale. Needs the beans CLI; without it the result is could-not-check (exit 2)." },
        ],
        outputs: [{ name: "diagram", schema: t("RepoPath"), description: "The object-model diagram, in the instance's declared uml directory." }],
      },
      satisfies: ["uml-overview"],
      requires: { runtime: ["bun"], network: false },
    }),

    defineTool({
      id: "content-graph-uml",
      title: "A paper's block graph as UML",
      description:
        "Draw a paper's block graph from buildContentGraph: chapters as packages, editorial edges (uses / interprets) solid and formal Lean edges (type / value) dashed purple, never one derived from the other, and each block filled by its formalization status from proof-objects.json when given. One diagram for the paper and one per chapter, each in portrait and landscape, stamped with its source's hash. Run from a folio: the platform carries no paper.",
      install: { none: true },
      invoke: { shell: "bun run content:graph:uml" },
      io: {
        inputs: [
          { name: "root", schema: t("RepoPath"), required: true, arg: { flag: "--root" }, description: "The folio's content directory, where the block manifests are." },
          { name: "out", schema: t("RepoPath"), required: true, arg: { flag: "--out" }, description: "Where to write the .puml files and their SVGs." },
          { name: "status", schema: t("RepoPath"), required: false, arg: { flag: "--status" }, description: "proof-objects.json, for status fills. Without it every block is drawn unfilled." },
          { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Fail if a diagram or SVG is stale or orphaned, instead of writing. Needs no Java." },
        ],
        outputs: [{ name: "diagrams", schema: t("RepoPath"), description: "content-graph.puml and content-graph/<chapter>.puml, with portrait and landscape SVGs beside them." }],
      },
      satisfies: ["graph-rendering", "content-graph"],
      requires: { runtime: ["bun"], network: false },
    }),

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
      invoke: { shell: "bun run cat-harness/scripts/gen-schema-docs.ts" },
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
      invoke: { shell: "bun run cat-harness/scripts/gen-skill-docs.ts" },
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
      invoke: { shell: "bun run cat-harness/scripts/gen-jsonld-context.ts" },
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

    // ── Every prefix spoken is bound, and every own prefix is a stub ──────
    //
    // Bean `zaqn`. `content-context` above proves the published context
    // AGREES with its source; it cannot prove the source is right, and it was
    // not: twenty terms written `folio:` under a binding spelt `fac`, so 1,737
    // documents expanded to IRIs in a URI scheme called `folio`. This node is
    // the check that asks the converse of the emission count — the direction
    // that corrupts data. The discipline is `kg-export` §"A prefix is the stub".
    defineTool({
      id: "context-prefixes",
      title: "JSON-LD prefix check",
      description:
        "Check every committed JSON-LD document in both directions: each prefix a context binds is spoken by something (or forward-declared with a reason), each prefix a document SPEAKS as a key or `@type` is bound in its context, each binding onto one of our own namespaces is spelt as that instance's stub, and every plain key in a document on the published content context is a declared term (never descending into an `@json` value). A context it cannot resolve is reported as undetermined, never clean.",
      install: { none: true },
      invoke: { shell: "bun run check:context-emission" },
      io: {
        inputs: [
          { name: "json", schema: t("Flag"), required: false, arg: { flag: "--json" }, description: "Emit both reports as JSON instead of the console summary." },
        ],
        outputs: [{ name: "report", schema: t("Text"), description: "Console (or JSON) report; exit 1 on an unbound prefix, a misspelt own prefix, a silent binding, or an empty corpus." }],
      },
      satisfies: ["kg-export"],
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
        outputs: [{ name: "report", schema: t("Text"), description: "One line per gate, then a pass count or the failures. Three exit codes, because two cannot carry the distinction: 0 every gate passed, 1 a gate failed, 2 the gate set could NOT BE DERIVED — the workflow it reads is absent or yields nothing. A caller must not read 2 as either verdict; it matters most downstream, where this Tool is inherited and `.github/workflows/` is not." }],
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

    // ── The gates, on the COMBINED state — bean `nytj` ──────────────────
    //
    // `gates` above runs what CI runs, on THIS tree. The failure it cannot
    // see is the one neither PR evaluates: green on the branch, green on the
    // base, stale on the two merged. Three times on 2026-09-23.
    defineTool({
      id: "gates-merged",
      title: "Gates on the merged tree",
      description:
        "Build this branch merged with the current base in a throwaway worktree and run the full `bun run gates` there — the state a merge will actually produce, which neither the branch's CI nor the base's CI evaluates. Exit 0 passes, 1 conflicts or fails, 2 could not determine (never read as clean). The working copy is never touched.",
      install: { none: true },
      invoke: { shell: "bun run check:merged" },
      io: {
        inputs: [
          { name: "base", schema: t("Branch"), required: false, arg: { flag: "--base" }, description: "The base branch to merge with; `main` when omitted. Fetched first." },
        ],
        outputs: [{ name: "report", schema: t("Text"), description: "The gate report for the merged tree, or the conflicting paths." }],
      },
      satisfies: ["prepare-merge"],
      requires: { runtime: ["bun"], network: true },
      selection: {
        when:
          "Immediately before asking for a merge, and again if the base has moved since. Not on every push: it is the full gate set, on a second tree.",
        limits:
          "It tests the base as fetched NOW; the base can still move before the merge lands. The merge queue (`merge_group:` on the gating workflows, switched on by the owner) is what closes that last gap.",
        cost: "One full `bun run gates`, plus a worktree; a `bun install` only when the merge changes the lockfile.",
      },
    }),

    // ── The narrative review queue — what is waiting on a PERSON ──────────
    //
    // Bean `7ajt`, and the node almost did not get written. I had it filed as a
    // capability-vocabulary question for the owner — the `yean` shape, "no skill
    // states this, so authoring one is a design act" — on the grounds that
    // `Task_SmeReview` refs `content-review`, whose contract REQUIRES
    // `reviewType` and `contentRef`, and this script takes a queue index and a
    // numbered preset.
    //
    // That was wrong for the THIRD time in one session, and always the same way:
    // I searched skill NAMES instead of reading skill BODIES.
    // `library-ingestion` §"Reviewing: `bun run narratives`" names these exact
    // commands in a fenced block, and states the rule this node exists to make
    // reachable:
    //
    //   "Two attributions, because they are two acts. `drafted_by` is who wrote
    //    the words; `confirmed_by` is who accepted them. … AN AGENT CANNOT
    //    CONFIRM ITS OWN DRAFT — `confirmed_by.kind` must be "human",
    //    structurally. … without it, `confirmed` degrades into 'an agent said so
    //    twice'."
    //
    // So: case 1 of `covered-is-not-reachable` in its plainest form, a mechanism
    // inlined in its skill's prose, and the remedy is a node rather than a new
    // skill. `interaction-modality` carries the other half — the `low-dexterity`
    // profile's "every question is a selection, options numbered" — and is cited
    // rather than restated.
    //
    // THE INVOKE IS THE LISTING, AND THAT IS THE DESIGN. `reviewer()` throws
    // outside a TTY — "Confirming is a PERSON's act; an agent running this would
    // be recorded as one" — because `git config user.name` in an agent container
    // recorded the agent as the reviewer and the schema could not see it. So an
    // agent CANNOT confirm or reject, and a node whose `invoke` were
    // `narratives:confirm` would declare a capability the caller reading it does
    // not have. What an agent can do, and the thing that was missing, is FIND
    // the queue and read what is waiting on a person.
    defineTool({
      id: "narrative-queue",
      title: "What narratives are waiting on a person",
      description:
        "List the agent-drafted narratives awaiting human confirmation, numbered, with the numbered rejection reasons beside them. The queue is the only place a draft's state is visible before someone accepts it.",
      install: { none: true },
      invoke: { shell: "bun run narratives" },
      io: {
        inputs: [],
        outputs: [
          { name: "queue", schema: t("Text"), description: "Every narrative awaiting a person, NUMBERED, with its subject, its text and its file — then the two commands that act on a number, then the rejection reasons, also numbered. Numbered throughout because the person this is for has very limited hand function and every action must be a selection rather than a typed sentence; `interaction-modality`'s `low-dexterity` profile is the general rule." },
        ],
      },
      satisfies: ["library-ingestion"],
      requires: { runtime: ["bun"], network: false },
      selection: {
        when:
          "To find out what is waiting on a person, or to discover that this queue exists at all — which was the actual gap. Before this node, `grep narrative tools/*.ts` returned nothing, so an agent asking the graph how a person confirms a narrative got no answer, and that is exactly the population the command is for.",
        limits:
          "IT ONLY LISTS. Acting on a number is `bun run narratives:confirm <n>` or `bun run narratives:reject <n> --why <r>`, and both REFUSE outside a terminal: `reviewer()` throws with \"Confirming is a PERSON's act; an agent running this would be recorded as one\". That refusal is load-bearing rather than defensive — driving the CLI in an agent container once wrote `\"rejected_by\": {\"kind\": \"human\", \"id\": \"Claude\"}`, because `git config user.name` is the agent's and the schema could not tell. So this node deliberately does not offer the confirming arms: an agent may read the queue and must not answer it. A rejection with no reason is refused too, not defaulted, because one lets the next agent redraft the identical thing.",
        cost: "Reads the narrative-bearing files under the declared graph. No network.",
      },
    }),

    // ── The two audits over the `tools` graph itself ──────────────────────
    //
    // Bean `shzs`. I nearly filed these as a capability-vocabulary question for
    // the owner, on the grounds that no skill states "audit the Tool graph's own
    // contracts". That was wrong, and wrong in a way worth naming: I searched for
    // a skill NAMED for the capability instead of reading the skills'
    // descriptions. `code-node-review` states it outright —
    //
    //   "Review the knowledge graph's CODE nodes — Tool definitions in the
    //    `tools` graph and schema definition nodes under `schemas/` — for the
    //    joins a reader cannot see: that a node declares what it is, that what it
    //    names resolves, and that the mechanism it describes is the one that
    //    actually runs."
    //
    // — and its §"The audits to run" NAMES `bun run check:tools` in a fenced
    // block. So this is case 1 of `covered-is-not-reachable` in its plainest
    // form: a mechanism inlined in its skill's prose, and giving it a node is
    // exactly the remedy.
    defineTool({
      id: "check-tools",
      title: "Do the Tool nodes agree with their skills?",
      description:
        "Check every Tool node's joins: that each `satisfies` resolves to a real skill and agrees with that skill's declared contract, that every io port names a declared type, and that no argv input has a type able to express a shell payload.",
      install: { none: true },
      invoke: { shell: "bun run check:tools" },
      io: {
        inputs: [],
        outputs: [{ name: "report", schema: t("Text"), description: "The satisfies map, the count of skills with and without a Tool, then the verdict. Exit 0 every join holds, 1 at least one does not. A skill with NO Tool is reported and is deliberately NOT a failure — many are pure judgement, and failing on them would make the report unusable." }],
      },
      satisfies: ["code-node-review"],
      requires: { runtime: ["bun"], network: false },
      selection: {
        when:
          "Before pushing any change to `tools/`, and as the first of the three audits `code-node-review` lists. It is the check that refuses a contract nobody could satisfy.",
        limits:
          "It checks the JOINS, not the truth. The skill says so itself: \"what no audit can tell you: whether the mechanism a Tool describes is the one that runs\". A node can pass this while its `invoke` names a command that does something else entirely — that is what a reviewer is for, and why the skill exists rather than a check script alone.",
        cost: "Seconds. Loads the Tool graph and the skill corpus in-process.",
      },
    }),

    defineTool({
      id: "tool-coverage",
      title: "Which uncovered skills warrant a Tool?",
      description:
        "Triage the skills that have no Tool by EVIDENCE rather than by grep: a serviceTask naming it or an I/O contract puts it in tier A, a userTask only in B, a shell block or a declared script in C, and nothing in D. The answer to \"which of these still have their mechanism inlined in their prose\".",
      install: { none: true },
      invoke: { shell: "bun run tools:coverage" },
      io: {
        inputs: [],
        outputs: [{ name: "triage", schema: t("Text"), description: "Four tiers with A, B and C listed by name and their evidence, D as a count. Always exit 0: this REPORTS a judgement queue and never gates — an uncovered skill is not a defect, and failing on one would make stubbing a gap turn CI red." }],
      },
      satisfies: ["code-node-review"],
      requires: { runtime: ["bun"], network: false },
      selection: {
        when:
          "When choosing what to give a Tool node next. Tier C is the read: its own label says THE READ GOES HERE, and tier A is the list to act on.",
        limits:
          "It enumerates SKILLS and asks which lack Tools, so a capability nobody has stated generically is absent from the list it walks — that blindness is structural, not an oversight, and bean `yean` is the case that proved it. It also cannot see a folio's entry points: `content/pipeline/*.ts` are invoked from a FOLIO's package.json, which is not readable from the platform.",
        cost: "Seconds, plus loading every BPMN diagram to read task types.",
      },
    }),

    // ── What the MCP server actually serves ───────────────────────────────
    //
    // Bean `shzs`. The script NAMES its own skill, so this needed no judgement
    // about capability vocabulary: "it is the comparison side `mcp-contract`
    // needs: that skill's schema-equivalence check compares a Tool node's `io`
    // against what is served, and this is what 'what is served' means before a
    // projector exists."
    //
    // One Tool among several for that skill rather than the whole of it —
    // `mcp-contract` is an equivalence in both directions and this supplies one
    // side. `skills-and-tools` is explicit that several Tools may satisfy one
    // skill and be complementary rather than alternative, so `alternativeTo`
    // stays empty.
    defineTool({
      id: "mcp-capture",
      title: "What this instance's MCP server serves",
      description:
        "Read the real tool surface from the registrars by mounting each against a capture object — the same objects the server asks, so the Zod shapes and their optionality are the served ones rather than a reading of the source.",
      install: { none: true },
      invoke: { shell: "bun run mcp:capture" },
      io: {
        inputs: [
          { name: "json", schema: t("Flag"), required: false, arg: { flag: "--json" }, description: "Emit `{tools, problems}` as JSON for a consumer, instead of the table for a reader." },
        ],
        outputs: [{ name: "surface", schema: t("Text"), description: "One row per served tool with its module and its required/optional keys. Three exit codes: 0 the surface was captured whole, 2 one or more modules COULD NOT BE READ so the capture is incomplete, and no equivalence verdict may be drawn from it. There is no exit 1 — this tool reports what is served and never judges it." }],
      },
      satisfies: ["mcp-contract"],
      requires: { runtime: ["bun"], network: false },
      selection: {
        when:
          "Before trusting any claim that a Tool node's `io` matches what the server serves — and as the input to that comparison. Also the source data for migrating `src/tools/` into Tool nodes (bean `ce65`).",
        limits:
          "INTROSPECTION, deliberately, not source parsing. The first attempt read `server.tool(...)` with a regex and produced wrong input lists — words followed by a colon inside a DESCRIPTION came back as parameter names, so `skill_fetch` appeared to take `Examples` and `Local`. Authoring a node's `io` from that would ship a contract agreeing with nothing, which is worse than no contract because a contract is what the next check trusts.",
        cost: "Mounts every registrar in-process. No network, no server needs to be running.",
      },
    }),

    // ── The publish branch's own history of what it served ───────────────
    //
    // Bean `ru6i`. This node could not be written at all until `render-log.ts`
    // took its prose on stdin: `satisfies` needs a skill, the skill is
    // `render-logging`, and `check:tools` refuses a `Text` input that is a
    // command-line word. The type system was fail-closed and correct, and the
    // script's interface was what had to move.
    defineTool({
      id: "render-log",
      title: "Record what the publish branch served",
      description:
        "Append one entry to the render log on the publish branch: what was published or taken down, when, from which commit, and — for a removal or a retention — WHY. The log is the only place a preview that vanished leaves a trace.",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/scripts/render-log.ts" },
      io: {
        inputs: [
          { name: "dir", schema: t("RepoPath"), required: true, arg: { flag: "--dir" }, description: "A checkout of the publish branch, or a publish directory about to become one. This tool NEVER fetches, commits or pushes: the workflows that call it already hold the checkout with their own retry and concurrency handling, and a second pusher racing those is a new way to lose a deploy." },
          { name: "event", schema: t("RenderEvent"), required: true, arg: { flag: "--event" }, description: "`rendered`, `removed`, `restored` or `retained`. `retained` is the one that makes the log worth reading — a removal CONSIDERED and refused, which otherwise leaves no trace at all." },
          { name: "kind", schema: t("Slug"), required: true, arg: { flag: "--kind" }, description: "What was rendered — `staging-preview`, `site`, `export`. Open on purpose: the publish branch carries more than previews, and a closed enum would put a schema change between somebody and logging what they published." },
          { name: "path", schema: t("RepoPath"), required: true, arg: { flag: "--path" }, description: "The path on the publish branch. Checked as a VALUE, never trusted by provenance: the slug sanitiser can emit `..`, and that is only safe for a slug taken from a git ref — a dispatch input is not one (bean `fuzm`)." },
          { name: "slug", schema: t("Slug"), required: false, arg: { flag: "--slug" }, description: "The staging slug, where the subject has one." },
          { name: "branch", schema: t("Branch"), required: false, arg: { flag: "--branch" }, description: "The branch the render came from." },
          { name: "commit", schema: t("CommitSha"), required: false, arg: { flag: "--commit" }, description: "The commit the artefact was built from." },
          { name: "run", schema: t("Url"), required: false, arg: { flag: "--run" }, description: "The workflow run that wrote this, so a reader can open the log." },
          // The whole reason this node exists, and why it took a change to the
          // script rather than a cleverer type.
          { name: "prose", schema: t("Markdown"), required: true, arg: { stdin: true }, description: "One JSON object on STDIN: `{summary, reason?, detail?, format?}`. `summary` is required and one line. `reason` is required by the SCRIPT for `removed` and `retained` — an entry saying an artefact went and not why is the ambiguity the log exists to prevent. `format` declares how the prose reads (absent means plain text, never sniffed). Build it with `jq -n --arg`, never by concatenation." },
        ],
        outputs: [{ name: "entry", schema: t("RepoPath"), description: "The day's JSONL the entry was APPENDED to. Append is the only verb: there is no `--remove`, no `--edit` and no `--id`, so a takedown is a `removed` ENTRY rather than the erasure of the `rendered` one before it — the never-delete rule made structural instead of a guard three cleanup paths have to remember." }],
      },
      satisfies: ["render-logging"],
      requires: { runtime: ["bun", "jq"], network: false },
      selection: {
        when:
          "Whenever something is published to or removed from the publish branch — including a removal that was refused. Called from `feature-staging.yml` at four points; `staging-render-log.bpmn` is the process.",
        limits:
          "It writes into a directory and does not push, so a caller that forgets to commit the log has written nothing durable. It cannot edit or delete an entry, by design. And `--summary` / `--reason` / `--detail` are REFUSED as flags at exit 2 rather than ignored, so a caller left behind by the stdin migration is told instead of silently logging an entry with no summary.",
        cost: "One appended line. No network.",
      },
    }),

    // ── Is CI actually passing? A different question from "do the gates pass" ──
    //
    // Bean `6qaq`, found while working `6366`, whose criterion asked the `gates`
    // node to satisfy `ci-health`. It must not, and `1xhc` had already recorded
    // why in the list of scripts deliberately left OUT of the gate set:
    // "check:ci-health (a report, reads the default branch, so on a PR it
    // describes main not the diff)". `gates` RUNS the checks; this REPORTS
    // whether the workflows passed. Two capabilities, two nodes.
    //
    // It had no node at all, and was invisible with it: `tools:coverage` triaged
    // `ci-health` into tier D — "no evidence. Almost certainly judgement." —
    // because that triage tests the SKILL's markdown for a fenced shell block
    // and `ci-health.md` states its three reading rules without ever showing the
    // command. A real command, documented in AGENTS.md, and an empty evidence
    // list. Fixed under `6366` by counting a declared script as evidence too.
    defineTool({
      id: "ci-health",
      title: "Is CI passing on the default branch?",
      description:
        "Report each workflow's state on the default branch, which a checkout cannot see: a red workflow looks exactly like a green one from in here. One API call over the recent run history, not one request per workflow — fanning out would exhaust the unauthenticated 60/hr limit and make it unusable at session start.",
      install: { none: true },
      invoke: { shell: "bun run check:ci-health" },
      io: {
        inputs: [
          { name: "markdown", schema: t("Flag"), required: false, arg: { flag: "--markdown" }, description: "Emit the block the session-start sweep prints. ALWAYS exits 0, deliberately: the sweep runs it as `if ! …; then` and would otherwise print the report AND declare it unchecked every time CI is red." },
          { name: "warn", schema: t("Flag"), required: false, arg: { flag: "--warn" }, description: "Report only, never fail. For a caller that wants the state without a verdict." },
          { name: "out", schema: t("RepoPath"), required: false, arg: { flag: "--out" }, description: "Write the markdown report to a file AND keep the exit code — which `--markdown` cannot do, since it always exits 0. The notifier gets its own flag rather than one API call being spent twice." },
        ],
        outputs: [
          { name: "report", schema: t("Markdown"), description: "One row per workflow. Five verdicts, not two: green, red, `running`, `superseded` (a red whose workflow file changed after the failing run, so the verdict is against code that no longer exists), and possibly-stale (a red that has not re-run in a week). Three exit codes carry them to a caller that reads no rows: 0 nothing is red, 1 something is, 2 COULD NOT LOOK — the API was unreachable, or `--out` could not be written. A caller must never read 2 as either verdict. `--markdown` and `--warn` always exit 0 by design, so a caller wanting the verdict uses neither."},
        ],
      },
      satisfies: ["ci-health"],
      // `network: true` is the unusual part, and it is what makes the third
      // state load-bearing rather than decorative — see `selection.limits`.
      requires: { runtime: ["bun"], network: true },
      selection: {
        when:
          "Before trusting ANY workflow's outcome, and at session start. A workflow's result is invisible from a checkout, which is how `docs-site.yml` failed 30 consecutive runs over two months with nothing in the repository saying so (bean `xom7`).",
        limits:
          "It reads the DEFAULT BRANCH, so on a PR it describes `main` and not the diff — which is why it is deliberately not one of the `gates`. `GITHUB_TOKEN`/`GH_TOKEN` is used when present; without one a public repo still works and a private one fails. A REFUSED OR FAILING API CALL EXITS 2 AND IS NEVER GREEN: could-not-look must stay distinguishable from looked-and-it-was-fine, and bean `1xhc` has a case where this printed green while `main` was red because an unsettled newest run was dropped.",
        cost: "One HTTP request. Fast enough for the session-start sweep, which is the constraint the single-call design exists for.",
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
        "The zod definition of `<name>.json` — what an instance may declare about itself — and the published JSON Schema generated from it.",
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
      // Bootstrapping Agent can always reach.
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

    // ── Task_Validate, served by TWO Tools that are not alternatives ──────
    //
    // Groups 6 (`oait`) and 10 (`9x17`) of `d308` both bind `authoring-a-paper ·
    // Task_Validate` and both satisfy `content-validate`. Both beans asked for
    // `alternativeTo` / `selection` between them "since they share a task", and
    // **that is the inference `ToolDefinitionSchema` refutes in as many words**:
    // sharing a skill does not make two Tools substitutable, measured across 12
    // of this instance's 25 multi-Tool skills.
    //
    // These two are the ordinary case, not the exception. One asks whether the
    // content GRAPH is well-formed and well-ordered; the other asks whether a
    // block is valid against its schema. A folio runs both, in that order, and
    // neither answer substitutes for the other — so an `alternativeTo` edge here
    // would oblige `selection` prose comparing two things that do not compete,
    // and an author made to write it writes noise. Left unset deliberately, and
    // both beans corrected rather than satisfied.
    defineTool({
      id: "content-graph-build",
      title: "Content graph",
      description:
        "Build the content graph under a path and report its edges, separated into the EDITORIAL relation an author maintains and the FORMAL one derived from Lean. Reading the two as one number is how the editorial signal gets overwritten.",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/content/pipeline/content-graph.ts" },
      io: {
        inputs: [
          // Optional, because the script defaults to `<repo>/content` — and
          // `check-tools` matches a contract by PORT NAME rather than by
          // required-ness, so declaring it optional still satisfies
          // `content-validate` honestly instead of overstating the argument.
          { name: "targetPath", schema: t("RepoPath"), required: false, arg: { positional: 0 }, description: "Content root to walk; defaults to the folio's `content/`." },
          { name: "json", schema: t("Flag"), required: false, arg: { flag: "--json" } },
        ],
        outputs: [
          // STILL one `Text` port, and `Count` existing does not change that —
          // which is worth saying, because the obvious move once the type landed
          // would be to split this into two numbers.
          //
          // The reason was never only the missing type. A SHELL arm returns a
          // printed report, so `editorialEdges: Count` would overstate what the
          // invoke arm hands a caller: it would promise a parsed number where the
          // mechanism emits text. A node whose ports describe an API it does not
          // have is the same defect as a `satisfies` edge whose contract it
          // cannot receive.
          //
          // The EDITORIAL / FORMAL split survives in the description instead,
          // and it is the fact that matters: `uses[]` and `interprets` are what
          // a READER must have read, while the formal graph is machine-derived
          // from `lean.ref`. A single combined edge count would invite exactly
          // the "sync uses from the formal graph" operation that destroys the
          // signal every ordering metric is computed from — `oait` names that as
          // the one rule this group must not break.
          { name: "report", schema: t("Text"), description: "Block count, then edge counts reported separately and never summed: EDITORIAL (`uses[]`, `interprets` — author-maintained) and FORMAL (derived from `lean.ref`). The formal line distinguishes `0` from `cache ABSENT`, so an unavailable formal graph cannot be read as a graph with no formal edges." },
        ],
      },
      // NO input or output offering to populate `uses[]` from the formal graph,
      // and that absence is the point rather than an omission — `oait` names it
      // as the one rule the group must not break.
      satisfies: ["content-validate"],
      requires: { runtime: ["bun"], network: false },
    }),

    defineTool({
      id: "content-manifest-validate",
      title: "Content manifest validation",
      description:
        "Validate the block manifests under a path against their schemas. Exits 2 where no folio is present rather than reporting a clean run — the platform carries no content, and a validator that passes over nothing is how this one validated nothing for a while.",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/content/pipeline/validate.ts" },
      io: {
        inputs: [
          { name: "targetPath", schema: t("RepoPath"), required: false, arg: { positional: 0 }, description: "A paper or chapter directory; absent, every paper the folio declares." },
          { name: "strict", schema: t("Flag"), required: false, arg: { flag: "--strict" }, description: "Treat warnings as errors." },
        ],
        outputs: [
          { name: "issues", schema: t("Text"), description: "One line per issue, with its block and file. Exit 2 means NO FOLIO WAS FOUND — could-not-determine, never valid." },
        ],
      },
      satisfies: ["content-validate", "content-validation"],
      requires: { runtime: ["bun"], network: false },
    }),

    // ── Scripts a skill used to list as its own (#1168, B3) ─────────────────
    //
    // Until B3 a skill named its scripts (`SkillDefinition.scripts`), which is
    // the general node pointing at its dependents: every new script meant an
    // edit to the skill. Each script that exists is now a Tool that names the
    // skill it `satisfies`; the entries naming a script that does not exist
    // (eleven, e.g. `scripts/verify-proofs.sh`) were dropped rather than
    // modelled, since a Tool whose command is missing is a false claim.
    defineTool({
      id: "content-graph-analysis",
      title: "Editorial content-graph analysis",
      description:
        "Build the block- and section-level editorial dependency graph of one paper from its `.ts` manifests and report forward references, cross-chapter coupling, sparse or dense sections and isolated blocks, ranked. Reads `uses[]`/`interprets` only — the editorial relation, never the formal one.",
      install: { none: true },
      invoke: { shell: "python3 cat-harness/content/pipeline/content-graph-analysis.py" },
      io: {
        inputs: [
          { name: "paper", schema: t("Slug"), required: false, arg: { flag: "--paper" }, description: "The paper directory under the content root. Its default names one folio's paper, which is migration debt: pass it explicitly." },
          { name: "chapter", schema: t("Slug"), required: false, arg: { flag: "--chapter" }, description: "Restrict the analysis to one chapter directory." },
          { name: "json", schema: t("Flag"), required: false, arg: { flag: "--json" }, description: "Emit the whole graph as JSON on stdout and exit." },
          { name: "md", schema: t("Flag"), required: false, arg: { flag: "--md" }, description: "Write the report to /tmp/content-graph-report.md." },
          { name: "visualise", schema: t("Flag"), required: false, arg: { flag: "--visualise" }, description: "Render the Graphviz SVGs (needs graphviz)." },
          { name: "proposals", schema: t("Flag"), required: false, arg: { flag: "--proposals" }, description: "Write concrete reorganisation proposals to /tmp/content-graph-proposals.md." },
        ],
        outputs: [
          { name: "report", schema: t("Text"), description: "The ranked findings, or the graph as JSON with `--json`." },
        ],
      },
      satisfies: ["content-graph"],
      requires: { runtime: ["python3"], network: false },
    }),

    defineTool({
      id: "paper-latex-build",
      title: "Paper build to LaTeX chapters",
      description:
        "Render a paper's content objects to LaTeX chapters: load the paper manifest, resolve its chapters and blocks, render, validate the LaTeX AST, and write the chapter files. With no manifest it builds the folio's only paper, and refuses — naming them — when there are several or none.",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/content/pipeline/build.ts" },
      io: {
        inputs: [
          { name: "paperManifest", schema: t("RepoPath"), required: false, arg: { positional: 0 }, description: "The paper's `<paper>.ts` manifest; absent, the folio's single paper." },
          { name: "outDir", schema: t("RepoPath"), required: false, arg: { flag: "--out-dir" }, description: "Where to write the chapters; absent, `chapters/` at the content root." },
        ],
        outputs: [
          { name: "chapters", schema: t("RepoPath"), description: "One `.tex` per chapter under the output directory." },
        ],
      },
      satisfies: ["content-validation"],
      requires: { runtime: ["bun"], network: false },
    }),

    defineTool({
      id: "pages-index",
      title: "Published-paper index page",
      description:
        "Write the gh-pages `index.html` for a built paper: a Paper tab embedding the PDF and, when given, a Visualizer tab, with download links and the build's branch and commit.",
      install: { none: true },
      invoke: { shell: "python3 .github/scripts/generate-index.py" },
      io: {
        inputs: [
          { name: "outputHtml", schema: t("RepoPath"), required: true, arg: { positional: 0 }, description: "Where to write index.html." },
          { name: "paperEmbed", schema: t("RepoPath"), required: true, arg: { positional: 1 }, description: "The file the Paper tab embeds, typically the PDF." },
          { name: "pdf", schema: t("RepoPath"), required: true, arg: { flag: "--pdf" }, description: "The PDF filename used in download links." },
          { name: "md", schema: t("RepoPath"), required: false, arg: { flag: "--md" }, description: "A Markdown rendering to link, when there is one." },
          { name: "visualizer", schema: t("RepoPath"), required: false, arg: { flag: "--visualizer" }, description: "The visualizer page for the second tab." },
          { name: "branch", schema: t("Branch"), required: false, arg: { flag: "--branch" }, description: "The branch the build is from." },
          { name: "repo", schema: t("RepoFullName"), required: false, arg: { flag: "--repo" }, description: "owner/repo, for links back to the source." },
          { name: "sha", schema: t("CommitSha"), required: false, arg: { flag: "--sha" }, description: "The commit the build is from." },
        ],
        outputs: [
          { name: "index", schema: t("RepoPath"), description: "The written index.html." },
        ],
      },
      satisfies: ["docs-generation"],
      requires: { runtime: ["python3"], network: false },
    }),

    defineTool({
      id: "proof-dependency-graph",
      title: "Proof dependency graph",
      description:
        "Render the dependency graph of a paper's proof objects from `proof-objects.json` as SVG (or DOT), each node linking to its anchor in the published PDF.",
      install: { none: true },
      invoke: { shell: "python3 .github/scripts/generate_dependency_graph.py" },
      io: {
        inputs: [
          { name: "manifest", schema: t("RepoPath"), required: false, arg: { flag: "--manifest" }, description: "The proof-objects.json to read." },
          { name: "output", schema: t("RepoPath"), required: false, arg: { flag: "--output" }, description: "Where to write the SVG." },
          { name: "pdfBaseUrl", schema: t("Url"), required: false, arg: { flag: "--pdf-base-url" }, description: "The published PDF, for the anchor links." },
          { name: "dotOnly", schema: t("Flag"), required: false, arg: { flag: "--dot-only" }, description: "Write DOT source instead of rendering." },
        ],
        outputs: [
          { name: "graph", schema: t("RepoPath"), description: "The SVG, or DOT with `--dot-only`." },
        ],
      },
      satisfies: ["docs-generation", "proof-status-tracking"],
      requires: { runtime: ["python3"], network: false },
    }),

    defineTool({
      id: "proof-objects-extract",
      title: "Proof-object extraction",
      description:
        "Extract the theorem, lemma and definition environments of a paper's LaTeX chapters into `proof-objects.json` — the manifest the dependency graph and the proof-status update read.",
      install: { none: true },
      invoke: { shell: "python3 .github/scripts/extract_proof_objects.py" },
      io: {
        inputs: [
          { name: "output", schema: t("RepoPath"), required: false, arg: { flag: "--output" }, description: "Where to write proof-objects.json." },
        ],
        outputs: [
          { name: "manifest", schema: t("RepoPath"), description: "proof-objects.json. A chapter file that is missing is skipped with a warning, not treated as empty." },
        ],
      },
      satisfies: ["proof-status-tracking"],
      requires: { runtime: ["python3"], network: false },
    }),

    defineTool({
      id: "proof-status-update",
      title: "Proof status from a Lean build",
      description:
        "Update each proof object's status in `proof-objects.json` from a Lean build log — which objects built, which carry `sorry`, which failed. Exits 1 on a manifest with no objects rather than writing an empty status.",
      install: { none: true },
      invoke: { shell: "python3 .github/scripts/update_proof_status.py" },
      io: {
        inputs: [
          { name: "manifest", schema: t("RepoPath"), required: false, arg: { flag: "--manifest" }, description: "The proof-objects.json to update." },
          { name: "buildLog", schema: t("RepoPath"), required: false, arg: { flag: "--build-log" }, description: "The Lean build log; stdin when absent." },
        ],
        outputs: [
          { name: "manifest", schema: t("RepoPath"), description: "proof-objects.json with statuses updated in place." },
        ],
      },
      satisfies: ["proof-status-tracking"],
      requires: { runtime: ["python3"], network: false },
    }),

    // ── The evidence path, and the check that is NOT a computation ────────
    //
    // Group 11 of `d308` (`1oqu`). The bean's constraint was that a Tool here
    // must return "could not determine" distinctly from "verified", because
    // `evidence-retrieval · Task_RecordUnverified` exists for the case where the
    // authority check fails, and collapsing them would launder an unverified
    // citation into an authoritative one.
    //
    // **That constraint is already met, and not by a Tool.** Measured
    // 2026-09-20: nothing in the corpus WRITES a `VerificationEntry`.
    // `schemas/bib-verification.ts` carries seven `VerificationStatus` values —
    // `unfetchable` ("URL/DOI did not resolve") and `partial` ("awaiting PDF")
    // are the could-not-determine cases — and a `Verifier` discriminated union
    // whose own comment states the point: *"`kind: "agent"` is a
    // machine-generated claim awaiting human review; `kind: "human"` is a human
    // adjudication."* Verification is a judgement RECORDED in a curated file, so
    // the guarantee lives in that file's schema, where a boolean cannot reach it.
    //
    // The laundering risk is therefore sharper than the bean assumed: it is not
    // only unknown→verified, it is **agent-claim→verified**. A node emitting
    // `verified: true` would collapse both distinctions at once, which is why
    // this node declares neither — it builds the glossary and says so. The bib
    // verification path is reached through `qa-sweep` instead (`bib-qa.ts` has no
    // `import.meta.main` and produces the report `qa-checkers-extended` reads).
    defineTool({
      id: "glossary-build",
      title: "Glossary build",
      description:
        "Build a paper's glossary index from its manifests and render the LaTeX. `--check` reports drift instead of writing, comparing everything except the `generated` timestamp so a re-run is not mistaken for a change.",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/content/pipeline/build-glossary.ts" },
      io: {
        inputs: [
          { name: "targetPath", schema: t("RepoPath"), required: true, arg: { positional: 0 }, description: "The paper directory, which must hold a `<paper>.ts` manifest. Absent, the command exits 2 with its usage — could-not-determine, not an empty glossary." },
          { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Report drift and write nothing." },
        ],
        outputs: [
          { name: "glossary", schema: t("RepoPath"), description: "`glossary.json` beside the paper, and `chapters/glossary.tex` at the repo root." },
        ],
      },
      // `document-intake`, which is what `Task_L1Sources` refs. It carries NO
      // input contract, so `check-tools` cannot verify this edge against one —
      // worth saying plainly rather than letting a clean run imply agreement
      // that was never tested.
      satisfies: ["document-intake"],
      requires: { runtime: ["bun"], network: false },
    }),

    // ── The FSH cone, and TWO of three declared contracts refused ─────────
    //
    // Group 12 of `d308` (`h588`). `ig-incremental-build · Task_Cone` names
    // `fsh-cone --changed` in its own task label, so this binding is read off the
    // diagram rather than inferred.
    //
    // **The bean asked for one node satisfying three skills; two are refused, on
    // their own contracts.** Measured 2026-09-20 against
    // `schemas/skills/*/input.schema.json`:
    //
    //   fhir-validation     requires igRoot                      → SATISFIABLE
    //   ig-publication      requires igRoot + versionIncrement    → refused
    //   l3-fhir-authoring   requires artifactType + l2Source      → refused
    //
    // The refusals are not a gap to close later. `fsh-cone` computes a dependency
    // cone over a FSH graph: it publishes nothing and authors nothing, so it has
    // no version to increment and no L2 source to render from. Declaring those
    // edges would put this node forward as the mechanism for two jobs it does not
    // do — the `covered-is-not-reachable` shape, manufactured on purpose.
    //
    // **Its verification happens downstream, and that is recorded rather than
    // implied.** The platform carries no folio, so this cannot be exercised here:
    // `d308`'s correction established the same for six of thirteen groups, so the
    // posture is the general case, not this group's quirk. What IS checked here is
    // the one thing that does not need a folio — a missing `<ig-root>` exits 2
    // with usage, measured, not assumed.
    defineTool({
      id: "fsh-cone",
      title: "FSH dependency cone",
      description:
        "Compute the dependency cone over an IG's FSH graph, and the blast radius of a set of changed files. What makes an incremental IG build possible: without it, any edit rebuilds everything.",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/content/pipeline/fsh-cone.ts" },
      io: {
        inputs: [
          { name: "igRoot", schema: t("RepoPath"), required: true, arg: { positional: 0 }, description: "The IG root holding the FSH sources. Absent, the command exits 2 with its usage — could-not-determine, not an empty cone." },
          { name: "csv", schema: t("RepoPath"), required: false, arg: { flag: "--csv" }, description: "Write the report as CSV to this path instead of printing it." },
          // `--top` and `--history` are now DECLARED: `Count` was added to the
          // vocabulary on 2026-09-20, once this node and `content-graph-build`
          // had met the same gap from two directions. Two independent needs is
          // the bar; one flag wanting a bespoke type is not.
          { name: "top", schema: t("Count"), required: false, arg: { flag: "--top" }, description: "Show only the N largest cones. `0` is a legitimate request for none, which is why `Count` admits zero." },
          { name: "history", schema: t("Count"), required: false, arg: { flag: "--history" }, description: "Report the blast radius over the last N commits instead of a static cone." },
          // `--changed f1,f2,…` stays UNDECLARED, and for a reason the new type
          // does not touch: it is a comma-separated list inside ONE argv word.
          // `Slug` forbids the comma, `repeated` would claim the flag may be
          // given more than once when the script parses a single list, and `Text`
          // is refused on argv by the injection rule. That gap is about
          // list-in-one-word, not about numbers.
        ],
        outputs: [
          { name: "cone", schema: t("Text"), description: "The cone, or the impact of `--changed`. With `--csv` it goes to that path instead." },
        ],
      },
      // ONE skill, not the three the bean listed — see the header for why the
      // other two contracts refuse this mechanism rather than merely lacking it.
      satisfies: ["fhir-validation"],
      requires: { runtime: ["bun"], network: false },
    }),

    // ── The round-trip RECORDER, and the two dispatch points it did not need ─
    //
    // Bean `vo9d`, and the owner's answer to it: "1 2 3 are all triggers", then
    // "all for triggers or tools as appropriate". One mechanism, several dispatch
    // points, each a trigger or a Tool. Reading the mechanism then showed which
    // of the three was actually missing — and it was this one.
    //
    // **It does not perform the round trip; it RECORDS one.** `--payload
    // <file.json>` carries a verdict a pair of translation agents produced, and
    // `recordRoundTrip` writes it into the block's existing
    // `<block>.<locale>.translation-qa.json` under the criterion
    // `translation-semantic-roundtrip`. It REFUSES when no sidecar is there, and
    // the refusal states the principle: *"a round trip cannot be the thing that
    // decides this block is translated"* — `translation-block-qa.ts` decides that,
    // and this adds a judgement on top of it.
    //
    // So of the three dispatch points the bean proposed:
    //
    //   · the BPMN trigger ALREADY EXISTS — `Task_RoundTripQA` carries
    //     `<bootstrap.processes:skill ref="translation-manager"/>`, so `workflow_next` already
    //     hands an agent the skill. (A `folio:skill` names a SKILL, never a
    //     script; the mechanism is what this node is for.)
    //   · a `qa-sweep` axis would be WRONG, not merely awkward: the sweep cannot
    //     back-translate, and the verdict originates outside it. A sweep-side
    //     criterion would be a different question — "does this block HAVE a
    //     round-trip verdict" — not this mechanism under another trigger.
    //   · the Tool node is the one that was missing, and it is this.
    //
    // Which is why the node exists and the other two are recorded as done and as
    // refused. `alternativeTo` stays empty: a recorder and a decider are not two
    // ways to do one thing.
    defineTool({
      id: "translation-roundtrip-record",
      title: "Record a round-trip translation verdict",
      description:
        "Write a back-translation verdict, produced by a pair of translation agents, into a block's existing translation-QA sidecar. It records a judgement rather than making one, and refuses where no sidecar exists — a round trip cannot be what decides a block is translated.",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/content/pipeline/translation-roundtrip.ts" },
      io: {
        inputs: [
          { name: "payload", schema: t("RepoPath"), required: true, arg: { flag: "--payload" }, description: "JSON carrying the block, locale, verdict and the agent pair. Absent, the command exits 2 with its usage — measured, not assumed." },
        ],
        outputs: [
          { name: "sidecar", schema: t("RepoPath"), description: "The `<block>.<locale>.translation-qa.json` written, under criterion `translation-semantic-roundtrip`. An AGENT entry replaces a previous agent entry — a re-run is a re-measurement of the same pair on the same text, not another line in a log — while a human ruling already recorded is kept, because this process does not supersede one." },
        ],
      },
      // `translation-manager`, which is what `Task_RoundTripQA` itself refs. That
      // skill carries NO input contract, so `check-tools` cannot verify this edge
      // against one: the clean run does not mean the edge was tested, and saying
      // so here is cheaper than somebody later reading agreement into silence.
      satisfies: ["translation-manager"],
      requires: { runtime: ["bun"], network: false },
    }),

    // ── The L1 completeness gate, reachable at last ───────────────────────
    //
    // Bean `vo9d`, and the owner's answer: a **Tool node**, no npm script. This
    // is the dispatch-points rule applied — `covered-is-not-reachable`
    // §"Reachability is PLURAL": the question is not which caller a mechanism
    // should have but what should be able to start it, and each of those is a
    // trigger or a Tool.
    //
    // A Tool and NOT a script here, because the thing it reads is a FOLIO's
    // `library/` tree and this repository carries no folio. A `check:l1-complete`
    // script would land in `SCRIPT_EXEMPTIONS` as `no-folio` and never run — an
    // entry point added and still unexercised, which is the cost I argued against
    // for `0bzg`'s first option. A Tool node reaches downstream, where the tree
    // exists.
    //
    // It had NO caller at all before this: an `import.meta.main`, and its only
    // occurrence outside itself was a string literal in `repo-partition.ts`'s
    // classification table.
      //
      // **Verified by running it, and one claim had to be walked back.** The first
      // draft of the output description below said exit 2 was what a folio-less
      // run gives. It is not: `instanceRootFor` tries the cwd's instance and then
      // FALLS BACK to the script's own, and `cat-harness` declares a `library`
      // graph of its own — so invoked from `/tmp` it still finds this instance's
      // one entry and exits 0. The exit-2 path is real and correctly written
      // (`checkAll` returns `undefined` for "no declaration anywhere", distinct
      // from `[]` for "declared and empty"), but it cannot be reached while the
      // script lives beside a declared library. What was measured here is the
      // exit-0 path over one real entry — 11 requirements, all met.
    defineTool({
      id: "l1-complete-check",
      title: "L1 source completeness",
      description:
        "Is a `library/<bib-slug>/` entry complete as L1 source content? Each requirement is met, unmet, or NOT-DERIVABLE, so a document that cannot yield an artefact is distinguished from one that simply has not.",
      install: { none: true },
      invoke: { shell: "bun run cat-harness/scripts/check-l1-complete.ts" },
      io: {
        inputs: [
          // Optional: with no argument it walks every entry in the declared
          // `library` graph, which is the sweep a folio wants. Naming one entry
          // is the narrow case, not the default.
          { name: "targetPath", schema: t("RepoPath"), required: false, arg: { positional: 0 }, description: "One `library/<bib-slug>/` entry. Absent, every entry the declared `library` graph holds." },
        ],
        outputs: [
          { name: "report", schema: t("Text"), description: "Per requirement: met, unmet, or `not-derivable` — the third distinguishes a document that CANNOT yield an artefact from one that simply has not. Exit 2 means no `library` graph is declared anywhere, which the script states as \"This is NOT a pass. Treat it as unknown.\"" },
        ],
      },
      // `library-ingestion`, whose other two Tools INGEST. This one gates what
      // they produced, so `alternativeTo` stays EMPTY: `ingest-stdlib` and
      // `ingest-extended` are substitutable with each other — the one genuinely
      // substitutable pair in this instance alongside `beans-cli`/`beans-manual` —
      // and a completeness check is not a third way to ingest.
      //
      // The skill carries no input contract, so `check-tools` cannot verify this
      // edge against one. The clean run does not mean the edge was tested.
      satisfies: ["library-ingestion"],
      requires: { runtime: ["bun"], network: false },
    }),

    // ── Tabular extraction: DECLARED, and deliberately not built ─────────
    //
    // Bean `eief`, the owner: "no tooling needed, stub out, make QA to catch
    // absence." So both tools exist as nodes — a reader can see what the
    // capability WILL be, and `satisfies` binds them to the skill — while
    // neither has an implementation.
    //
    // `install: { none: true }` is not a placeholder here, it is the honest
    // value: there is nothing to install because there is nothing to run.
    // `bun run check:tabular-stubs` is what stops that reading as "works".
    defineTool({
      id: "tabular-csv",
      title: "CSV tabular metadata (STUB)",
      description:
        "STUB — not implemented. Would read a delimited text file into CSVW: one table, its columns and their datatypes. A CSV has no sheets and no cells outside the table, so `fac:anchor.sheet` and `fac:anchor.cell` are a determined null rather than an absence. Routing a CSV is not a sniff — it has no magic bytes — and must not become an extension guess (bean `p67i`).",
      install: { none: true },
      invoke: { manual: true },
      io: {
        inputs: [
          { name: "file", schema: t("Text"), required: true, description: "Path to the delimited text file." },
        ],
        outputs: [
          { name: "record", schema: t("Text"), description: "A `folio-tabular-csvw/v1` document. While stubbed, one table carrying `fac:stub` and NO columns — a half-stub is refused by the schema because it reads as a working extraction." },
        ],
      },
      satisfies: ["tabular-metadata"],
      requires: { network: false },
    }),
    defineTool({
      id: "tabular-xlsx",
      title: "Spreadsheet tabular metadata (STUB)",
      description:
        "STUB — not implemented. Would read a workbook into a CSVW TableGroup: one table per sheet, with the location CSVW cannot express (`fac:anchor`, `fac:headerRow`, `fac:extent`) carried as annotations on valid CSVW. A workbook is the case that motivates those terms: tables that do not start at A1, headers that are not row 1, several tables on one sheet.",
      install: { none: true },
      invoke: { manual: true },
      io: {
        inputs: [
          { name: "file", schema: t("Text"), required: true, description: "Path to the workbook." },
        ],
        outputs: [
          { name: "record", schema: t("Text"), description: "A `folio-tabular-csvw/v1` document, one table per sheet. While stubbed, every table carries `fac:stub` and no columns." },
        ],
      },
      satisfies: ["tabular-metadata"],
      requires: { network: false },
    }),

    // The twenty tools this instance already serves over MCP. Kept in a sibling
    // module because they are a MIGRATION of an existing surface rather than
    // hand-authored nodes: they are regenerable from `bun run mcp:capture`, and
    // mixing them in here would blur which of the two a reader is looking at.
    // Reading who else is working this repository. Hand-authored and not
    // served over MCP, so it is a sibling module rather than a row in
    // `mcp.ts` — see that file's header on why the two are kept apart.
    ...sessionTools(t),

    // The viewer generators, each declaring the graph kinds it renders
    // (#1168 B7a). A sibling module for the same reason as `sessions.ts`.
    ...viewerTools(t),

    ...mcpTools(t),
  ];
}
