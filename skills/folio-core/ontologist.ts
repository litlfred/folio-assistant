import type { SkillDefinition } from "../framework/types.js";

export const ontologist: SkillDefinition = {
  id: "ontologist",
  name: "Ontologist",
  description: "Term disambiguation, glossary generation, and formal-naming alignment.",
  roles: ["collaborator", "owner"],
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  dependsOn: [
    { ref: "content-validation", kind: "skill", conformance: "SHOULD" },
  ],
  routingPatterns: ["glossary", "terminology", "naming", "disambiguat"],
  scripts: [
    { path: "scripts/ontologist", runtime: "shell", phase: "execute", args: ["scan"] },
    { path: "scripts/ontologist", runtime: "shell", phase: "execute", args: ["generate-glossary"] },
    { path: "scripts/ontologist", runtime: "shell", phase: "execute", args: ["generate-mapping"] },
  ],
  tags: ["ontology", "glossary", "naming"],
};
