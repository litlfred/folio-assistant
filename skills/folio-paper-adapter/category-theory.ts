import type { SkillDefinition } from "../framework/types.js";

export const categoryTheory: SkillDefinition = {
  id: "category-theory",
  name: "Category Theory",
  description:
    "Diagram chasing, natural transformations, monoidal category reasoning, " +
    "and Mathlib CategoryTheory conventions.",
  roles: ["collaborator", "owner"],
  requiredCapabilities: [
    { capabilityId: "lean-toolchain", degradation: "fallback", fallbackCapabilityId: "lean-mcp" },
  ],
  mcpServices: ["lean-lsp"],
  routingPatterns: [
    "diagram",
    "naturality",
    "monoidal",
    "functor",
    "adjunction",
  ],
  tags: ["lean", "category-theory", "mathlib"],
};
