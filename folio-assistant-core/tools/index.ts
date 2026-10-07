/**
 * folio-assistant-core's Tool nodes — the `tools` graph for the content layer.
 *
 * @module folio-assistant-core/tools
 * @graphNode tool
 *
 * Reached by the harness through tool auto-discovery (`cat-harness/tools/
 * discover.ts`, bean `p0za`), never by an import: the harness may not import
 * core (`check:partition`), and a Tool node is a declaration read at load.
 *
 * ## `folio-changeset` — bean `jwox`, epic `q4jm`
 *
 * The ChangeSet is content vocabulary (what changed in a folio, block by
 * block), so its schema and computation live in `schemas/changeset.ts`, and
 * the Tool that exposes it lives here beside them rather than in the harness.
 * It is invoked as a shell command, so declaring it copies no code.
 *
 * ## `dublin-core-render` — bean `7eak`
 *
 * Dublin Core is content vocabulary (`schemas/dublin-core.ts`), and the
 * harness may not import it, so the renderer and its Tool live here. The
 * owner asked for it *"in rendering ppiple as skill and tool"*.
 *
 * ## `folio-review-comments` — bean `423d`, epic `q4jm`
 *
 * A pull request's tagged conversation comments, ingested into
 * `review-comment/1.0.0` todos and written as `review-comments.json`. A
 * Tool, and governed by the `review-comments` skill, on the owner's ruling
 * *"make sure it is a Skill/Tool so process can be modified later"*: the
 * staging workflow only calls it.
 *
 * ## `block-actions` — bean `uphx`, REQ-17
 *
 * [edit] and [feedback] on every block of a document: the owner asked for it
 * as common core functionality (2026-10-06), so the document build draws the
 * links and this Tool hands them to an agent.
 */
import { defineTool, type ToolDefinition } from "../../cat-harness/schemas/tool.js";
import { toolTypeIri } from "../../cat-harness/schemas/tool-types.js";

