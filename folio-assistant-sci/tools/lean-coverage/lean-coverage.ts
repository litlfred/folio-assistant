import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

// ── The Lean audit half, and the one skill still without a mechanism ──
//
// `proof-verification` is NOT satisfied here, and that is a finding rather
// than an omission. Its contract requires `projectRoot`, and nothing in this
// corpus accepts one — the only root-shaped flag anywhere in the Lean scripts
// is `--content-root`, which names where content BLOCKS live, not the Lean
// package. Typing that as `projectRoot` would be the lie `lean-build` already
// refused to tell. So the skill has an I/O contract and no mechanism that can
// meet it; recorded on bean `eu38`.
export default toolFactory((t) =>
  defineTool({
    id: "lean-coverage",
    title: "Lean coverage",
    description:
      "Count how many provable blocks — theorem, lemma, proposition, corollary — carry a full Lean proof rather than a sorry, per paper. The completeness half of the Lean audit: what is formalised, and what is still a gap.",
    install: { none: true },
    invoke: { shell: "bun run folio-assistant-sci/scripts/lean-coverage.ts" },
    io: {
      inputs: [
        { name: "paper", schema: t("Slug"), required: false, arg: { flag: "--paper" }, description: "One paper instead of all." },
        { name: "contentRoot", schema: t("RepoPath"), required: false, arg: { flag: "--content-root" }, description: "Where content blocks live. not a Lean project root." },
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
);
