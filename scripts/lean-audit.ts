#!/usr/bin/env bun
/**
 * Deep Lean content block audit.
 *
 * Produces a chapter-by-chapter summary of Lean formalization status:
 *   - sorry inventory (with citation check)
 *   - trivial truth detection (True := by trivial)
 *   - axiom inventory
 *   - witness staleness (commit SHA comparison)
 *   - missing .lean files for blocks that require them
 *
 * Usage:
 *   bun run scripts/lean-audit.ts                    # full audit, console output
 *   bun run scripts/lean-audit.ts --json             # JSON output
 *   bun run scripts/lean-audit.ts --chapter ch5      # filter to one chapter
 *   bun run scripts/lean-audit.ts --strict           # exit 1 on uncited sorries
 *   bun run scripts/lean-audit.ts --strict --check-axioms  # also fail on axioms
 *
 * @module scripts/lean-audit
 */

import { readFileSync, existsSync } from "fs";
import { resolve, basename, dirname, relative } from "path";
import { globSync } from "glob";
import { execSync } from "child_process";
import { isWitnessed, leanFileHash, isStale } from "./lean-witness";

const REPO_ROOT = resolve(import.meta.dir, "..");
const CONTENT_ROOT = resolve(REPO_ROOT, "content");

// ── Types ────────────────────────────────────────────────────────

interface SorryEntry {
  file: string;
  line: number;
  context: string;       // surrounding lines for context
  hasCitation: boolean;
  citation?: string;      // extracted citation text
}

interface TrivialEntry {
  file: string;
  line: number;
  statement: string;
}

interface AxiomEntry {
  file: string;
  line: number;
  name: string;
  hasCitation: boolean;
}

interface LeanFileStatus {
  file: string;           // relative to repo root
  lines: number;
  codeLines: number;      // non-comment, non-blank
  sorries: SorryEntry[];
  trivials: TrivialEntry[];
  axioms: AxiomEntry[];
  hash: string;
  witnessed: boolean;
  commitSha?: string;     // from witness file if it exists
  stale: boolean;         // hash mismatch with witness
}

interface ChapterAudit {
  chapter: string;
  siblingFiles: LeanFileStatus[];  // chapter-dir .lean files
  buildFiles: LeanFileStatus[];    // lean/ build system files
  totalSorries: number;
  uncitedSorries: number;
  trivialTruths: number;
  axiomCount: number;
  witnessedCount: number;
  staleCount: number;
  totalFiles: number;
}

interface AuditReport {
  generatedAt: string;
  currentCommitSha: string;
  paper: string;
  chapters: ChapterAudit[];
  summary: {
    totalLeanFiles: number;
    totalSorries: number;
    uncitedSorries: number;
    trivialTruths: number;
    axiomCount: number;
    witnessedCount: number;
    staleCount: number;
    pendingCount: number;
  };
}

// ── Helpers ──────────────────────────────────────────────────────

