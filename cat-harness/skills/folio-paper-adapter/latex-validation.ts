import type { SkillDefinition } from "../framework/types.js";

export const latexValidation: SkillDefinition = {
  id: "latex-validation",
  name: "LaTeX Validation",
  description:
    "LaTeX syntax checking, equation balance verification, and " +
    "unified-latex AST parsing.",
  roles: ["reader", "collaborator", "owner"],
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: ["validate\\s+latex", "latex.*error", "equation.*balance"],
  tags: ["validation", "latex"],
};
