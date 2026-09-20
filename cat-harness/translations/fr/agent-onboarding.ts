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
  },
  coverage: { translated: 26, total: 26, pct: 100 },
  title: "Intégration de l'agent",
  description:
    "French translation of the agent onboarding guide. Full coverage, and " +
    "unofficial: no human has adjudicated it for this source version. " +
    "Semantic verification is per block, in the " +
    "`<stem>.fr.translation-qa.json` sidecars.",
};
export default node;
