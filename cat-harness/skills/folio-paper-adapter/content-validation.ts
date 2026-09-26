import type { SkillDefinition } from "../framework/types.js";

export const contentValidation: SkillDefinition = {
  id: "content-validation",
  name: "Content Validation",
  description:
    "Three-level validation pipeline: Zod schema, constraint rules, " +
    "and LaTeX AST checking for content objects.",
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: [
    "validate\\s+content",
    "check.*schema",
    "build\\s+content",
  ],
  tags: ["validation", "content", "schema"],
};
