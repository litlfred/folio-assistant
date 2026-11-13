import { defineTool, toolFactory } from "../../../platform/index.js";

export default toolFactory((t) =>
  defineTool({
    id: "kg-extract-citations",
    title: "DMN reference column → L1 citations",
    description:
      "Extract the L1 citations from a DMN decision table's reference column (`smart-base/L2-dmn/schemas/extract-citations.ts`, ported from WHO smart-kg `tools/extract-citations.mjs`): one `external-artifact` node for the table and one `citation` node per distinct reference string, each left `unresolved`, with `appearsIn` edges and a coverage report of how many rules cite an L1 source. A citation string is content-addressed in the DAK's namespace, so the same string is one node here and in the L2-DMN graph's `citesSource` edges. The output is an L2 document.",
    install: { none: true },
    invoke: { shell: "npx --prefix smart-base/L1/schemas tsx smart-base/L2-dmn/schemas/extract-citations.ts" },
    io: {
      inputs: [
        { name: "dmn", schema: t("RepoPath"), required: true, description: "The .dmn file to read." },
        { name: "out", schema: t("RepoPath"), required: false, arg: { flag: "--out" }, description: "Where the graph document goes; also echoed to stdout when absent." },
      ],
      outputs: [{ name: "graph", schema: t("RepoPath"), description: "The citation graph document (an L2 document: the table as an external artefact and its L1 citation nodes), plus a coverage report on stderr." }],
    },
    satisfies: ["smart-base-tools"],
    selection: {
      when: "A DMN decision table carries an L1 reference column and its citations are to be turned into graph nodes, with coverage counted rather than assumed.",
      limits:
        "Copies each reference string verbatim and never resolves it to a publication — resolution is a judgement the schema requires evidence for. '[Add appropriate reference]' is recorded as a placeholder, which coverage counts apart from a blank. The reference column is found by its description.",
      cost: "Seconds, no network.",
    },
  }),
);
