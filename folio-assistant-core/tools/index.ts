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
 * ## `folio-review-comments` — bean `423d`, epic `q4jm`
 *
 * A pull request's tagged conversation comments, ingested into
 * `folio-review-comment/v1` todos and written as `review-comments.json`. A
 * Tool, and governed by the `review-comments` skill, on the owner's ruling
 * *"make sure it is a Skill/Tool so process can be modified later"*: the
 * staging workflow only calls it.
 */
import { defineTool, type ToolDefinition } from "../../cat-harness/schemas/tool.js";
import { toolTypeIri } from "../../cat-harness/schemas/tool-types.js";

export function tools(baseUrl?: string): ToolDefinition[] {
  const B = baseUrl ?? "";
  const t = (n: Parameters<typeof toolTypeIri>[1]): string => toolTypeIri(B, n);

  return [
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
        "Ingest a pull request's tagged conversation comments (`block: <label>` on the first line) into `folio-review-comment/v1` todos, and write them as `review-comments.json`. Idempotent over its previous output, whose statuses it keeps. Re-anchors every comment against the head's blocks, following `renamedFrom`, and orphans a comment whose block is gone rather than dropping it.",
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
          { name: "review-comments", schema: t("RepoPath"), description: "A `folio-review-comments/v1` file whose `comments` are `folio-review-comment/v1` todos. Its one-line summary goes to stderr." },
        ],
      },
      satisfies: ["review-comments"],
      requires: { runtime: ["bun"], network: true },
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
        "A review-process task moves one `folio-review-comment/v1` todo's status (address, send back, resolve, adjudicate, withdraw) through `transition()`, which refuses any move the named BPMN task may not make. The comment is written to the folio's todos graph (its declared `todo-feedback` directory) and, with `--commit`, committed to the edit-set's FEATURE branch. Refused on the base branch and on a detached HEAD.",
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
  ];
}
