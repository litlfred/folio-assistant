import { defineTool, toolFactory } from "../../../platform/index.js";

export default toolFactory((t) =>
  defineTool({
    id: "dmn-to-questionnaire",
    title: "DMN → FHIR Questionnaire",
    description:
      "Generate FHIR `Questionnaire` resources from a DAK's DMN decision tables. Authoring, not rendering: the IG Publisher validates and indexes them like any other resource.",
    install: { none: true },
    invoke: { shell: "python3 input/scripts/dmn_questionnaire_generator.py" },
    io: {
      inputs: [
        { name: "dmnDir", schema: t("RepoPath"), required: true, description: "The DMN source directory, by convention `input/dmn/`." },
      ],
      outputs: [
        { name: "questionnaires", schema: t("RepoPath"), description: "The generated `Questionnaire` resources, written beside SUSHI's output." },
        { name: "generated", schema: t("Count"), description: "How many were produced. Zero means none only when the DMN directory was found; a missing directory is reported as such." },
      ],
    },
    satisfies: ["dak-preprocessing"],
    selection: {
      when: "A DAK carries DMN decision tables and the IG is to expose them as answerable questionnaires.",
      limits:
        "Reads DMN only: a decision expressed only in prose or CQL is skipped without error. It cannot tell an empty DMN directory from a DAK with no decisions.",
      cost: "Seconds, no network. It runs before the Publisher, so a failure noticed only downstream costs a build cycle.",
    },
    requires: { runtime: ["python3"], network: false },
  }),
);
