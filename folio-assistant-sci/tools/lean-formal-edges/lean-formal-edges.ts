import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

// The formal-edge extractor, served over MCP. It reached the servers as a
// `contributes` tool group (`contributions.ts`) until both servers came to
// serve every Tool node in the folio's dependency tree (bean riit, 3c);
// this node is what registers it now, and the contribution is gone.
export default toolFactory((t) =>
  defineTool({
    id: "lean-formal-edges",
    title: "Formal edges from the Lean build",
    description:
      "Extract ELABORATED formal dependencies between a folio's lean.ref declarations (LeanArchitect's rule over the folio's own lean.ref set). Needs a Lean toolchain and a built Lake project. Tagged declarations missing from the build are reported, never recorded as dependency-free; with ingest the result is recorded in the formal cache as source \"elaborated\".",
    install: { none: true },
    invoke: { inProcess: { module: "pipeline/formal-edges-mcp.ts" }, mcp: { tool: "lean_formal_edges" } },
    io: {
      inputs: [
        { name: "lake_dir", schema: t("RepoPath"), required: true, description: "The folio's Lake project directory (holds lakefile.* and .lake/)." },
        { name: "root", schema: t("RepoPath"), required: false, description: "Content root to collect lean.ref targets from (default: the folio's declared one)." },
        { name: "ingest", schema: t("Flag"), required: false, description: "Record the result in the formal cache as source \"elaborated\"." },
      ],
      outputs: [
        { name: "report", schema: t("Markdown"), description: "The extracted edges, or why they could not be determined — never an empty edge set in place of a failure." },
      ],
    },
    satisfies: ["lean-formal-edges"],
    requires: { runtime: ["bun", "lake"], network: false },
  }),
);
