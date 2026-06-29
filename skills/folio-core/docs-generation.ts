import type { SkillDefinition } from "../framework/types.js";

export const docsGeneration: SkillDefinition = {
  id: "docs-generation",
  name: "Docs Generation",
  description: "TypeDoc generation, schema docs, PDF/HTML paper builds, and dependency graph rendering.",
  roles: ["reader", "collaborator", "owner"],
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: [
    "generate\\s+docs",
    "build\\s+docs",
    "schema\\s+docs",
    "build\\s+paper",
    "compile\\s+pdf",
    "render\\s+html",
  ],
  scripts: [
    { path: ".github/scripts/generate-html.py", runtime: "python", phase: "execute" },
    { path: ".github/scripts/generate-index.py", runtime: "python", phase: "execute" },
    { path: ".github/scripts/generate_dependency_graph.py", runtime: "python", phase: "execute" },
  ],
  mcpServices: ["paper-assistant"],
  schemas: [
    { module: "schemas/formalization-types", types: ["ProofObjectsManifest", "GlossaryManifest"], access: "read" },
  ],
  tags: ["docs", "generation", "build"],
};
