import { defineTool, toolFactory } from "../../../platform/index.js";

export default toolFactory((t) =>
  defineTool({
    id: "kg-extract-bpmn",
    title: "BPMN → L2-BPMN knowledge graph",
    description:
      "Extract the interior of one BPMN file as the L2-BPMN subgraph (`smart-base/L2-bpmn/schemas/extract-bpmn.ts`, ported from WHO smart-kg `tools/extract-bpmn.mjs`): a `bpmn-definitions` node and its processes, participants, tasks, gateways, events, the `flowsTo`/`messageTo`/`contains` edges between them, and one `performedBy` edge from each pool to the persona its @name matches against the ActorDefinition titles under `--personas`. The output is a graph document whose `@context` is the l2-bpmn context and validates with the engine's `check()`.",
    install: { none: true },
    invoke: { shell: "npx --prefix smart-base/L1/schemas tsx smart-base/L2-bpmn/schemas/extract-bpmn.ts" },
    io: {
      inputs: [
        { name: "bpmn", schema: t("RepoPath"), required: true, description: "The .bpmn file to read." },
        { name: "personas", schema: t("RepoPath"), required: false, arg: { flag: "--personas" }, description: "A directory of ActorDefinition FSH; a pool's @name is matched against their titles. When absent, every pool -> persona join is recorded unresolved." },
        { name: "out", schema: t("RepoPath"), required: false, arg: { flag: "--out" }, description: "Where the graph document goes; stdout when absent." },
      ],
      outputs: [{ name: "graph", schema: t("RepoPath"), description: "The L2-BPMN graph document (nodes, edges, provenance)." }],
    },
    satisfies: ["smart-base-tools"],
    selection: {
      when: "A BPMN file's interior is to be read into the knowledge graph as the L2-BPMN subgraph, with its pool -> persona joins recorded and their resolution status made queryable.",
      limits:
        "Parses the OMG BPMN serialisation with regular expressions, as smart-kg did; it reads tasks, sub-processes, exclusive gateways, start/end events, sequence and message flows, and does not interpret diagram layout. A pool -> persona match is exact string equality on a display title, so it does not survive a rename.",
      cost: "Seconds, no network.",
    },
  }),
);
