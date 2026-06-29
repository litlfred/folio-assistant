import type { SkillDefinition } from "../framework/types.js";

export const scientificAccuracy: SkillDefinition = {
  id: "scientific-accuracy",
  name: "Scientific Accuracy",
  description: "Verification of quantitative intent, notation consistency, and logical coherence.",
  roles: ["reader", "collaborator", "owner"],
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: ["review.*accuracy", "check.*math", "verify.*notation"],
  tags: ["review", "accuracy"],
};
