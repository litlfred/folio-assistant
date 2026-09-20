import type { SkillDefinition } from "../framework/types.js";

export const paperImporter: SkillDefinition = {
  id: "paper-importer",
  name: "Paper Importer",
  description: "Import papers from arXiv or uploaded PDFs into content-object structure.",
  roles: ["collaborator", "owner"],
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  dependsOn: [
    { ref: "content-validation", kind: "skill", conformance: "SHALL" },
  ],
  routingPatterns: ["import.*arxiv", "upload.*paper", "import.*paper"],
  tags: ["import", "arxiv", "paper"],
};
