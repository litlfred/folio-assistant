import type { TranslationNode } from "../../schemas/translation";

/**
 * French translation of the agent onboarding guide (docs/guides/agent-onboarding.md).
 *
 * Extracted and translated via the POT/PO pipeline with agentic round-trip QA.
 */
const node: TranslationNode = {
  label: "trans:fr/agent-onboarding",
  locale: "fr",
  sourceFile: "docs/guides/agent-onboarding.md",
  potFile: "translations/fr/agent-onboarding.pot",
  poFile: "translations/fr/agent-onboarding.po",
  status: {
    locale: "fr",
    official: false,
    generatedBy: "agent",
    generatedAt: "2026-09-17T22:18:16.095Z",
    generator: "folio-assistant translation simulation",
    flaggedForReview: true,
    flagReason: "1 segments showed semantic drift in round-trip QA",
  },
  coverage: { translated: 26, total: 26, pct: 100 },
  roundTripQA: {
    pass: 22,
    warn: 3,
    fail: 1,
    total: 26,
    method: "jaccard-word-overlap",
  },
  title: "Intégration de l'agent",
  description:
    "French translation of the agent onboarding guide. " +
    "Full coverage with one segment flagged for semantic drift review.",
};
export default node;
