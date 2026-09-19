import type { SkillDefinition } from "../framework/types.js";

export const contentGraph: SkillDefinition = {
  id: "content-graph",
  name: "Content Graph",
  description:
    "Builds a full content dependency graph from uses[], interprets, proofs, " +
    "and examples relationships. Applies heuristics to detect forward references, " +
    "cross-chapter/cross-section coupling, sparse/dense sections, and isolated blocks. " +
    "Produces ranked reorganisation suggestions and implements approved moves.",
  roles: ["reader", "collaborator", "owner"],
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: [
    "content.graph",
    "content.organis",
    "content.organiz",
    "cross.chapter",
    "cross.section",
    "forward.ref",
    "section.*too.*small",
    "section.*too.*large",
    "section.*balance",
    "disentangle",
    "reorgani[sz]e",
    "block.*graph",
    "chapter.*graph",
    "section.*graph",
    "content.*connect",
    "what.*blocks.*move",
    "proposals",
    "split.*section",
    "merge.*section",
    "concrete.*reorg",
  ],
  schemas: [
    { module: "schemas/types", types: ["Block", "Chapter", "Section"], access: "read" },
  ],
  scripts: [
    {
      path: "content/pipeline/content-graph-analysis.py",
      runtime: "python3",
      phase: "execute",
    },
  ],
  tags: ["analysis", "editorial", "graph", "organisation", "dependencies"],
};
