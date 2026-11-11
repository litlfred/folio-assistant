import type { SkillDefinition } from "@litlfred/cat-harness-tools/schemas/conduct/assistant-types.js";

export const leanEnvironmentSetup: SkillDefinition = {
  id: "lean-environment-setup",
  name: "Lean Environment Setup",
  description: "Install and configure Lean 4 toolchain, elan, Lake, and MCP server.",
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: ["set\\s+up\\s+lean", "install\\s+lean", "lean.*not\\s+working"],
  tags: ["setup", "lean", "environment"],
};
