#!/usr/bin/env bun
/**
 * Full translation simulation: English → French with round-trip verification.
 *
 * Demonstrates the complete pipeline:
 *   1. Extract translatable strings from a markdown page → POT
 *   2. Simulate agentic French translation → PO
 *   3. Inject translations → translated markdown
 *   4. Round-trip verification: back-translate French → English, compare semantics
 *
 * Usage:
 *   bun run scripts/translation/simulate-translation.ts [path-to-md]
 *
 * Default test page: docs/guides/agent-onboarding.md
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, basename } from "path";
import { extractMarkdown, formatPot, type PotEntry } from "../../content/pipeline/pot-extract";
import { parsePo, injectMarkdown } from "../../content/pipeline/po-inject";

// ── Configuration ───────────────────────────────────────────────

const ROOT = join(import.meta.dir, "../..");
const DEFAULT_PAGE = "docs/guides/agent-onboarding.md";
const TARGET_LOCALE = "fr";
const OUTPUT_DIR = join(ROOT, "translations", TARGET_LOCALE);

// ── Agentic translation (simulated) ─────────────────────────────

/**
 * Simulated French translations for the agent-onboarding page.
 * In production this would be an LLM call or Weblate/Crowdin API.
 *
 * These are real French translations, not placeholders.
 */
const FRENCH_TRANSLATIONS: Record<string, string> = {
  // Headings
  "Agent onboarding": "Intégration de l'agent",
  "1. Work out which repo you are in": "1. Déterminez dans quel dépôt vous vous trouvez",
  "2. Your first five minutes": "2. Vos cinq premières minutes",
  "3. Find the right skill — don't improvise": "3. Trouvez la bonne compétence — n'improvisez pas",
  
  // Paragraphs
  "You are an LLM agent that has just been dropped into a repository using folio-assistant. This page is your orientation: what you are looking at, what to do first, and where to look things up.":
    "Vous êtes un agent LLM qui vient d'être placé dans un dépôt utilisant folio-assistant. Cette page est votre orientation : ce que vous regardez, ce qu'il faut faire en premier, et où chercher les informations.",

  "For the architecture of skills, roles, and capabilities, read Skills & roles. This page is the practical version.":
    "Pour l'architecture des compétences, des rôles et des capacités, lisez Compétences & rôles. Cette page est la version pratique.",

  "There are two kinds, and confusing them is the most common early mistake.":
    "Il en existe deux types, et les confondre est l'erreur la plus fréquente au début.",

  "folio-assistant contains no content. If you find yourself about to write subject matter into it — a chapter, a constant, a chapter-keyword list — you are in the wrong repo, or the thing you are writing should be folio-supplied data. See §7.":
    "folio-assistant ne contient aucun contenu. Si vous vous apprêtez à y écrire de la matière — un chapitre, une constante, une liste de mots-clés de chapitre — vous êtes dans le mauvais dépôt, ou ce que vous écrivez devrait être des données fournies par le folio. Voir §7.",

  "matters more than it looks. Many checks degrade to rather than failing when a tool is missing (no Lean toolchain, no Atlas, no LaTeX). An is not a pass. If you report \"all clean\" without knowing what was skipped, you are reporting the absence of data as a result.":
    "importe plus qu'il n'y paraît. De nombreuses vérifications se dégradent en au lieu d'échouer lorsqu'un outil est manquant (pas de chaîne Lean, pas d'Atlas, pas de LaTeX). Un n'est pas une réussite. Si vous rapportez « tout est propre » sans savoir ce qui a été ignoré, vous rapportez l'absence de données comme un résultat.",

  "Skills are the unit of work here. Before hand-rolling a procedure, check whether one exists.":
    "Les compétences sont l'unité de travail ici. Avant de créer une procédure à la main, vérifiez si une existe déjà.",

  // Table cells
  "folio-assistant (the platform)": "folio-assistant (la plateforme)",
  "A folio (the content repo)": "Un folio (le dépôt de contenu)",
  "Contains": "Contient",
  "skills, schemas, pipeline, MCP server": "compétences, schémas, pipeline, serveur MCP",
  "the actual paper / guideline / IG": "le document / la directive / l'IG réel(le)",
  "no — only": "non — seulement",
  "yes": "oui",
  "You edit here to": "Vous éditez ici pour",
  "change how authoring works": "modifier le fonctionnement de la rédaction",
  "change what is being authored": "modifier ce qui est rédigé",
};

/**
 * Simulated back-translations (French → English) for round-trip verification.
 * In production this would be a separate LLM call translating back.
 */
