import { defineTool, toolFactory } from "../../../platform/index.js";

export default toolFactory((t) =>
  defineTool({
    id: "kg-extract-dmn",
    title: "DMN → L2-DMN knowledge graph",
    description:
      "Extract the interior of one DMN decision table as the L2-DMN subgraph (`smart-base/L2-dmn/schemas/extract-dmn.ts`, ported from WHO smart-kg `tools/extract-dmn.mjs`): a `dmn-definitions` node and its decisions, decision tables, input and output clauses and rules, the `reads` edges to the data elements recovered from input expressions, the `citesSource` edges to the L1 citations each rule's reference column names, and the `invokedBy` edge to the BPMN task the `usingTask` href names. Pass `--bpmn` to resolve that task by name instead of recording it unresolved.",
    install: { none: true },
    invoke: { shell: "npx --prefix smart-base/L1/schemas tsx smart-base/L2-dmn/schemas/extract-dmn.ts" },
    io: {
      inputs: [
        { name: "dmn", schema: t("RepoPath"), required: true, description: "The .dmn file to read." },
        { name: "bpmn", schema: t("RepoPath"), required: false, arg: { flag: "--bpmn" }, description: "A BPMN file; the `usingTask` href fragment is matched against its task @name to resolve `invokedBy`." },
        { name: "out", schema: t("RepoPath"), required: false, arg: { flag: "--out" }, description: "Where the graph document goes; stdout when absent." },
      ],
      outputs: [{ name: "graph", schema: t("RepoPath"), description: "The L2-DMN graph document. Its `citesSource` edges reach L1 citations minted by kg-extract-citations from the same strings." }],
    },
    satisfies: ["smart-base-tools"],
    selection: {
      when: "A DMN decision table's interior is to be read into the knowledge graph as the L2-DMN subgraph, joining its rules to the L1 sources they cite and to the BPMN task that invokes the decision.",
      limits:
        "Parses the DMN serialisation with regular expressions, as smart-kg did. A data element recovered from an input expression carries only the name that was referenced, never a definition, and is left unresolved. The reference column is found by its description, and the outputEntry/annotationEntry split is read from the first rule.",
      cost: "Seconds, no network.",
    },
  }),
);
