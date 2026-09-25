import type { SkillDefinition } from "../framework/types.js";

export const leanProofReview: SkillDefinition = {
  id: "lean-proof-review",
  name: "Lean Proof Review",
  description: "Structured review of Lean proofs for mathematical rigor, style, and sorry auditing.",
  requiredCapabilities: [
    { capabilityId: "lean-toolchain", degradation: "fallback" },
  ],
  routingPatterns: ["review.*lean", "check.*proof", "audit.*lean"],
  tags: ["lean", "review", "proof"],
};