const BACK_TRANSLATIONS: Record<string, string> = {
  "Intégration de l'agent": "Agent integration",
  "1. Déterminez dans quel dépôt vous vous trouvez": "1. Determine which repository you are in",
  "Vous êtes un agent LLM qui vient d'être placé dans un dépôt utilisant folio-assistant. Cette page est votre orientation : ce que vous regardez, ce qu'il faut faire en premier, et où chercher les informations.":
    "You are an LLM agent that has just been placed in a repository using folio-assistant. This page is your orientation: what you are looking at, what to do first, and where to find information.",
  "Il en existe deux types, et les confondre est l'erreur la plus fréquente au début.":
    "There are two kinds, and confusing them is the most frequent mistake at the beginning.",
  "folio-assistant ne contient aucun contenu. Si vous vous apprêtez à y écrire de la matière — un chapitre, une constante, une liste de mots-clés de chapitre — vous êtes dans le mauvais dépôt, ou ce que vous écrivez devrait être des données fournies par le folio. Voir §7.":
    "folio-assistant contains no content. If you are about to write subject matter into it — a chapter, a constant, a chapter keyword list — you are in the wrong repository, or what you are writing should be data provided by the folio. See §7.",
  "Les compétences sont l'unité de travail ici. Avant de créer une procédure à la main, vérifiez si une existe déjà.":
    "Skills are the unit of work here. Before creating a procedure by hand, check if one already exists.",
};

// ── Semantic comparison (round-trip QA) ─────────────────────────

interface QAResult {
  original: string;
  backTranslated: string;
  similarity: number; // 0-1
  status: "pass" | "drift" | "missing";
  note?: string;
}

/**
 * Simple semantic similarity using word overlap (Jaccard index).
 * In production, this would use an LLM or embedding model.
 */
