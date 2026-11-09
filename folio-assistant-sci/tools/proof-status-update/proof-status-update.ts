import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
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
);
