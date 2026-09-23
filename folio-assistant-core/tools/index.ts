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
  ];
}
