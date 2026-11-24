import { defineTool, toolFactory } from "../../../platform/index.js";

export default toolFactory((t) =>
  defineTool({
    id: "bpmn-graphviz-layout",
    title: "BPMN → Diagram Interchange, laid out by Graphviz",
    description:
      "Lay out a BPMN that carries no Diagram Interchange (`bpmn_to_svg.py` beside this file, moved from `.github/skills/bpmn_layout/` by bean folio-assistant-tgaj): one Graphviz cluster per participant, the coordinates written back into the BPMN as `<bpmndi:BPMNDiagram>`, and Graphviz's own SVG. cat-harness-tools' `render:bpmn` draws only the DI a file already has (bpmn-js does not lay out), so this is the step before it for a DAK process written, or imported, without one.",
    install: { none: true },
    invoke: { shell: "python3 smart-base/L2-bpmn/tools/bpmn-graphviz-layout/bpmn_to_svg.py <file.bpmn> [--bpmn <out.bpmn>] [--svg <out.svg>] [--dot <out.dot>]" },
    io: {
      inputs: [{ name: "bpmn", schema: t("RepoPath"), required: true, description: "A BPMN 2.0 file, with or without DI." }],
      outputs: [
        { name: "bpmn", schema: t("RepoPath"), description: "The BPMN with a Graphviz-placed `<bpmndi:BPMNDiagram>` (`--bpmn`)." },
        { name: "svg", schema: t("RepoPath"), description: "Graphviz's drawing (`--svg`); not bpmn-js's, so not the published picture." },
      ],
    },
    satisfies: ["smart-base-tools"],
    selection: {
      when: "A BPMN has no Diagram Interchange, so `render:bpmn` would draw it blank, and a first layout is wanted before an author tidies it (`bpmn:detangle`).",
      limits:
        "A first layout, not the finished one: it does not meet `bpmn-authoring`'s readability rules (fixed task size, label placement, lane order); run `bun run cat bpmn:detangle --write` and look at `render:bpmn`'s picture after it. It parses with the standard library's ElementTree, so it is for files an author holds, not untrusted input.",
      cost: "Seconds; needs Graphviz `dot` on the PATH.",
    },
    requires: { runtime: ["python3", "graphviz"], network: false },
  }),
);
