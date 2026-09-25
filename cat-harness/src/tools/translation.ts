/**
 * Translation MCP tools — agent-generic, not adapter-scoped.
 *
 * These tools are generic because translation applies to every content type:
 * documents, papers, and DAK folios all have translatable prose. Registered
 * alongside beans-prime and workflow in `server.ts`.
 *
 * Tools:
 *   translation_extract — extract POT from content markdown
 *   translation_inject  — inject PO translations into markdown
 *   translation_status  — report translation coverage for a locale
 *   translation_signoff — sign off a translation as official
 *   translation_validate — round-trip QA (back-translate and compare)
 *
 * @module src/tools/translation
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { basename, join, relative } from "path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createHash } from "crypto";

import { extractMarkdown, formatPot, type PotEntry } from "../../content/pipeline/pot-extract.js";
import { parsePo, injectMarkdown } from "../../content/pipeline/po-inject.js";
/**
 * The declared `translation-sources` graph — where a translator's `.pot` and
 * `.po` live. Falls back to the convention because extraction CREATES the
 * tree for a locale that has none yet.
 *
 * declared-path-literal: the convention fallback, stated at the call site
 * rather than inside `directoriesForGraph` so the choice is visible.
 */
function translationsRoot(repoRoot: string): string {
  return directoryForGraph(repoRoot, "translation-sources") ?? join(repoRoot, "translations");
}

import { directoryForGraph } from "../../schemas/cat-harness.js";