export function tools(baseUrl?: string): ToolDefinition[] {
  const B = baseUrl ?? "";
  const t = (n: Parameters<typeof toolTypeIri>[1]): string => toolTypeIri(B, n);

  return [
    defineTool({
      id: "dublin-core-render",
      title: "Dublin Core renderings",
      description:
        "Render every `folio-dublin-core/v1` record a catalogue item names as Dublin Core XML (qualified DC, per DCMI's XML guidelines) and as JSON-LD bound to DCMI Metadata Terms. Both are written into the instance's published root (`<instanceRoot>/dublin-core/<stem>.dc.xml` and `.dc.jsonld`), so the site mount publishes them beside the item pages. Deterministic. `--check` fails on a missing, stale or orphaned rendering. Governed by the `dublin-core-renderings` skill (bean `7eak`).",
      install: { none: true },
      invoke: { shell: "bun run folio-assistant-core/scripts/dc-render.ts" },
      io: {
        inputs: [
          { name: "instance", schema: t("RepoPath"), required: true, arg: { positional: 0 }, description: "The catalogue instance's root, e.g. `who-iris`. It must hold `catalogue/catalogue.json` and declare a directory with `instanceRoot: true`." },
          { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Write nothing. Exit 1 if any rendering is missing, stale or orphaned." },
        ],
        outputs: [
          { name: "renderings", schema: t("RepoPath"), description: "`<published root>/dublin-core/`: one `.dc.xml` and one `.dc.jsonld` per record. A one-line summary goes to stdout." },
        ],
      },
      satisfies: ["dublin-core-renderings"],
      requires: { runtime: ["bun"], network: false },
      selection: {
        when:
          "A catalogue record changed, a catalogue item was added or removed, or the DCMI mapping changed. The renderings must then be regenerated before the gate passes.",
        limits:
          "Renders only records a catalogue item names. Fields with no DCMI term keep a minted predicate in JSON-LD and are reduced to their DC element in XML. A non-`dc` schema field cannot appear in XML at all, and is listed in a header comment. Not OAI-PMH `oai_dc`.",
        cost: "Milliseconds per record. Reads the catalogue nodes and records; no network.",
      },
    }),
    defineTool({
      id: "block-actions",
      title: "Block edit and feedback links",
      description:
        "Each labelled block's links back to where it can be changed: [edit] opens the block's Markdown source in GitHub's editor on `main`, and [feedback] opens a new GitHub issue about the block, from the folio's `.github/ISSUE_TEMPLATE/block-feedback.yml` when it has one (prefilling only the fields it declares: block, section, source, page, url) or as a plain issue whose body carries the same facts. The document build draws these on every block; this Tool prints them as JSON for one block or all. Governed by the `block-actions` skill (bean `uphx`, REQ-17).",
      install: { none: true },
      invoke: { shell: "bun run folio-assistant-core/scripts/block-actions.ts" },
      io: {
        inputs: [
          { name: "repo", schema: t("RepoPath"), required: false, arg: { flag: "--repo" }, description: "The folio's repository root. Default: the working directory." },
          { name: "block", schema: t("NodeId"), required: false, arg: { flag: "--block" }, description: "One block's label. Absent: every block of every document. A label no block has exits 1." },
          { name: "github", schema: t("RepoFullName"), required: false, arg: { flag: "--github" }, description: "`owner/name` on GitHub. Default `GITHUB_REPOSITORY`, else the checkout's `origin`. None at all exits 2: no links rather than broken ones." },
          { name: "edit-branch", schema: t("Branch"), required: false, arg: { flag: "--edit-branch" }, description: "The branch [edit] opens. Default `main`." },
          { name: "issue-template", schema: t("RepoPath"), required: false, arg: { flag: "--issue-template" }, description: "The issue form's file name under `.github/ISSUE_TEMPLATE/`. Default `block-feedback.yml`, used only if the folio has it." },
        ],
        outputs: [
          { name: "links", schema: t("RepoPath"), description: "JSON on stdout: one `{ label, source, section, edit, feedback }` per block. A one-line summary goes to stderr." },
        ],
      },
      satisfies: ["block-actions"],
      requires: { runtime: ["bun"], network: false },
      selection: {
        when:
          "A reader, reviewer or agent wants to propose a change to, or give feedback on, one block of a document folio, and needs the link that lands on that block rather than on the repository.",
        limits:
          "Builds URLs; it writes nothing to GitHub. Only labelled blocks get links. The issue form's fields are read by a line scan for `id:`, so a form must declare its ids plainly.",
        cost: "Milliseconds: one walk of the document manifests. No network.",
      },
    }),
    defineTool({
      id: "folio-changeset",
      title: "Folio ChangeSet",
      description:
        "What changed in a folio between two git refs, block by block: each block added, removed, or changed — and for a changed block, every aspect that applies (renamed, prose, manifest, moved). Keyed on the block label, which the `id-unique` / `id-stable` QA criteria guard, not on file paths.",
      install: { none: true },
      invoke: { shell: "bun run folio-assistant-core/schemas/changeset.ts" },
      io: {
        inputs: [
          { name: "folio", schema: t("RepoPath"), required: true, arg: { flag: "--folio" }, description: "The folio's `folio` graph directory, relative to the repository — what `<slug>.json` declares for it, usually `folio/`." },
          { name: "base", schema: t("Branch"), required: false, arg: { flag: "--base" }, description: "The ref compared against. Default `origin/main`. An unresolvable base is an ERROR, never an empty ChangeSet." },
          { name: "head", schema: t("Branch"), required: false, arg: { flag: "--head" }, description: "The ref under review, or `worktree` (the default) for the files on disk, uncommitted edits included." },
          { name: "out", schema: t("RepoPath"), required: false, arg: { flag: "--out" }, description: "Where to write the JSON. Absent: stdout." },
          { name: "text-out", schema: t("RepoPath"), required: false, arg: { flag: "--text-out" }, description: "Also write `changeset-text.json`: the prose, source and rendered, of every block the ChangeSet lists, on each side that has it. The review page's diff renderers read it (bean `d903`)." },
        ],
        outputs: [
          { name: "changeset", schema: t("RepoPath"), description: "A `folio-changeset/v1` document. Its one-line summary goes to stderr." },
        ],
      },
      satisfies: ["diff", "staging-review"],
      requires: { runtime: ["bun", "git", "tar"], network: false },
      selection: {
        when:
          "A reviewer, or the review page, needs to know which BLOCKS a branch changed — not which files. Use it before building a before/after table, a change heat map, or a per-block diff report.",
        limits:
          "Reads manifests as text and never executes the base ref, so a section whose blocks are computed rather than listed is invisible to it. An unlabelled block is identified by its slug, so renaming its file reads as removed plus added. Rendered assets (SVGs) are not compared.",
        cost: "Seconds for a few thousand blocks: one `git archive` per committed ref, then a text walk. No network.",
      },
    }),
    defineTool({
      id: "folio-review-comments",
      title: "Folio review comments",
      description:
        "Ingest a pull request's tagged conversation comments (`block: <label>` on the first line) into `review-comment/1.0.0` todos, and write them as `review-comments.json`. Idempotent over its previous output, whose statuses it keeps. Re-anchors every comment against the head's blocks, following `renamedFrom`, and orphans a comment whose block is gone rather than dropping it.",
      install: { none: true },
      invoke: { shell: "bun run folio-assistant-core/scripts/review-comments.ts" },
      io: {
        inputs: [
          { name: "repo", schema: t("RepoFullName"), required: true, arg: { flag: "--repo" }, description: "`owner/name` of the repository the pull request is in." },
          { name: "pr", schema: t("ChangeProposalNumber"), required: true, arg: { flag: "--pr" }, description: "The edit-set's pull request." },
          { name: "out", schema: t("RepoPath"), required: true, arg: { flag: "--out" }, description: "Where to write `review-comments.json`." },
          { name: "folio", schema: t("RepoPath"), required: false, arg: { flag: "--folio" }, description: "Read the head's blocks from the folio's manifests (as text; nothing is executed). Give this OR `blocks`." },
          { name: "blocks-out", schema: t("RepoPath"), required: false, arg: { flag: "--blocks-out" }, description: "With `folio`: also write `blocks.json`, so a later run can anchor without checking the folio out." },
          { name: "blocks", schema: t("RepoPath"), required: false, arg: { flag: "--blocks" }, description: "A published `blocks.json`. The comment-triggered refresh uses this, so it never checks out the pull request's code." },
          { name: "existing", schema: t("RepoPath"), required: false, arg: { flag: "--existing" }, description: "The previous `review-comments.json`. Every comment in it is kept, with its status." },
          { name: "commit", schema: t("CommitSha"), required: false, arg: { flag: "--commit" }, description: "The head commit. Default `GITHUB_SHA`, else `git rev-parse HEAD`." },
          { name: "todos", schema: t("RepoPath"), required: false, arg: { flag: "--todos" }, description: "The folio's todos graph root. Review comments committed under its `todo-feedback` directory, on the feature branch, win over the previously published copy." },
          { name: "comments", schema: t("RepoPath"), required: false, arg: { flag: "--comments" }, description: "Read comments from this JSON file instead of GitHub: offline runs and tests." },
        ],
        outputs: [
          { name: "review-comments", schema: t("RepoPath"), description: "A `folio-review-comments/v1` file whose `comments` are `review-comment/1.0.0` todos. Its one-line summary goes to stderr." },
        ],
      },
      satisfies: ["review-comments"],
      requires: { runtime: ["bun"], network: true },
      remedies: [{ host: "api.github.com", none: "Reviewer comments are held by GitHub; without it the review page keeps its last ingested set." }],
      selection: {
        when:
          "A pull request that edits a folio has reviewer comments, and the review page, the heat map, or an editor needs them as structured todos anchored to blocks.",
        limits:
          "Reads conversation comments only, not line review comments (those anchor to a file line). A reviewer's edit to a comment after it was ingested is not re-read. Statuses are moved by review-process tasks, not by this Tool; it keeps whatever `existing` says.",
        cost: "One paginated GitHub API call per 100 comments, plus a text walk of the manifests when `folio` is given.",
      },
    }),
    defineTool({
      id: "folio-review-comment-move",
      title: "Move a review comment's status",
      description:
        "A review-process task moves one `review-comment/1.0.0` todo's status (address, send back, resolve, adjudicate, withdraw) through `transition()`, which refuses any move the named BPMN task may not make. The comment is written to the folio's todos graph (its declared `todo-feedback` directory) and, with `--commit`, committed to the edit-set's FEATURE branch. Refused on the base branch and on a detached HEAD.",
      install: { none: true },
      invoke: { shell: "bun run folio-assistant-core/scripts/review-comment-move.ts" },
      io: {
        inputs: [
          { name: "id", schema: t("NodeId"), required: true, arg: { flag: "--id" }, description: "The review comment's id, `review-pr<N>-c<commentId>`." },
          { name: "to", schema: t("NodeId"), required: true, arg: { flag: "--to" }, description: "The status to move it to: open, addressed, resolved, adjudicated or withdrawn. Checked against the closed list by the script; the list is core vocabulary, so it is not a harness Tool type." },
          { name: "process", schema: t("ProcessId"), required: true, arg: { flag: "--process" }, description: "The BPMN process whose task is making the move." },
          { name: "task", schema: t("NodeId"), required: true, arg: { flag: "--task" }, description: "The task, in that process, making the move." },
          { name: "decision", schema: t("NodeId"), required: false, arg: { flag: "--decision" }, description: "The Decision that closes it. Required to resolve or adjudicate." },
          { name: "todos", schema: t("RepoPath"), required: false, arg: { flag: "--todos" }, description: "The folio's todos graph root. Default `todos`." },
          { name: "published", schema: t("RepoPath"), required: false, arg: { flag: "--published" }, description: "The published `review-comments.json`, for a comment not committed yet." },
          { name: "commit", schema: t("Flag"), required: false, arg: { flag: "--commit" }, description: "Commit the file to the current feature branch." },
          { name: "base", schema: t("Branch"), required: false, arg: { flag: "--base" }, description: "The base branch a status may NOT be committed to. Default `main`." },
        ],
        outputs: [
          { name: "comment", schema: t("RepoPath"), description: "`<todo-feedback dir>/<id>.json`, the moved node." },
        ],
      },
      satisfies: ["review-comments"],
      requires: { runtime: ["bun", "git"], network: false },
      selection: {
        when:
          "An editor or adjudicator, acting in a review-process task, has decided what happens to a reviewer's comment and the decision must be recorded where the edit is: on the feature branch.",
        limits:
          "Only the moves in `REVIEW_TRANSITIONS`, and only by the task each names. Anchor facts in a committed file are those of the last move; the published file is where re-anchoring shows.",
        cost: "Reads one directory and writes one file; one git commit with `--commit`.",
      },
    }),
    defineTool({
      id: "folio-review-coverage",
      title: "Folio review coverage",
      description:
        "Compute the two facts `content-change-review.bpmn`'s coverage gate (`GW_Covered`) reads: `uncoveredBlocks`, the changed blocks with no reviewer verdict on their CURRENT hash, and `openDefects`. Reads a preview's `changeset.json`, `blocks.json` and `review-comments.json`. With `--commit`, writes the ingested `folio-review-verdict/v1` verdicts into the todos graph's declared `review-verdicts` directory and commits them to the edit-set's FEATURE branch; refused on the base branch and a detached HEAD. Prints the facts as JSON on stdout.",
      install: { none: true },
      invoke: { shell: "bun run folio-assistant-core/scripts/review-coverage.ts" },
      io: {
        inputs: [
          { name: "changeset", schema: t("RepoPath"), required: true, arg: { flag: "--changeset" }, description: "The preview's `changeset.json`: which blocks changed." },
          { name: "blocks", schema: t("RepoPath"), required: true, arg: { flag: "--blocks" }, description: "The preview's `blocks.json`: each head block's current hash." },
          { name: "comments", schema: t("RepoPath"), required: true, arg: { flag: "--comments" }, description: "The preview's `review-comments.json`: open defects, and the ingested verdicts." },
          { name: "out", schema: t("RepoPath"), required: false, arg: { flag: "--out" }, description: "Also write the full `folio-review-coverage/v1` report, with the uncovered labels and the stale verdicts." },
          { name: "todos", schema: t("RepoPath"), required: false, arg: { flag: "--todos" }, description: "The folio's todos graph root. Verdicts committed under its `review-verdicts` directory win over the published copy." },
          { name: "commit", schema: t("Flag"), required: false, arg: { flag: "--commit" }, description: "Write the published verdicts into the declared directory and commit them to the current feature branch. Needs `todos`." },
          { name: "base", schema: t("Branch"), required: false, arg: { flag: "--base" }, description: "The base branch verdicts may NOT be committed to. Default `main`." },
        ],
        outputs: [
          { name: "coverage", schema: t("RepoPath"), description: "The `folio-review-coverage/v1` report at `out`. Its `facts` field, `{\"uncoveredBlocks\": n, \"openDefects\": n}`, is also printed alone on stdout: what `workflow_complete` takes for `GW_Covered`. The summary goes to stderr." },
        ],
      },
      satisfies: ["review-comments"],
      requires: { runtime: ["bun", "git"], network: false },
      selection: {
        when:
          "The review coordinator reaches `GW_Covered` and needs to know, rather than guess, whether every changed block has been read at its current version and no defect is still open.",
        limits:
          "Counts only what reviewers recorded as verdicts. A block nobody tagged is uncovered even if somebody read it. A verdict on an older hash is reported as stale and not counted.",
        cost: "Reads three JSON files and one directory; one git commit with `--commit`.",
      },
    }),
    // Moved here from cat-harness/tools/index.ts on 2026-10-06 (bean `0r7u`
    // step 0): its command runs `folio-assistant-core/scripts/build-glossary.ts`,
    // so declared in the harness it was an upward path into this layer. A Tool
    // is declared by the harness that owns its implementation (#2192).
    //
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
      invoke: { shell: "bun run folio-assistant-core/scripts/build-glossary.ts" },
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
  ];
}
