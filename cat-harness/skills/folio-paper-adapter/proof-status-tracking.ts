import type { SkillDefinition } from "../framework/types.js";

export const proofStatusTracking: SkillDefinition = {
  id: "proof-status-tracking",
  name: "Proof Status Tracking",
  description: "Management of proof-objects.json manifest and formalization status reporting.",
  roles: ["reader", "collaborator", "owner"],
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: ["status", "tracking", "manifest", "proof.*object"],
  scripts: [
    { path: ".github/scripts/extract_proof_objects.py", runtime: "python", phase: "execute" },
    { path: ".github/scripts/update_proof_status.py", runtime: "python", phase: "execute" },
  ],
  schemas: [
    { module: "schemas/formalization-types", types: ["ProofObject", "ProofObjectsManifest", "ReviewRecord", "CoverageEntry"], access: "read-write" },
  ],
  tags: ["tracking", "manifest", "status"],
};
