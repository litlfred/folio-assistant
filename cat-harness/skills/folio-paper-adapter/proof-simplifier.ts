import type { SkillDefinition } from "../framework/types.js";

export const proofSimplifier: SkillDefinition = {
  id: "proof-simplifier",
  name: "Proof Simplifier",
  description: "Post-proof streamlining: tactic compression, redundancy elimination, style normalization.",
  roles: ["collaborator", "owner"],
  requiredCapabilities: [
    { capabilityId: "lean-toolchain", degradation: "fallback", fallbackCapabilityId: "lean-mcp" },
  ],
  mcpServices: ["lean-lsp"],
  routingPatterns: ["simplify.*proof", "streamline", "compress.*tactic"],
  tags: ["lean", "simplification", "proof"],
};
