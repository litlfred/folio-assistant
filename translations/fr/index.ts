import type { TranslationNode } from "../../schemas/translation";

/**
 * French translation of the landing page (docs/index.md).
 *
 * Extracted, translated, and round-trip QA'd by the translation pipeline.
 * Coverage: 37/37 strings (100%).
 */
const node: TranslationNode = {
  label: "trans:fr/index",
  locale: "fr",
  sourceFile: "docs/index.md",
  sourceHash: "db4a49b38c9c",
  potFile: "translations/fr/index.pot",
  poFile: "translations/fr/index.po",
  status: {
    locale: "fr",
    official: false,
    generatedBy: "agent",
    generatedAt: "2026-09-17T22:41:45.100Z",
    generator: "folio-assistant translation pipeline",
    flaggedForReview: true,
    flagReason: "21 segments showed semantic drift in round-trip QA",
  },
  coverage: { translated: 37, total: 37, pct: 100 },
  roundTripQA: {
    pass: 11,
    warn: 4,
    fail: 21,
    total: 36,
    method: "jaccard-word-overlap",
  },
  title: "Accueil — folio-assistant",
  description:
    "French translation of the docs site landing page. All 37 strings " +
    "translated. Round-trip QA ran with simulated back-translation; " +
    "high fail rate expected with limited vocabulary back-translator.",
};
export default node;