function getCurrentCommitSha(): string {
  try {
    return execSync("git rev-parse HEAD", { cwd: REPO_ROOT })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

function getFileCommitSha(filePath: string): string {
  try {
    return execSync(`git log -1 --format=%H -- "${filePath}"`, {
      cwd: REPO_ROOT,
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

function countCodeLines(content: string): number {
  return content
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed.length > 0 &&
        !trimmed.startsWith("--") &&
        !trimmed.startsWith("/-") &&
        !trimmed.startsWith("-/")
      );
    }).length;
}

function extractSorries(filePath: string, content: string): SorryEntry[] {
  const lines = content.split("\n");
  const entries: SorryEntry[] = [];

  // Track block-comment depth across lines so `sorry` mentions inside
  // `/- … -/` or `/-! … -/` blocks (including multi-line module
  // docstrings) are skipped.  Lean nests block comments, so we count.
  let blockDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Update block-comment depth based on this line's openers/closers.
    // Lean nests block comments, so we count `/-` (which matches `/--`
    // docstrings too) against `-/`.  We deliberately do NOT strip
    // `--` line comments first: doing so would also strip the leading
    // `/` of `/--`, breaking the open count.  Stray `/-` inside line
    // comments is vanishingly rare in QOU.
    const opens = (line.match(/\/-/g) || []).length;
    const closes = (line.match(/-\//g) || []).length;
    const wasInBlock = blockDepth > 0;
    // Approximation: if the line both opens and closes balanced, the
    // sorry on that line is still "inside" the comment for our purposes.
    const startedInBlock = wasInBlock || line.trimStart().startsWith("/-");
    blockDepth = Math.max(0, blockDepth + opens - closes);
    const endsInBlock = blockDepth > 0;

    // Match sorry as a term (not in comments about sorry)
    if (
      /\bsorry\b/.test(line) &&
      !trimmed.startsWith("--") &&
      !trimmed.startsWith("/-") &&
      !/sorry-free|sorryFree|sorry_free|not sorry|no sorry|without\s+(any\s+)?sorry|No sorry|Proved.*not sorry|role of `?sorry`?/i.test(
        line
      )
    ) {
      // Skip if the line entered while inside a block comment (the
      // body of the `/- … -/` block, even if `-/` closes on this very
      // line — the `sorry` text is still part of the comment body).
      if (wasInBlock) {
        continue;
      }
      // Skip if the line both opens AND remains inside a block comment.
      if (startedInBlock && endsInBlock) {
        continue;
      }
      // Skip lines that are pure comments about sorry
      if (
        trimmed.startsWith("--") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("/-!")
      ) {
        continue;
      }
      // Skip type-ascription placeholders like `(sorry : SomeType)` —
      // these are header-position term holes, not proof obligations.
      // They still count as sorries (the file isn't sorry-free), but
      // they don't need a `Ref:` citation; flag them with a distinct
      // marker so the audit summary doesn't conflate them with proof
      // bodies.
      if (/\(\s*sorry\s*:\s*[^)]+\)/.test(line)) {
        entries.push({
          file: relative(REPO_ROOT, filePath),
          line: i + 1,
          context: line.trim(),
          hasCitation: true, // not a proof obligation; suppress NO CITATION
          citation: "(type-ascription placeholder)",
        });
        continue;
      }

      // Look for citation in same line, previous up-to-10 lines, or
      // next 2 lines.  QOU convention: the `-- Ref: [key]` line often
      // sits at the top of the proof body, separated from the `sorry`
      // by several explanatory comment lines (cf. `MarkovTrace.lean`).
      // A 10-line lookback covers the common case without sweeping in
      // unrelated `Ref:` citations from sibling proofs (which are
      // separated by `theorem`/`def`/blank-line boundaries far more
      // than 10 lines apart in practice).
      const contextLines: string[] = [];
      for (let k = Math.max(0, i - 10); k < i; k++) contextLines.push(lines[k]);
      contextLines.push(line);
      if (i + 1 < lines.length) contextLines.push(lines[i + 1]);
      if (i + 2 < lines.length) contextLines.push(lines[i + 2]);
      const context = contextLines.join("\n");
      // Primary: explicit Ref: [key] citation format
      const explicitCitation = context.match(
        /Ref:\s*\[([^\]]+)\]/i
      );
      // Secondary: other citation signals (weaker confidence)
      const implicitCitation = !explicitCitation
        ? context.match(/requires|blocked|manuscript|conjecture/i)
        : null;

      entries.push({
        file: relative(REPO_ROOT, filePath),
        line: i + 1,
        context: context.trim(),
        hasCitation: !!(explicitCitation || implicitCitation),
        citation: explicitCitation
          ? explicitCitation[0]
          : implicitCitation
            ? implicitCitation[0]
            : undefined,
      });
    }
  }
  return entries;
}

function extractTrivials(filePath: string, content: string): TrivialEntry[] {
  const lines = content.split("\n");
  const entries: TrivialEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/True\s*:=\s*by\s*trivial/.test(line)) {
      entries.push({
        file: relative(REPO_ROOT, filePath),
        line: i + 1,
        statement: line.trim(),
      });
    }
  }
  return entries;
}

