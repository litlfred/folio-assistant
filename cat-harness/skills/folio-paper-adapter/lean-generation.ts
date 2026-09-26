import type { SkillDefinition } from "../framework/types.js";

export const leanGeneration: SkillDefinition = {
  id: "lean-generation",
  name: "Lean Generation",
  description: "Stub extraction from LaTeX, cross-reference sync between content objects and Lean files.",
  requiredCapabilities: [
    { capabilityId: "lean-toolchain", degradation: "fallback" },
  ],
  dependsOn: [
    { ref: "content-validation", kind: "skill", conformance: "SHALL" },
  ],
  routingPatterns: ["extract.*stub", "from\\s+latex", "generate.*lean"],
  tags: ["lean", "generation", "stub"],
};
