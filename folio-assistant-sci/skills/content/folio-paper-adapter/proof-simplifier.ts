import type { SkillDefinition } from "@litlfred/cat-harness-tools/schemas/conduct/assistant-types.js";

export const proofSimplifier: SkillDefinition = {
  id: "proof-simplifier",
  name: "Proof Simplifier",
  description: "Post-proof streamlining: tactic compression, redundancy elimination, style normalization.",
  requiredCapabilities: [
    { capabilityId: "lean-toolchain", degradation: "fallback" },
  ],
  routingPatterns: ["simplify.*proof", "streamline", "compress.*tactic"],
  tags: ["lean", "simplification", "proof"],
};
