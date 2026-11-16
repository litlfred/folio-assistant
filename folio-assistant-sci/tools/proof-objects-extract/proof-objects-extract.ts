import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
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
);
