import type { SkillDefinition } from "../framework/types.js";

export const contentBlockReview: SkillDefinition = {
  id: "content-block-review",
  name: "Content Block Review",
  description: "Block-level audits: label consistency, Lean alignment, status accuracy, sorry citations.",
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: ["review.*block", "audit.*block", "check.*block"],
  tags: ["review", "content", "block"],
};