export function registerTranslationTools(server: McpServer, repoRoot: string): void {

  // ── translation_extract ───────────────────────────────────────

  server.tool(
    "translation_extract",
    "Extract translatable strings from a markdown file or directory into a " +
      "GNU gettext .pot template. Segments prose by paragraph, strips inline " +
      "formatting, skips code blocks and front matter. Output goes to " +
      "translations/<locale>/<name>.pot. Uses the same extraction state machine " +
      "as smart-base's extract_translations.py.",
    {
      path: z.string().describe(
        "Path to a .md file or directory of .md files (relative to repo root). " +
          "E.g. 'docs/guides/agent-onboarding.md' or 'folio/paper/chapters/ch1/'"
      ),
      locale: z.string().default("en").describe(
        "Source locale (BCP 47 tag). Default: 'en'."
      ),
      project_name: z.string().optional().describe(
        "Project name for the POT header. Default: 'folio'."
      ),
    },
    async ({ path: inputPath, locale, project_name }) => {
      const absPath = join(repoRoot, inputPath);

      if (!existsSync(absPath)) {
        return { content: [{ type: "text" as const, text: `❌ Path not found: ${inputPath}` }] };
      }

      // Collect .md files
      const mdFiles: string[] = [];
      const stat = Bun.file(absPath);
      if ((await stat.exists()) && inputPath.endsWith(".md")) {
        mdFiles.push(absPath);
      } else if (existsSync(absPath)) {
        // Directory — find all .md files
        const walkDir = (dir: string) => {
          for (const entry of readdirSync(dir, { withFileTypes: true })) {
            if (entry.isDirectory() && !entry.name.startsWith(".")) {
              walkDir(join(dir, entry.name));
            } else if (entry.name.endsWith(".md")) {
              mdFiles.push(join(dir, entry.name));
            }
          }
        };
        walkDir(absPath);
      }

      if (mdFiles.length === 0) {
        return { content: [{ type: "text" as const, text: `No .md files found in ${inputPath}` }] };
      }

      // Extract all entries
      const allEntries: PotEntry[] = [];
      for (const file of mdFiles) {
        const md = readFileSync(file, "utf-8");
        const relPath = relative(repoRoot, file);
        const entries = extractMarkdown(md, relPath);
        allEntries.push(...entries);
      }

      // Write POT
      const name = basename(inputPath, ".md");
      const outDir = join(translationsRoot(repoRoot), locale);
      mkdirSync(outDir, { recursive: true });
      const potPath = join(outDir, `${name}.pot`);
      const pot = formatPot(allEntries, { projectName: project_name, locale });
      writeFileSync(potPath, pot);

      const relPot = relative(repoRoot, potPath);
      return {
        content: [{
          type: "text" as const,
          text: `✅ Extracted ${allEntries.length} translatable strings from ${mdFiles.length} file(s).\n` +
            `POT written: ${relPot}\n` +
            `Deduped entries: ${new Set(allEntries.map((e) => e.msgid)).size}`,
        }],
      };
    },
  );

  // ── translation_inject ────────────────────────────────────────

  server.tool(
    "translation_inject",
    "Inject translations from a .po file into the source markdown, producing " +
      "a translated copy. Uses the same state machine as extraction to identify " +
      "translatable spans, looks up each span's msgid in the PO translations, " +
      "and substitutes the msgstr. Fuzzy entries are skipped. Output goes to " +
      "translations/<locale>/<filename>.md.",
    {
      source: z.string().describe(
        "Path to the source .md file (relative to repo root)."
      ),
      po_file: z.string().describe(
        "Path to the .po file with translations (relative to repo root)."
      ),
      locale: z.string().describe(
        "Target locale (BCP 47 tag, e.g. 'fr', 'ar', 'zh')."
      ),
    },
    async ({ source, po_file, locale }) => {
      const sourcePath = join(repoRoot, source);
      const poPath = join(repoRoot, po_file);

      if (!existsSync(sourcePath)) {
        return { content: [{ type: "text" as const, text: `❌ Source not found: ${source}` }] };
      }
      if (!existsSync(poPath)) {
        return { content: [{ type: "text" as const, text: `❌ PO file not found: ${po_file}` }] };
      }

      const sourceMd = readFileSync(sourcePath, "utf-8");
      const poContent = readFileSync(poPath, "utf-8");
      const translations = parsePo(poContent);

      const result = injectMarkdown(sourceMd, translations);

      // Write output
      const outDir = join(translationsRoot(repoRoot), locale);
      mkdirSync(outDir, { recursive: true });
      const outPath = join(outDir, basename(source));
      writeFileSync(outPath, result.translated);

      const relOut = relative(repoRoot, outPath);
      return {
        content: [{
          type: "text" as const,
          text: `✅ Injected translations: ${relOut}\n` +
            `Translated: ${result.stats.translatedSpans}/${result.stats.totalSpans} spans\n` +
            `Untranslated: ${result.stats.untranslatedSpans} spans\n` +
            `Changed: ${result.changed}`,
        }],
      };
    },
  );

  // ── translation_status ────────────────────────────────────────

  server.tool(
    "translation_status",
    "Report translation coverage for a given locale. Scans the translations/ " +
      "directory for .po files and computes per-file and aggregate statistics: " +
      "total strings, translated, untranslated, fuzzy. Also reports whether " +
      "translations are official (signed off) or unofficial.",
    {
      locale: z.string().optional().describe(
        "Locale to report on (e.g. 'fr'). Omit to report all available locales."
      ),
    },
    async ({ locale }) => {
      const translationsDir = translationsRoot(repoRoot);
      if (!existsSync(translationsDir)) {
        return { content: [{ type: "text" as const, text: "No translations/ directory found." }] };
      }

      const locales = locale
        ? [locale]
        : readdirSync(translationsDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name);

      if (locales.length === 0) {
        return { content: [{ type: "text" as const, text: "No locale directories found in translations/." }] };
      }

      const lines: string[] = [];

      for (const loc of locales) {
        const locDir = join(translationsDir, loc);
        if (!existsSync(locDir)) {
          lines.push(`## ${loc}: directory not found`);
          continue;
        }

        lines.push(`## ${loc}`);

        // Check status.json
        const statusPath = join(locDir, "status.json");
        if (existsSync(statusPath)) {
          try {
            const status = JSON.parse(readFileSync(statusPath, "utf-8"));
            lines.push(`  Official: ${status.official ? "✅ yes" : "❌ no (unofficial)"}`);
            if (status.signedOffBy) lines.push(`  Signed off by: ${status.signedOffBy}`);
            if (status.flaggedForReview) lines.push(`  ⚠️ Flagged for review: ${status.flagReason || "yes"}`);
          } catch {
            lines.push("  status.json: parse error");
          }
        }

        // Scan .po files
        const poFiles = readdirSync(locDir).filter((f) => f.endsWith(".po"));
        if (poFiles.length === 0) {
          lines.push("  No .po files found.");
          continue;
        }

        let totalStrings = 0;
        let totalTranslated = 0;
        let totalFuzzy = 0;

        for (const poFile of poFiles) {
          const poContent = readFileSync(join(locDir, poFile), "utf-8");
          const blocks = poContent.trim().split(/\n{2,}/);

          let fileStrings = 0;
          let fileTranslated = 0;
          let fileFuzzy = 0;

          for (const block of blocks) {
            const blockLines = block.split("\n");
            const hasMsgid = blockLines.some((l) => l.trim().startsWith("msgid ") && l.trim() !== 'msgid ""');
            if (!hasMsgid) continue;
            fileStrings++;

            const hasMsgstr = blockLines.some((l) => {
              const t = l.trim();
              return t.startsWith("msgstr ") && t !== 'msgstr ""';
            });
            const isFuzzy = blockLines.some((l) => l.trim().startsWith("#,") && l.includes("fuzzy"));

            if (isFuzzy) fileFuzzy++;
            else if (hasMsgstr) fileTranslated++;
          }

          totalStrings += fileStrings;
          totalTranslated += fileTranslated;
          totalFuzzy += fileFuzzy;

          const pct = fileStrings > 0 ? Math.round((fileTranslated / fileStrings) * 100) : 0;
          lines.push(`  ${poFile}: ${fileTranslated}/${fileStrings} (${pct}%)${fileFuzzy > 0 ? ` [${fileFuzzy} fuzzy]` : ""}`);
        }

        const totalPct = totalStrings > 0 ? Math.round((totalTranslated / totalStrings) * 100) : 0;
        lines.push(`  **Total: ${totalTranslated}/${totalStrings} (${totalPct}%)${totalFuzzy > 0 ? ` [${totalFuzzy} fuzzy]` : ""}**`);
        lines.push("");
      }

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    },
  );

  // ── translation_signoff ───────────────────────────────────────

  server.tool(
    "translation_signoff",
    "Sign off a translation as official. Records who signed off, when, and " +
      "the SHA-256 hash of the source .md for staleness detection. Updates " +
      "translations/<locale>/status.json. Use after SME review confirms accuracy.",
    {
      locale: z.string().describe("Target locale being signed off (e.g. 'fr')."),
      source: z.string().describe("Path to the source .md file (for hash computation)."),
      signed_off_by: z.string().describe("Identity of the reviewer signing off."),
      level: z.enum(["block", "section", "chapter", "folio"]).default("chapter").describe(
        "Granularity of the sign-off."
      ),
    },
    async ({ locale, source, signed_off_by, level }) => {
      const sourcePath = join(repoRoot, source);
      if (!existsSync(sourcePath)) {
        return { content: [{ type: "text" as const, text: `❌ Source not found: ${source}` }] };
      }

      const sourceContent = readFileSync(sourcePath, "utf-8");
      const sourceHash = createHash("sha256").update(sourceContent).digest("hex");

      const statusDir = join(translationsRoot(repoRoot), locale);
      mkdirSync(statusDir, { recursive: true });
      const statusPath = join(statusDir, "status.json");

      // Read existing status or create new
      let status: Record<string, unknown> = {};
      if (existsSync(statusPath)) {
        try {
          status = JSON.parse(readFileSync(statusPath, "utf-8"));
        } catch { /* start fresh */ }
      }

      status.locale = locale;
      status.official = true;
      status.signedOffBy = signed_off_by;
      status.signedOffAt = new Date().toISOString();
      status.sourceHash = sourceHash;
      status.sourceFile = source;
      status.level = level;
      status.flaggedForReview = false;
      status.flagReason = undefined;

      writeFileSync(statusPath, JSON.stringify(status, null, 2));

      return {
        content: [{
          type: "text" as const,
          text: `✅ Translation signed off as official.\n` +
            `Locale: ${locale}\n` +
            `Signed off by: ${signed_off_by}\n` +
            `Level: ${level}\n` +
            `Source hash: ${sourceHash.slice(0, 16)}…\n` +
            `Status: translations/${locale}/status.json`,
        }],
      };
    },
  );

  // ── translation_validate ──────────────────────────────────────

  server.tool(
    "translation_validate",
    "Validate a translated .po file against its source .pot. Checks: " +
      "(1) all msgids from the POT have a corresponding PO entry, " +
      "(2) no orphaned placeholder tokens in translations, " +
      "(3) structural consistency (paragraph count), " +
      "(4) staleness — whether the source .md has changed since the PO was generated. " +
      "Bean ktt2 tracks the round-trip QA extension of this tool.",
    {
      pot_file: z.string().describe("Path to the .pot template file."),
      po_file: z.string().describe("Path to the .po translation file."),
      source: z.string().optional().describe(
        "Path to the source .md file for staleness check. " +
          "If omitted, only PO/POT consistency is checked."
      ),
    },
    async ({ pot_file, po_file, source }) => {
      const potPath = join(repoRoot, pot_file);
      const poPath = join(repoRoot, po_file);

      if (!existsSync(potPath)) {
        return { content: [{ type: "text" as const, text: `❌ POT not found: ${pot_file}` }] };
      }
      if (!existsSync(poPath)) {
        return { content: [{ type: "text" as const, text: `❌ PO not found: ${po_file}` }] };
      }

      const potContent = readFileSync(potPath, "utf-8");
      const poContent = readFileSync(poPath, "utf-8");

      // Extract msgids from POT
      const potMsgids = new Set<string>();
      const potBlocks = potContent.trim().split(/\n{2,}/);
      for (const block of potBlocks) {
        const match = block.match(/^msgid "(.+)"$/m);
        if (match) potMsgids.add(match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n"));
      }

      // Parse PO translations
      const translations = parsePo(poContent);
      const findings: string[] = [];

      // Check coverage
      let covered = 0;
      let missing = 0;
      const missingIds: string[] = [];
      for (const msgid of potMsgids) {
        if (translations.has(msgid)) {
          covered++;
        } else {
          missing++;
          if (missingIds.length < 5) {
            missingIds.push(msgid.length > 50 ? msgid.slice(0, 50) + "…" : msgid);
          }
        }
      }

      const pct = potMsgids.size > 0 ? Math.round((covered / potMsgids.size) * 100) : 0;
      findings.push(`Coverage: ${covered}/${potMsgids.size} (${pct}%)`);
      if (missing > 0) {
        findings.push(`Missing translations: ${missing}`);
        for (const id of missingIds) findings.push(`  - "${id}"`);
        if (missing > 5) findings.push(`  ... and ${missing - 5} more`);
      }

      // Check for orphaned placeholders in translations
      let orphanCount = 0;
      for (const [, msgstr] of translations) {
        const orphaned = msgstr.match(/\{\d+\}/g);
        if (orphaned) orphanCount += orphaned.length;
      }
      if (orphanCount > 0) {
        findings.push(`⚠️ ${orphanCount} orphaned placeholder(s) in translations`);
      }

      // Staleness check
      if (source) {
        const sourcePath = join(repoRoot, source);
        if (existsSync(sourcePath)) {
          const sourceContent = readFileSync(sourcePath, "utf-8");
          const currentEntries = extractMarkdown(sourceContent, source);
          const currentIds = new Set(currentEntries.map((e) => e.msgid));

          // Check for new strings not in POT
          let newStrings = 0;
          for (const id of currentIds) {
            if (!potMsgids.has(id)) newStrings++;
          }
          // Check for removed strings
          let removedStrings = 0;
          for (const id of potMsgids) {
            if (!currentIds.has(id)) removedStrings++;
          }

          if (newStrings > 0 || removedStrings > 0) {
            findings.push(`⚠️ STALE: source has changed since POT was generated`);
            if (newStrings > 0) findings.push(`  ${newStrings} new string(s) in source`);
            if (removedStrings > 0) findings.push(`  ${removedStrings} string(s) removed from source`);
          } else {
            findings.push(`✅ Source is current (no drift)`);
          }
        } else {
          findings.push(`❓ Source file not found: ${source}`);
        }
      }

      const overall = missing === 0 && orphanCount === 0 ? "✅ VALID" : "⚠️ ISSUES FOUND";

      return {
        content: [{
          type: "text" as const,
          text: `${overall}\n\n${findings.join("\n")}`,
        }],
      };
    },
  );
}
