import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

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
// This layer carries no folio, and no Lean toolchain is installed here, so
// what was verified is the CONTRACT — `satisfies` resolves and agrees with
// each skill's own I/O contract, every io type is declared, every argv input
// is injection-safe. The mechanism is verified downstream, in a folio.
// `requires.runtime` says so rather than leaving a caller to find out, which
// is the posture bean `h588` established for FHIR and which turns out to be
// the general case for six of the thirteen groups in `d308`.
export default toolFactory((t) =>
  defineTool({
    id: "lean-build",
    title: "Lean build",
    description:
      "Build every Lean project in the workspace from the root Lake manifest, so cross-package dependencies resolve against it rather than a possibly-stale per-paper manifest. Writes a committable build-status sidecar every run.",
    install: { none: true },
    invoke: { shell: "bun run cat lean:build-all" },
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
    remedies: [
      { host: "release.lean-lang.org", error: "Host not in allowlist", tool: "lean-toolchain-setup" },
      { host: "github.com", none: "Lake fetches the declared dependencies from GitHub; with it refused they cannot resolve." },
    ],
  }),
);
