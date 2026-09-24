import type { SkillDefinition } from "../framework/types.js";

export const categoryTheory: SkillDefinition = {
  id: "category-theory",
  name: "Category Theory",
  description:
    "Diagram chasing, natural transformations, monoidal category reasoning, " +
    "and Mathlib CategoryTheory conventions.",
  requiredCapabilities: [
    { capabilityId: "lean-toolchain", degradation: "fallback" },
  ],
  routingPatterns: [
    "diagram",
    "naturality",
    "monoidal",
    "functor",
    "adjunction",
  ],
  tags: ["lean", "category-theory", "mathlib"],
};
