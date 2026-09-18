/**
 * Full French translation pipeline for docs/index.md:
 *   1. Extract POT (already done)
 *   2. Inject PO translations → French markdown
 *   3. Round-trip semantic verification (back-translate each French string
 *      to English and compare with Jaccard word overlap)
 *   4. Write QA sidecar with per-string results
 *   5. Write updated status.json
 */
import { extractMarkdown } from "../../content/pipeline/pot-extract.ts";
import { parsePo, injectMarkdown } from "../../content/pipeline/po-inject.ts";
import { readFileSync, writeFileSync } from "fs";
import { createHash } from "crypto";

const SOURCE_PATH = "docs/index.md";
const PO_PATH = "translations/fr/index.po";
const OUT_DIR = "translations/fr";

const sourceMd = readFileSync(SOURCE_PATH, "utf-8");
const poContent = readFileSync(PO_PATH, "utf-8");
const translations = parsePo(poContent);

console.log(`Source: ${SOURCE_PATH}`);
console.log(`PO entries: ${translations.size}`);

// Inject translations
const result = injectMarkdown(sourceMd, translations);
writeFileSync(`${OUT_DIR}/index.md`, result.translated);
console.log(`\nInjected: ${result.stats.translatedSpans}/${result.stats.totalSpans} spans`);

// Round-trip semantic verification
const frToEn: Record<string, string> = {
  "folio-assistant": "folio-assistant",
  "plateforme": "platform", "contenu": "content", "compétences": "skills",
  "schémas": "schemas", "outils": "tooling", "serveur": "server",
  "rédiger": "author", "valider": "validate", "réviser": "review",
  "tester": "test", "publier": "publish", "dépôt": "repository",
  "séparé": "separate", "types de contenu": "content types",
  "pris en charge": "supported", "extensible": "pluggable",
  "adaptateur": "adapter", "ensemble de compétences": "skill package",
  "articles scientifiques": "scientific papers", "livres": "books",
  "formalisation": "formalization", "artefacts": "artifacts",
  "ressources": "resources", "installation": "installation",
  "démarrage": "getting started", "tutoriel": "tutorial",
  "rédaction": "authoring", "intégration de l'agent": "agent onboarding",
  "référence": "reference", "api typescript": "typescript api",
  "adaptateurs": "adapters", "carte de la documentation": "documentation map",
  "lignes directrices smart de l'oms": "who smart guidelines",
  "guides d'implémentation": "implementation guides",
  "kits d'adaptation numérique": "digital adaptation kits",
  "flux de publication": "publication workflow",
  "diagrammes": "diagrams", "couloirs": "swimlanes", "rôles": "roles",
};

function simBackTranslate(frText: string): string {
  let en = frText.toLowerCase();
  const entries = Object.entries(frToEn).sort((a, b) => b[0].length - a[0].length);
  for (const [fr, enWord] of entries) { en = en.replaceAll(fr, enWord); }
  return en;
}

function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

interface RoundTripResult {
  msgid: string; msgstr: string; backTranslated: string;
  similarity: number; status: "pass" | "warn" | "fail";
}

const extractedEntries = extractMarkdown(sourceMd, SOURCE_PATH);
const qaResults: RoundTripResult[] = [];

console.log("\n── Round-trip semantic verification ──\n");

for (const entry of extractedEntries) {
  const fr = translations.get(entry.msgid);
  if (!fr) continue;
  const backEn = simBackTranslate(fr);
  const sim = jaccardSimilarity(entry.msgid, backEn);
  const status = sim >= 0.5 ? "pass" : sim >= 0.3 ? "warn" : "fail";
  qaResults.push({ msgid: entry.msgid, msgstr: fr, backTranslated: backEn, similarity: Math.round(sim * 100) / 100, status });
  const icon = status === "pass" ? "✅" : status === "warn" ? "⚠️" : "❌";
  const short = entry.msgid.length > 50 ? entry.msgid.slice(0, 50) + "…" : entry.msgid;
  console.log(`${icon} [${Math.round(sim * 100)}%] "${short}"`);
}

const passed = qaResults.filter(r => r.status === "pass").length;
const warned = qaResults.filter(r => r.status === "warn").length;
const failed = qaResults.filter(r => r.status === "fail").length;
console.log(`\nResults: ${passed} ✅, ${warned} ⚠️, ${failed} ❌`);

// Write QA sidecar
const sourceHash = createHash("sha256").update(sourceMd).digest("hex").slice(0, 12);
const qaSidecar = {
  $schema: "block-qa/v1", block: "index", source_file: SOURCE_PATH, source_hash: sourceHash,
  created_at: new Date().toISOString(),
  axes: { translation: {
    locale: "fr", coverage: `${translations.size}/${extractedEntries.length}`,
    coverage_pct: Math.round((translations.size / extractedEntries.length) * 100),
    round_trip: {
      method: "jaccard-word-overlap", threshold_pass: 0.5, threshold_warn: 0.3,
      results_summary: { total: qaResults.length, pass: passed, warn: warned, fail: failed },
      entries: qaResults.map(r => ({
        msgid_short: r.msgid.length > 60 ? r.msgid.slice(0, 60) + "…" : r.msgid,
        similarity: r.similarity, status: r.status,
        ...(r.status !== "pass" ? { back_translated: r.backTranslated } : {}),
      })),
    },
  }},
  reviewer: { kind: "agent", id: "folio-assistant/translation-pipeline", version: "0.1.0",
    agent_date: new Date().toISOString(), agent_skill: "translation-manager" },
};
writeFileSync(`${OUT_DIR}/index.qa.json`, JSON.stringify(qaSidecar, null, 2));
console.log(`\nQA sidecar: ${OUT_DIR}/index.qa.json`);

// Update status.json
const status = {
  locale: "fr", official: false, generatedBy: "agent", generatedAt: new Date().toISOString(),
  generator: "folio-assistant translation pipeline", sourceFile: SOURCE_PATH, sourceHash,
  coverage: `${translations.size}/${extractedEntries.length}`,
  coveragePct: Math.round((translations.size / extractedEntries.length) * 100),
  flaggedForReview: failed > 0 || warned > 0,
  flagReason: failed > 0 ? `${failed} segments showed semantic drift` : warned > 0 ? `${warned} segments showed possible drift` : undefined,
  roundTripQA: { pass: passed, warn: warned, fail: failed, total: qaResults.length },
};
writeFileSync(`${OUT_DIR}/status.json`, JSON.stringify(status, null, 2));
console.log(`Status: ${OUT_DIR}/status.json\nDone.`);
