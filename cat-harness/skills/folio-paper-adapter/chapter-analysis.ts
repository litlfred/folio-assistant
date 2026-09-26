import type { SkillDefinition } from "../framework/types.js";

export const chapterAnalysis: SkillDefinition = {
  id: "chapter-analysis",
  name: "Chapter Analysis",
  description: "Chapter-level scope analysis, cross-reference mapping, and structural review.",
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: ["chapter.*analysis", "chapter.*scope", "cross.*reference"],
  tags: ["analysis", "chapter", "structure"],
};
