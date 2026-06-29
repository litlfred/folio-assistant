import type { SkillDefinition } from "../framework/types.js";

export const leanProofReview: SkillDefinition = {
  id: "lean-proof-review",
  name: "Lean Proof Review",
  description: "Structured review of Lean proofs for mathematical rigor, style, and sorry auditing.",
  roles: ["collaborator", "owner"],
  requiredCapabilities: [
    { capabilityId: "lean-toolchain", degradation: "fallback", fallbackCapabilityId: "lean-mcp" },
  ],
  mcpServices: ["lean-lsp"],
  routingPatterns: ["review.*lean", "check.*proof", "audit.*lean"],
  schemas: [
    { module: "schemas/types", types: ["ReviewRecord", "ReviewIssue"], access: "read-write" },
  ],
  tags: ["lean", "review", "proof"],
};
