import { defineTool, toolFactory } from "../../platform/index.js";

export default toolFactory((t) =>
  defineTool({
    id: "bpmn-to-fsh",
    title: "BPMN → FHIR Shorthand",
    description:
      "Derive FSH from a DAK's BPMN business processes (the inverse of the extractors).",
    install: { none: true },
    invoke: { shell: "python3 smart-base/scripts/smart-base-transform.py bpmn2fsh <file.bpmn|dir> [-o OUTDIR]" },
    io: {
      inputs: [{ name: "bpmn", schema: t("FilesystemPath"), required: true }],
      outputs: [{ name: "fsh", schema: t("RepoPath"), description: "Generated FSH, for SUSHI to compile." }],
    },
    satisfies: ["smart-base-tools"],
    selection: {
      when: "An L2 business process is to reach L3 as a computable artefact, not only a picture.",
      limits:
        "Requires a `smart-base` checkout at `SMART_BASE_HOME`; without one the capability is ABSENT, not a clean run.",
      cost: "Seconds, plus the upstream checkout.",
    },
    requires: { runtime: ["python3"], network: false },
  }),
);
