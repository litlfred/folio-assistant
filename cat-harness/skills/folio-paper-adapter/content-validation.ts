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
  validators: [
    {
      id: "schema-check",
      path: "content/pipeline/validate.ts",
      runtime: "typescript",
      scope: "project",
    },
  ],
  routingPatterns: [
    "validate\\s+content",
    "check.*schema",
    "build\\s+content",
  ],
  scripts: [
    { path: "content/pipeline/validate.ts", runtime: "bun", phase: "execute" },
    { path: "content/pipeline/build.ts", runtime: "bun", phase: "execute" },
  ],
  mcpServices: ["paper-assistant"],
  tags: ["validation", "content", "schema"],
};
