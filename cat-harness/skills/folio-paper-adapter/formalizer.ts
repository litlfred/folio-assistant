import type { SkillDefinition } from "../framework/types.js";

export const formalizer: SkillDefinition = {
  id: "formalizer",
  name: "Formalizer",
  description:
    "Lean proof generation, library synthesis, tactic translation, " +
    "and sorry-removal workflows.",
  requiredCapabilities: [
    { capabilityId: "lean-toolchain", degradation: "fallback" },
    { capabilityId: "lean-mcp", degradation: "warn" },
  ],
  dependsOn: [
    { ref: "content-validation", kind: "skill", conformance: "SHALL" },
  ],
  routingPatterns: [
    "fill\\s+in.*proof",
    "prove",
    "remove\\s+sorry",
    "formalize",
  ],
  tags: ["lean", "formalization", "proof"],
};
