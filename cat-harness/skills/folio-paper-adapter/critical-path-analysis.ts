import type { SkillDefinition } from "../framework/types.js";

export const criticalPathAnalysis: SkillDefinition = {
  id: "critical-path-analysis",
  name: "Critical Path Analysis",
  description:
    "Dependency DAG tracing, assumption audits, upstream/downstream impact analysis, " +
    "and statement/proof context separation.",
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: [
    "critical\\s+path",
    "trace.*dependenc",
    "assumption.*need",
    "context.*separation",
  ],
  tags: ["analysis", "dependencies", "critical-path"],
};
