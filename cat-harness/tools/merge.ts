/**
 * The Tool node for an author handing a green PR to the Merge Manager.
 *
 * DRAFT, like the `merge-manager` skill it satisfies: proposed on issue #1800,
 * awaiting the owner's rulings. What it carries is NOT a draft, though. It is
 * the tagging policy the owner set on 2026-10-01, quoted verbatim and
 * attributed, because a paraphrase of a policy is a second policy free to
 * drift from the first. Owner, the same day: *"in tools, put in the specific
 * guidance i shared previously on tagging."*
 *
 * Its own file rather than a row in `index.ts`, following `sessions.ts`: it is
 * hand-authored, it is not served over MCP, and its subject (merge hand-over)
 * has no neighbour in the existing modules.
 *
 * `invoke.manual`: the steps are four GitHub operations (a check-run read, the
 * ready-for-review flip, a label, a comment), and an agent performs them
 * through whatever GitHub client it holds — the MCP server or `gh`. There is no
 * script to point at, so there is no path to go stale.
 *
 * @module tools/merge
 */
import { defineTool, type ToolDefinition } from "../schemas/tool.js";
import type { ToolTypeName } from "../schemas/tool-types.js";

/** Mint the IRI for one shared type against the publication base. */
type TypeIri = (name: ToolTypeName) => string;

/** The owner's tagging policy, verbatim (owner, 2026-10-01). Never paraphrase it. */
export const OWNER_MERGE_POLICY_2026_10_01 =
  'MERGE POLICY: Do NOT merge to main yourself. When your PR is green on every CI job, mark it "Ready for review", add the label `ready-to-merge`, and comment "ready: <head sha>". The Merge Steward session (named "Separation") merges it after bringing main in and regenerating. If it comments that your PR went red, fix and re-label. Push your own work freely.';

/** The Tool nodes for merge hand-over. */
export function mergeTools(t: TypeIri): ToolDefinition[] {
  return [
    defineTool({
      id: "pr-ready-for-merge",
      title: "Hand a green PR to the Merge Manager",
      description:
        "DRAFT (issue #1800). The PR author's half of the merge hand-over. It carries the owner's tagging policy VERBATIM — owner, 2026-10-01: \"" +
        OWNER_MERGE_POLICY_2026_10_01 +
        "\" Steps: (1) re-read the PR's CURRENT head sha, then verify every CI job on THAT head is green, reading check runs rather than the legacy commit-status API, which is always empty here; (2) mark the PR Ready for review; (3) add the label `ready-to-merge`, keeping every existing label; (4) comment exactly `ready: <full 40-character head sha>`; (5) on a red bounce-back from the Merge Manager (a comment and the label removed): fix, push, wait for green on the new head, and run steps 1–4 again. It never merges.",
      install: { none: true },
      invoke: { manual: true },
      io: {
        inputs: [
          {
            name: "repository",
            schema: t("RepoFullName"),
            required: true,
            description: "`owner/repo` of the PR, e.g. `litlfred/folio-assistant`.",
          },
          {
            name: "pr",
            schema: t("ChangeProposalNumber"),
            required: true,
            description: "The PR number.",
          },
        ],
        outputs: [
          {
            name: "head",
            schema: t("CommitSha"),
            description:
              "The full head sha the `ready:` comment names. If the head moved during the steps, the hand-over is for the OLD sha and is stale: start again from step 1.",
          },
        ],
      },
      // Two skills, two lanes: `prepare-merge` is held by `authoring-agent`,
      // the PR-author lane, and `merge-manager` is the queue it feeds.
      satisfies: ["merge-manager", "prepare-merge"],
      requires: { network: true },
    }),
  ];
}
