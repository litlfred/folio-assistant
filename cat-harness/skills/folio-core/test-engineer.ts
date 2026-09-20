import type { SkillDefinition } from "../framework/types.js";

export const testEngineer: SkillDefinition = {
  id: "test-engineer",
  name: "Test Engineer",
  description: "Unit testing, coverage metrics, and test infrastructure for content pipelines.",
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: ["test", "unit\\s+test", "coverage"],
  tags: ["testing", "coverage"],
};
