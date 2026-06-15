import type { SkillDefinition } from "../framework/types.js";

export const readabilityEditing: SkillDefinition = {
  id: "readability-editing",
  name: "Readability Editing",
  description: "Prose style, consistency, and readability improvements for narrative content.",
  roles: ["reader", "collaborator", "owner"],
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: ["edit.*prose", "simplify.*language", "readability"],
  tags: ["editing", "prose"],
};
