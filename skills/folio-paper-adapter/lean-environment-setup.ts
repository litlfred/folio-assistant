import type { SkillDefinition } from "../framework/types.js";

export const leanEnvironmentSetup: SkillDefinition = {
  id: "lean-environment-setup",
  name: "Lean Environment Setup",
  description: "Install and configure Lean 4 toolchain, elan, Lake, and MCP server.",
  roles: ["collaborator", "owner"],
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: ["set\\s+up\\s+lean", "install\\s+lean", "lean.*not\\s+working"],
  tags: ["setup", "lean", "environment"],
};