function wordOverlap(a: string, b: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
  const wordsA = new Set(normalize(a));
  const wordsB = new Set(normalize(b));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

function roundTripQA(
  originalEntries: PotEntry[],
  frenchTranslations: Record<string, string>,
  backTranslations: Record<string, string>,
): QAResult[] {
  const results: QAResult[] = [];

  for (const entry of originalEntries) {
    const french = frenchTranslations[entry.msgid];
    if (!french) {
      results.push({
        original: entry.msgid,
        backTranslated: "",
        similarity: 0,
        status: "missing",
        note: "No French translation available",
      });
      continue;
    }

    const backEn = backTranslations[french];
    if (!backEn) {
      results.push({
        original: entry.msgid,
        backTranslated: "",
        similarity: 0,
        status: "missing",
        note: "No back-translation available (would be LLM-generated in production)",
      });
      continue;
    }

    const similarity = wordOverlap(entry.msgid, backEn);
    const status = similarity >= 0.5 ? "pass" : "drift";

    results.push({
      original: entry.msgid,
      backTranslated: backEn,
      similarity,
      status,
      note:
        status === "drift"
          ? `Semantic drift detected: ${Math.round((1 - similarity) * 100)}% divergence`
          : undefined,
    });
  }

  return results;
}

// ── Main simulation ─────────────────────────────────────────────

function main() {
  const inputFile = process.argv[2] || join(ROOT, DEFAULT_PAGE);
  const sourceMd = readFileSync(inputFile, "utf-8");
  const sourceFile = basename(inputFile);

  console.log("═══════════════════════════════════════════════════════");
  console.log("  TRANSLATION SIMULATION: English → French");
  console.log(`  Source: ${inputFile}`);
  console.log("═══════════════════════════════════════════════════════\n");

  // ── Step 1: Extract ──────────────────────────────────────────

  console.log("━━━ STEP 1: Extract translatable strings (POT) ━━━\n");
  const entries = extractMarkdown(sourceMd, sourceFile);
  console.log(`  Extracted ${entries.length} translatable strings\n`);

  // Show first few
  for (const entry of entries.slice(0, 5)) {
    const preview = entry.msgid.length > 60
      ? entry.msgid.slice(0, 60) + "..."
      : entry.msgid;
    console.log(`  [L${entry.line}] ${preview}`);
  }
  if (entries.length > 5) {
    console.log(`  ... and ${entries.length - 5} more\n`);
  }

  // Write POT file
  const pot = formatPot(entries, { projectName: "folio-assistant", locale: "fr" });
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const potPath = join(OUTPUT_DIR, `${sourceFile.replace(".md", "")}.pot`);
  writeFileSync(potPath, pot);
  console.log(`  ✅ POT written: ${potPath}\n`);

  // ── Step 2: Translate (simulated) ────────────────────────────

  console.log("━━━ STEP 2: Agentic French translation ━━━\n");

  // Build PO content
  let translatedCount = 0;
  let untranslatedCount = 0;
  const poLines: string[] = [
    `# French translation for folio-assistant agent-onboarding`,
    `# Simulated agentic translation`,
    `msgid ""`,
    `msgstr ""`,
    `"Language: fr\\n"`,
    `"Content-Type: text/plain; charset=UTF-8\\n"`,
    ``,
  ];

  for (const entry of entries) {
    const french = FRENCH_TRANSLATIONS[entry.msgid];
    poLines.push(`#: ${entry.source}:${entry.line}`);
    poLines.push(`msgid "${entry.msgid.replace(/"/g, '\\"')}"`);
    if (french) {
      poLines.push(`msgstr "${french.replace(/"/g, '\\"')}"`);
      translatedCount++;
    } else {
      poLines.push(`msgstr ""`);
      untranslatedCount++;
    }
    poLines.push(``);
  }

  const poContent = poLines.join("\n");
  const poPath = join(OUTPUT_DIR, `${sourceFile.replace(".md", "")}.po`);
  writeFileSync(poPath, poContent);

  console.log(`  Translated: ${translatedCount}/${entries.length} strings`);
  console.log(`  Untranslated: ${untranslatedCount} strings`);
  console.log(`  Coverage: ${Math.round((translatedCount / entries.length) * 100)}%`);
  console.log(`  ✅ PO written: ${poPath}\n`);

  // ── Step 3: Inject ───────────────────────────────────────────

  console.log("━━━ STEP 3: Inject translations → French markdown ━━━\n");

  const translations = parsePo(poContent);
  const result = injectMarkdown(sourceMd, translations);

  console.log(`  Changed: ${result.changed}`);
  console.log(`  Spans translated: ${result.stats.translatedSpans}`);
  console.log(`  Spans untranslated: ${result.stats.untranslatedSpans}`);

  const frMdPath = join(OUTPUT_DIR, sourceFile);
  writeFileSync(frMdPath, result.translated);
  console.log(`  ✅ French markdown written: ${frMdPath}\n`);

  // Show a preview
  console.log("  ── Preview (first 15 lines) ──");
  const previewLines = result.translated.split("\n").slice(0, 15);
  for (const line of previewLines) {
    console.log(`  │ ${line}`);
  }
  console.log("  │ ...\n");

  // ── Step 4: Round-trip QA ────────────────────────────────────

  console.log("━━━ STEP 4: Round-trip semantic verification ━━━\n");
  console.log("  Back-translating French → English and comparing...\n");

  const qaResults = roundTripQA(entries, FRENCH_TRANSLATIONS, BACK_TRANSLATIONS);

  let passCount = 0;
  let driftCount = 0;
  let missingCount = 0;

  for (const qa of qaResults) {
    if (qa.status === "pass") {
      passCount++;
    } else if (qa.status === "drift") {
      driftCount++;
      const orig = qa.original.length > 50 ? qa.original.slice(0, 50) + "..." : qa.original;
      const back = qa.backTranslated.length > 50 ? qa.backTranslated.slice(0, 50) + "..." : qa.backTranslated;
      console.log(`  ⚠️  DRIFT (${Math.round(qa.similarity * 100)}% match):`);
      console.log(`     Original: "${orig}"`);
      console.log(`     Back:     "${back}"`);
      console.log(``);
    } else {
      missingCount++;
    }
  }

  console.log(`  ── QA Summary ──`);
  console.log(`  ✅ Pass (≥50% semantic overlap): ${passCount}`);
  console.log(`  ⚠️  Drift (<50% overlap):         ${driftCount}`);
  console.log(`  ❓ Missing back-translation:      ${missingCount}`);
  console.log(`  Total checked:                    ${qaResults.length}`);
  console.log(``);

  // Show pass examples
  const passes = qaResults.filter((q) => q.status === "pass");
  if (passes.length > 0) {
    console.log("  ── Pass examples ──");
    for (const qa of passes.slice(0, 3)) {
      const orig = qa.original.length > 60 ? qa.original.slice(0, 60) + "..." : qa.original;
      console.log(`  ✅ (${Math.round(qa.similarity * 100)}%) "${orig}"`);
    }
    console.log(``);
  }

  // ── Write status.json ────────────────────────────────────────

  console.log("━━━ STEP 5: Write translation status ━━━\n");

  const status = {
    locale: "fr",
    official: false,
    generatedBy: "agent",
    generatedAt: new Date().toISOString(),
    generator: "folio-assistant translation simulation",
    flaggedForReview: driftCount > 0,
    flagReason: driftCount > 0
      ? `${driftCount} segments showed semantic drift in round-trip QA`
      : undefined,
  };

  const statusPath = join(OUTPUT_DIR, "status.json");
  writeFileSync(statusPath, JSON.stringify(status, null, 2));
  console.log(`  ✅ Status written: ${statusPath}`);
  console.log(`  Official: ${status.official}`);
  console.log(`  Flagged for review: ${status.flaggedForReview}`);
  if (status.flagReason) console.log(`  Reason: ${status.flagReason}`);
  console.log(``);

  // ── Summary ──────────────────────────────────────────────────

  console.log("═══════════════════════════════════════════════════════");
  console.log("  SIMULATION COMPLETE");
  console.log("═══════════════════════════════════════════════════════");
  console.log(``);
  console.log(`  Output files:`);
  console.log(`    POT template:     ${potPath}`);
  console.log(`    PO translations:  ${poPath}`);
  console.log(`    French markdown:  ${frMdPath}`);
  console.log(`    Status:           ${statusPath}`);
  console.log(``);
  console.log(`  Pipeline: Extract(${entries.length}) → Translate(${translatedCount}) → Inject(${result.stats.translatedSpans}) → QA(${passCount}✅ ${driftCount}⚠️ ${missingCount}❓)`);
  console.log(``);
}

main();