function extractAxioms(filePath: string, content: string): AxiomEntry[] {
  const lines = content.split("\n");
  const entries: AxiomEntry[] = [];

  // Same block-comment depth tracker as `extractSorries` so docstring
  // mentions of the word "axiom" (e.g. "Markov axiom and normalisation")
  // do not register as `axiom` declarations.
  let blockDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const opens = (line.match(/\/-/g) || []).length;
    const closes = (line.match(/-\//g) || []).length;
    const wasInBlock = blockDepth > 0;
    blockDepth = Math.max(0, blockDepth + opens - closes);

    if (wasInBlock) continue;
    if (line.trim().startsWith("--")) continue;

    if (/^axiom\s+\w|^\s+axiom\s+\w/.test(line)) {
      const nameMatch = line.match(/axiom\s+(\w+)/);
      const name = nameMatch ? nameMatch[1] : "unknown";

      // Check for citation in nearby lines
      const contextLines = [
        i >= 2 ? lines[i - 2] : "",
        i >= 1 ? lines[i - 1] : "",
        line,
        i + 1 < lines.length ? lines[i + 1] : "",
      ];
      const context = contextLines.join("\n");
      const hasCitation =
        /Ref:|citation|doi|https?:|manuscript/i.test(context);

      entries.push({
        file: relative(REPO_ROOT, filePath),
        line: i + 1,
        name,
        hasCitation,
      });
    }
  }
  return entries;
}

function auditLeanFile(filePath: string): LeanFileStatus {
  const content = readFileSync(filePath, "utf-8");
  const witnessResult = isWitnessed(filePath);

  // Use shared isStale() for consistent staleness detection
  const staleResult = isStale(filePath);
  const stale = staleResult.stale;
  const witnessCommitSha = staleResult.witnessCommitSha;

  return {
    file: relative(REPO_ROOT, filePath),
    lines: content.split("\n").length,
    codeLines: countCodeLines(content),
    sorries: extractSorries(filePath, content),
    trivials: extractTrivials(filePath, content),
    axioms: extractAxioms(filePath, content),
    hash: witnessResult.hash,
    witnessed: witnessResult.witnessed,
    commitSha: witnessCommitSha,
    stale,
  };
}

// ── Chapter mapping ──────────────────────────────────────────────

function getChapterName(dir: string): string {
  // Extract chapter name from directory path
  const parts = dir.split("/");
  return parts[parts.length - 1] || dir;
}

// Map build-system lean files to chapters based on module path
function mapBuildFileToChapter(filePath: string): string {
  const rel = relative(CONTENT_ROOT, filePath);
  if (rel.includes("QOU/QuantumObservableUniverse")) return "ch1-quantum-observable-universe";
  if (rel.includes("QOU/Torsion")) return "ch3-lifting-of-quantum-torsion";
  if (rel.includes("QOU/Descartes/")) return "ch6-descartes-universe";
  if (rel.includes("QOU/PathIntegrals") || rel.includes("QOU/KnotTheory") || rel.includes("QOU/KnotRegistry"))
    return "ch4-path-integrals-and-braiding";
  if (rel.includes("QOU/BringsSurface")) return "ch5-brings-surface";
  if (rel.includes("QOU/DescartesUniverse")) return "ch6-descartes-universe";
  if (rel.includes("QOU/GaugeFieldFluidDynamics")) return "ch10-fluid-dynamics";
  if (rel.includes("QOU/InformationTheory")) return "ch9-information-theory";
  if (rel.includes("QOU/QGeometricLanglands")) return "ch11-q-geometric-langlands";
  if (rel.includes("QOU/Glossary")) return "ch8-glossary";
  if (rel.includes("QOU/HadronicMass") || rel.includes("QOU/AtomicMass") || rel.includes("QOU/MassDerivation"))
    return "ch7-observations";
  if (rel.includes("QOU/CODATAChain")) return "ch7-observations";
  if (rel.includes("QOU/RepresentationTheory")) return "ch2-quantum-geometry";
  if (rel.includes("QOU/Calculations") || rel.includes("QOU/MathConstants")) return "shared";
  return "core";
}

// ── Main audit ───────────────────────────────────────────────────

function runAudit(paperDir: string, chapterFilter?: string): AuditReport {
  const paperPath = resolve(CONTENT_ROOT, paperDir);
  const currentCommit = getCurrentCommitSha();

  // Find all chapter directories
  const chapterDirs = globSync("ch*", {
    cwd: paperPath,
    absolute: true,
  }).filter((d) => {
    try {
      return existsSync(d);
    } catch {
      return false;
    }
  });

  // Find all lean build files
  const buildLeanFiles = globSync("lean/**/*.lean", {
    cwd: paperPath,
    absolute: true,
  }).filter((f) => !f.includes(".lake/"));

  // Group by chapter
  const chapterMap = new Map<string, ChapterAudit>();

  // Initialize chapters from directories
  for (const dir of chapterDirs) {
    const name = getChapterName(dir);
    if (chapterFilter && !name.includes(chapterFilter)) continue;

    const siblingLeanFiles = globSync("*.lean", {
      cwd: dir,
      absolute: true,
    });

    const siblingStatuses = siblingLeanFiles.map(auditLeanFile);

    chapterMap.set(name, {
      chapter: name,
      siblingFiles: siblingStatuses,
      buildFiles: [],
      totalSorries: siblingStatuses.reduce(
        (sum, f) => sum + f.sorries.length,
        0
      ),
      uncitedSorries: siblingStatuses.reduce(
        (sum, f) => sum + f.sorries.filter((s) => !s.hasCitation).length,
        0
      ),
      trivialTruths: siblingStatuses.reduce(
        (sum, f) => sum + f.trivials.length,
        0
      ),
      axiomCount: siblingStatuses.reduce(
        (sum, f) => sum + f.axioms.length,
        0
      ),
      witnessedCount: siblingStatuses.filter((f) => f.witnessed).length,
      staleCount: siblingStatuses.filter((f) => f.stale).length,
      totalFiles: siblingStatuses.length,
    });
  }

  // Add build files to chapters
  for (const bf of buildLeanFiles) {
    const chapter = mapBuildFileToChapter(bf);
    if (chapterFilter && !chapter.includes(chapterFilter)) continue;

    const status = auditLeanFile(bf);

    if (!chapterMap.has(chapter)) {
      chapterMap.set(chapter, {
        chapter,
        siblingFiles: [],
        buildFiles: [],
        totalSorries: 0,
        uncitedSorries: 0,
        trivialTruths: 0,
        axiomCount: 0,
        witnessedCount: 0,
        staleCount: 0,
        totalFiles: 0,
      });
    }

    const ch = chapterMap.get(chapter)!;
    ch.buildFiles.push(status);
    ch.totalSorries += status.sorries.length;
    ch.uncitedSorries += status.sorries.filter((s) => !s.hasCitation).length;
    ch.trivialTruths += status.trivials.length;
    ch.axiomCount += status.axioms.length;
    if (status.witnessed) ch.witnessedCount++;
    if (status.stale) ch.staleCount++;
    ch.totalFiles++;
  }

  const chapters = Array.from(chapterMap.values()).sort((a, b) =>
    a.chapter.localeCompare(b.chapter)
  );

  const summary = {
    totalLeanFiles: chapters.reduce((s, c) => s + c.totalFiles, 0),
    totalSorries: chapters.reduce((s, c) => s + c.totalSorries, 0),
    uncitedSorries: chapters.reduce((s, c) => s + c.uncitedSorries, 0),
    trivialTruths: chapters.reduce((s, c) => s + c.trivialTruths, 0),
    axiomCount: chapters.reduce((s, c) => s + c.axiomCount, 0),
    witnessedCount: chapters.reduce((s, c) => s + c.witnessedCount, 0),
    staleCount: chapters.reduce((s, c) => s + c.staleCount, 0),
    pendingCount: 0,
  };
  summary.pendingCount =
    summary.totalLeanFiles - summary.witnessedCount - summary.staleCount;

  return {
    generatedAt: new Date().toISOString(),
    currentCommitSha: currentCommit,
    paper: paperDir,
    chapters,
    summary,
  };
}

// ── Console output ───────────────────────────────────────────────

function printReport(report: AuditReport) {
  console.log(`\n${"═".repeat(72)}`);
  console.log(`  LEAN CONTENT BLOCK AUDIT — ${report.paper}`);
  console.log(`  Generated: ${report.generatedAt}`);
  console.log(`  Commit: ${report.currentCommitSha}`);
  console.log(`${"═".repeat(72)}\n`);

  // Summary table
  console.log("## Summary\n");
  console.log(`  Total .lean files:     ${report.summary.totalLeanFiles}`);
  console.log(`  Total sorries:         ${report.summary.totalSorries}`);
  console.log(
    `  Uncited sorries:       ${report.summary.uncitedSorries}  ⚠️`
  );
  console.log(`  Trivial truths:        ${report.summary.trivialTruths}  ⚠️`);
  console.log(`  Axiom declarations:    ${report.summary.axiomCount}`);
  console.log(`  Witnessed (built):     ${report.summary.witnessedCount}`);
  console.log(`  Stale witnesses:       ${report.summary.staleCount}`);
  console.log(`  Pending (not built):   ${report.summary.pendingCount}`);
  console.log();

  // Chapter-by-chapter
  for (const ch of report.chapters) {
    const statusIcon =
      ch.totalSorries === 0 && ch.trivialTruths === 0
        ? "✅"
        : ch.uncitedSorries > 0 || ch.trivialTruths > 0
          ? "🔴"
          : "🟡";

    console.log(
      `\n### ${statusIcon} ${ch.chapter}  (${ch.totalFiles} files, ${ch.totalSorries} sorries)`
    );

    if (ch.siblingFiles.length > 0) {
      console.log(`  Sibling .lean files: ${ch.siblingFiles.length}`);
    }
    if (ch.buildFiles.length > 0) {
      console.log(`  Build system files:  ${ch.buildFiles.length}`);
    }

    // List sorries
    if (ch.totalSorries > 0) {
      console.log(`\n  Sorries:`);
      const allFiles = [...ch.siblingFiles, ...ch.buildFiles];
      for (const f of allFiles) {
        for (const s of f.sorries) {
          const icon = s.hasCitation ? "📎" : "❌";
          const cite = s.citation ? ` (${s.citation})` : " — NO CITATION";
          console.log(`    ${icon} ${basename(s.file)}:${s.line}${cite}`);
        }
      }
    }

    // List trivial truths
    if (ch.trivialTruths > 0) {
      console.log(`\n  Trivial truths (placeholders):`);
      const allFiles = [...ch.siblingFiles, ...ch.buildFiles];
      for (const f of allFiles) {
        for (const t of f.trivials) {
          console.log(`    🚫 ${basename(t.file)}:${t.line} — ${t.statement}`);
        }
      }
    }

    // List axioms
    if (ch.axiomCount > 0) {
      console.log(`\n  Axioms (${ch.axiomCount}):`);
      const allFiles = [...ch.siblingFiles, ...ch.buildFiles];
      for (const f of allFiles) {
        for (const a of f.axioms) {
          const icon = a.hasCitation ? "📎" : "⚠️";
          console.log(`    ${icon} ${basename(a.file)}:${a.line} — axiom ${a.name}`);
        }
      }
    }

    // Witness status
    const allFiles = [...ch.siblingFiles, ...ch.buildFiles];
    const witnessedFiles = allFiles.filter((f) => f.witnessed && !f.stale);
    const staleFiles = allFiles.filter((f) => f.stale);
    const pendingFiles = allFiles.filter((f) => !f.witnessed && !f.stale);

    if (staleFiles.length > 0) {
      console.log(`\n  Stale witnesses (need rebuild):`);
      for (const f of staleFiles) {
        console.log(`    🔄 ${basename(f.file)} (hash: ${f.hash})`);
      }
    }
  }

  console.log(`\n${"═".repeat(72)}`);
  console.log(`  END OF AUDIT`);
  console.log(`${"═".repeat(72)}\n`);
}

// ── CLI ──────────────────────────────────────────────────────────

const HELP_TEXT = `
Usage: bun run scripts/lean-audit.ts [options]

Options:
  --json              Emit the audit report as JSON instead of pretty text.
  --chapter <id>      Filter to a single chapter (e.g. "ch5", "core").
  --strict            Exit with status 1 if any uncited sorry is found.
                      Implies --check-axioms unless --no-axioms is given.
  --check-axioms      In --strict mode, also fail on any non-zero axiom
                      count. (Standalone: no effect on default reporting.)
  --no-axioms         In --strict mode, do NOT fail on axiom count
                      (uncited-sorry-only gate).
  --help, -h          Show this help.

Exit codes:
  0  audit clean (or --strict not given)
  1  --strict: at least one uncited sorry (and/or axiom) was found
  2  CLI usage error (e.g. --chapter without a value)
`.trim();

if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const jsonMode = args.includes("--json");
  const strictMode = args.includes("--strict");
  const checkAxioms = args.includes("--check-axioms");
  const noAxioms = args.includes("--no-axioms");

  if (checkAxioms && noAxioms) {
    console.error("Error: --check-axioms and --no-axioms are mutually exclusive.");
    process.exit(2);
  }

  const chapterIdx = args.indexOf("--chapter");
  if (chapterIdx >= 0 && (chapterIdx + 1 >= args.length || args[chapterIdx + 1].startsWith("--"))) {
    console.error("Error: --chapter requires a chapter id (e.g. --chapter ch5).");
    process.exit(2);
  }
  const chapterFilter =
    chapterIdx >= 0 ? args[chapterIdx + 1] : undefined;

  const report = runAudit("quantum-observable-universe", chapterFilter);

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
  }

  if (strictMode) {
    // Default: gate on uncited sorries.  Axiom gate only when explicitly
    // requested via --check-axioms; suppressed by --no-axioms.
    const failOnAxioms = checkAxioms && !noAxioms;
    const failures: string[] = [];
    if (report.summary.uncitedSorries > 0) {
      failures.push(
        `${report.summary.uncitedSorries} uncited sorr${report.summary.uncitedSorries === 1 ? "y" : "ies"} (need \`-- Ref: [key] url\`)`,
      );
    }
    if (failOnAxioms && report.summary.axiomCount > 0) {
      failures.push(`${report.summary.axiomCount} axiom declaration(s)`);
    }
    if (failures.length > 0) {
      console.error("");
      console.error("──────────────────────────────────────────────────");
      console.error("STRICT MODE: audit failed");
      for (const f of failures) console.error("  - " + f);
      console.error("──────────────────────────────────────────────────");
      process.exit(1);
    }
  }
}

export { runAudit, type AuditReport, type ChapterAudit, type LeanFileStatus };
