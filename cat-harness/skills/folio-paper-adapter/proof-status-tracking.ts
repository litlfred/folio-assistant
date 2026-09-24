import type { SkillDefinition } from "../framework/types.js";

export const proofStatusTracking: SkillDefinition = {
  id: "proof-status-tracking",
  name: "Proof Status Tracking",
  description: "Management of proof-objects.json manifest and formalization status reporting.",
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: ["status", "tracking", "manifest", "proof.*object"],
  tags: ["tracking", "manifest", "status"],
};
