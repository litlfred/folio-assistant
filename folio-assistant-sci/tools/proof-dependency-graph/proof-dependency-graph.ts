import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
  defineTool({
    id: "proof-dependency-graph",
    title: "Proof dependency graph",
    description:
      "Render the dependency graph of a paper's proof objects from `proof-objects.json` as SVG (or DOT), each node linking to its anchor in the published PDF.",
    install: { none: true },
    invoke: { shell: "python3 .github/scripts/generate_dependency_graph.py" },
    io: {
      inputs: [
        { name: "manifest", schema: t("RepoPath"), required: false, arg: { flag: "--manifest" }, description: "The proof-objects.json to read." },
        { name: "output", schema: t("RepoPath"), required: false, arg: { flag: "--output" }, description: "Where to write the SVG." },
        { name: "pdfBaseUrl", schema: t("Url"), required: false, arg: { flag: "--pdf-base-url" }, description: "The published PDF, for the anchor links." },
        { name: "dotOnly", schema: t("Flag"), required: false, arg: { flag: "--dot-only" }, description: "Write DOT source instead of rendering." },
      ],
      outputs: [
        { name: "graph", schema: t("RepoPath"), description: "The SVG, or DOT with `--dot-only`." },
      ],
    },
    satisfies: ["docs-generation", "proof-status-tracking"],
    requires: { runtime: ["python3"], network: false },
  }),
);
