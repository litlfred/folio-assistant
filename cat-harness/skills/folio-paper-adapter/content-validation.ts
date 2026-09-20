import type { SkillDefinition } from "../framework/types.js";

export const contentValidation: SkillDefinition = {
  id: "content-validation",
  name: "Content Validation",
  description:
    "Three-level validation pipeline: Zod schema, constraint rules, " +
    "and LaTeX AST checking for content objects.",
  roles: ["reader", "collaborator", "owner"],
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
  schemas: [
    { module: "schemas/types", types: ["Block", "Chapter", "Paper", "ValidationResult"], access: "read" },
    { module: "schemas/constraints", types: ["BlockSchema", "CONSTRAINT_RULES"], access: "read" },
  ],
  tags: ["validation", "content", "schema"],
};
