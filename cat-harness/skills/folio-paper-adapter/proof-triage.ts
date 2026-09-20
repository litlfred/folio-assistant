import type { SkillDefinition } from "../framework/types.js";

export const proofTriage: SkillDefinition = {
  id: "proof-triage",
  name: "Proof Triage",
  description: "Sorry inventory, dependency ordering, and prioritization of proof attempts.",
  roles: ["collaborator", "owner"],
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: ["what\\s+next", "priority", "triage", "sorry.*inventory"],
  tags: ["triage", "proof", "planning"],
};
