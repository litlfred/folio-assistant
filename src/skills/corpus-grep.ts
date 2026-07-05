import type { SkillDefinition } from "../../skills/framework/types.js";

export const corpusGrep: SkillDefinition = {
  id: "corpus-grep",
  name: "Corpus Grep",
  description:
    "Pre-declaration corpus check — run the four-path grep checklist (docs/audits, content, folio-assistant/computations, docs/coordination) before declaring any item open / gap / TODO. The corpus, not a source file's status note, is the source of truth.",
  roles: ["reader", "collaborator", "owner"],
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: [
    "corpus.?grep",
    "before declaring.*open",
    "is\\s+.*?\\s+(still\\s+)?open",
    "already (implemented|resolved|closed)",
    "open (math|problem|question|gap)",
    "pre.?declaration",
    "pending derivation",
  ],
  tags: ["audit", "anti-hallucination", "discipline", "corpus"],
};
