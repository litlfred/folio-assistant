#!/usr/bin/env bun
/**
 * Unified witness audit — checks staleness for BOTH Lean and Python witnesses.
 *
 * For Lean witnesses:
 *   - Compares content hash in .witness file vs current .lean file content
 *   - Compares commitSha in witness vs current file's last git commit
 *
 * For Python computation witnesses:
 *   - Compares scriptHash in .witness.json vs current .py file content
 *   - Identifies witnesses without structured format (legacy)
 *
 * Usage:
 *   bun run scripts/witness-audit.ts              # full audit
 *   bun run scripts/witness-audit.ts --json       # JSON output
 *   bun run scripts/witness-audit.ts --lean-only  # only Lean witnesses
 *   bun run scripts/witness-audit.ts --py-only    # only Python witnesses
 *
 * @module scripts/witness-audit
 */

import { readFileSync, existsSync } from "fs";
import { resolve, basename, dirname } from "path";
import { globSync } from "glob";
import { createHash } from "crypto";
import { execSync } from "child_process";

const REPO_ROOT = resolve(import.meta.dir, "..");

// ── Types ────────────────────────────────────────────────────────

interface WitnessStatus {
  file: string;
  type: "lean" | "python";
  stale: boolean;
  reason?: string;
  hasStructuredFormat: boolean;
  hasCommitSha: boolean;
  hasAssertions: boolean;
  scriptFile?: string;
  contentBlock?: string;
}

interface WitnessAuditReport {
  generatedAt: string;
  commitSha: string;
  lean: {
    total: number;
    witnessed: number;
    stale: number;
    pending: number;
    entries: WitnessStatus[];
  };
  python: {
    total: number;
    structured: number;
    legacy: number;
    stale: number;
    withAssertions: number;
    withCommitSha: number;
    entries: WitnessStatus[];
  };
}

// ── Helpers ──────────────────────────────────────────────────────

function fileContentHash(filePath: string, length = 12): string {
  const content = readFileSync(filePath, "utf-8");
  return createHash("sha256").update(content).digest("hex").slice(0, length);
}

function gitHeadSha(): string {
  try {
    return execSync("git rev-parse HEAD", { cwd: REPO_ROOT }).toString().trim();
  } catch {
    return "unknown";
  }
}

/**
 * Batch-query git for the last commit SHA of multiple files.
 * Single `git log` call instead of one per file (~20x faster).
 */
function gitFileShas(filePaths: string[]): Map<string, string> {
  const perFile = new Map<string, string>();
  if (filePaths.length === 0) return perFile;

  try {
    for (const fp of filePaths) {
      if (!perFile.has(fp)) {
        perFile.set(fp, "unknown");
      }
    }

    // Use git log with format that gives us file→commit mapping
    const batchOutput = execSync(
      `git log --format="COMMIT %H" --name-only -- ${filePaths.map((f) => `"${f}"`).join(" ")}`,
      { cwd: REPO_ROOT, maxBuffer: 10 * 1024 * 1024 }
    ).toString();

    let currentCommit = "unknown";
    let unresolvedCount = filePaths.length;
    for (const line of batchOutput.split("\n")) {
      if (line.startsWith("COMMIT ")) {
        currentCommit = line.slice(7).trim();
      } else if (line.trim()) {
        const relPath = line.trim();
        // Only record the FIRST (most recent) commit per file
        if (perFile.has(relPath) && perFile.get(relPath) === "unknown") {
          perFile.set(relPath, currentCommit);
          unresolvedCount--;
          if (unresolvedCount <= 0) break;
        }
      }
    }

    return perFile;
  } catch {
    // Fallback: return "unknown" for all
    const fallback = new Map<string, string>();
    for (const fp of filePaths) {
      fallback.set(fp, "unknown");
    }
    return fallback;
  }
}

function gitFileSha(filePath: string): string {
  const result = gitFileShas([filePath]);
  return result.get(filePath) || "unknown";
}

// ── Lean witness audit ───────────────────────────────────────────

function auditLeanWitnesses(): WitnessStatus[] {
  const leanFiles = globSync("content/**/*.lean", {
    cwd: REPO_ROOT,
    absolute: true,
  }).filter((f) => !f.includes(".lake/"));

  const results: WitnessStatus[] = [];

  // Batch git query for all lean files at once (instead of per-file)
  const relLeanFiles = leanFiles.map((f) => f.replace(REPO_ROOT + "/", ""));
  const commitMap = gitFileShas(relLeanFiles);

  for (const lf of leanFiles) {
    const witnessFiles = globSync(`${lf}.*.witness`);
    if (witnessFiles.length === 0) continue; // no witness = pending, not stale

    const currentHash = fileContentHash(lf);
    const relPath = lf.replace(REPO_ROOT + "/", "");
    const fileCommit = commitMap.get(relPath) || "unknown";

    // Report exactly one status per .lean file (use the best-matching witness)
    const currentWitnessPath = `${lf}.${currentHash}.witness`;
    const hasCurrentWitness = witnessFiles.includes(currentWitnessPath);

    if (hasCurrentWitness) {
      try {
        const meta = JSON.parse(readFileSync(currentWitnessPath, "utf-8"));
        const status: WitnessStatus = {
          file: lf.replace(REPO_ROOT + "/", ""),
          type: "lean",
          stale: false,
          hasStructuredFormat: !!meta.commitSha,
          hasCommitSha: !!meta.commitSha,
          hasAssertions: false,
        };

        if (meta.fileCommitSha && meta.fileCommitSha !== fileCommit) {
          status.stale = true;
          status.reason = `file commit SHA changed (witness: ${meta.fileCommitSha.slice(0, 8)}, current: ${fileCommit.slice(0, 8)})`;
        }

        results.push(status);
      } catch {
        results.push({
          file: lf.replace(REPO_ROOT + "/", ""),
          type: "lean",
          stale: true,
          reason: "malformed witness file",
          hasStructuredFormat: false,
          hasCommitSha: false,
          hasAssertions: false,
        });
      }
    } else {
      // Witness exists but for a different (older) content hash
      results.push({
        file: lf.replace(REPO_ROOT + "/", ""),
        type: "lean",
        stale: true,
        reason: `content hash mismatch (no witness for current hash ${currentHash})`,
        hasStructuredFormat: false,
        hasCommitSha: false,
        hasAssertions: false,
      });
    }
  }
  return results;
}

// ── Python witness audit ─────────────────────────────────────────

function auditPythonWitnesses(): WitnessStatus[] {
  const witnessFiles = globSync("folio-assistant/computations/*.witness.json", {
    cwd: REPO_ROOT,
    absolute: true,
  });

  // Pre-collect all script paths for batch git query
  const scriptPaths: string[] = [];
  const witnessData: { wf: string; witness: any; scriptFile: string; scriptPath: string }[] = [];

  for (const wf of witnessFiles) {
    try {
      const witness = JSON.parse(readFileSync(wf, "utf-8"));
      const witnessName = basename(wf, ".witness.json");
      const scriptFile = witness.scriptFile || `${witnessName}.py`;
      const scriptPath = resolve(dirname(wf), scriptFile);
      witnessData.push({ wf, witness, scriptFile, scriptPath });
      if (existsSync(scriptPath)) {
        const relPath = scriptPath.replace(REPO_ROOT + "/", "");
        scriptPaths.push(relPath);
      }
    } catch {
      witnessData.push({ wf, witness: null, scriptFile: "", scriptPath: "" });
    }
  }

  // Single batch git query for all script files
  const commitMap = gitFileShas(scriptPaths);

  const results: WitnessStatus[] = [];

  for (const { wf, witness, scriptFile, scriptPath } of witnessData) {
    if (!witness) {
      results.push({
        file: wf.replace(REPO_ROOT + "/", ""),
        type: "python",
        stale: true,
        reason: "malformed witness JSON",
        hasStructuredFormat: false,
        hasCommitSha: false,
        hasAssertions: false,
      });
      continue;
    }

    const status: WitnessStatus = {
      file: wf.replace(REPO_ROOT + "/", ""),
      type: "python",
      stale: false,
      hasStructuredFormat: !!(witness.engine && witness.computedAt),
      hasCommitSha: !!(witness.commitSha || witness.git_sha),
      hasAssertions: Array.isArray(witness.assertions) && witness.assertions.length > 0,
      scriptFile,
      contentBlock: witness.contentBlock,
    };

    // Check scriptHash staleness
    if (witness.scriptHash && existsSync(scriptPath)) {
      const currentHash = fileContentHash(scriptPath);
      if (currentHash !== witness.scriptHash) {
        status.stale = true;
        status.reason = `script content changed (witness: ${witness.scriptHash}, current: ${currentHash})`;
      }
    }

    // Check commit SHA staleness (secondary signal) — uses batch result
    if (!status.stale && witness.scriptCommitSha && existsSync(scriptPath)) {
      const relPath = scriptPath.replace(REPO_ROOT + "/", "");
      const currentCommit = commitMap.get(relPath) || "unknown";
      if (
        witness.scriptCommitSha !== "unknown" &&
        currentCommit !== "unknown" &&
        witness.scriptCommitSha !== currentCommit
      ) {
        status.stale = true;
        status.reason = `script commit SHA changed (witness: ${witness.scriptCommitSha?.slice(0, 8)}, current: ${currentCommit.slice(0, 8)})`;
      }
    }

    results.push(status);
  }

  return results;
}

// ── Main ─────────────────────────────────────────────────────────

function runAudit(options: {
  leanOnly?: boolean;
  pyOnly?: boolean;
}): WitnessAuditReport {
  const leanResults = options.pyOnly ? [] : auditLeanWitnesses();
  const pyResults = options.leanOnly ? [] : auditPythonWitnesses();

  const leanTotal = globSync("content/**/*.lean", {
    cwd: REPO_ROOT,
  }).filter((f) => !f.includes(".lake/")).length;

  return {
    generatedAt: new Date().toISOString(),
    commitSha: gitHeadSha(),
    lean: {
      total: leanTotal,
      witnessed: leanResults.filter((r) => !r.stale).length,
      stale: leanResults.filter((r) => r.stale).length,
      pending: leanTotal - leanResults.length,
      entries: leanResults,
    },
    python: {
      total: pyResults.length,
      structured: pyResults.filter((r) => r.hasStructuredFormat).length,
      legacy: pyResults.filter((r) => !r.hasStructuredFormat).length,
      stale: pyResults.filter((r) => r.stale).length,
      withAssertions: pyResults.filter((r) => r.hasAssertions).length,
      withCommitSha: pyResults.filter((r) => r.hasCommitSha).length,
      entries: pyResults,
    },
  };
}

function printReport(report: WitnessAuditReport) {
  console.log(`\n${"═".repeat(72)}`);
  console.log(`  UNIFIED WITNESS AUDIT`);
  console.log(`  Generated: ${report.generatedAt}`);
  console.log(`  Commit: ${report.commitSha}`);
  console.log(`${"═".repeat(72)}\n`);

  // Lean section
  console.log("## Lean Witnesses\n");
  console.log(`  Total .lean files:     ${report.lean.total}`);
  console.log(`  Witnessed (valid):     ${report.lean.witnessed}`);
  console.log(`  Stale:                 ${report.lean.stale}`);
  console.log(`  Pending (no witness):  ${report.lean.pending}`);

  if (report.lean.entries.filter((e) => e.stale).length > 0) {
    console.log(`\n  Stale Lean witnesses:`);
    for (const e of report.lean.entries.filter((e) => e.stale)) {
      console.log(`    🔄 ${e.file} — ${e.reason}`);
    }
  }

  // Python section
  console.log("\n## Python Computation Witnesses\n");
  console.log(`  Total witnesses:       ${report.python.total}`);
  console.log(`  Structured format:     ${report.python.structured}`);
  console.log(`  Legacy (ad-hoc):       ${report.python.legacy}  ⚠️`);
  console.log(`  With assertions:       ${report.python.withAssertions}`);
  console.log(`  With commit SHA:       ${report.python.withCommitSha}`);
  console.log(`  Stale:                 ${report.python.stale}`);

  if (report.python.entries.filter((e) => e.stale).length > 0) {
    console.log(`\n  Stale Python witnesses:`);
    for (const e of report.python.entries.filter((e) => e.stale)) {
      console.log(`    🔄 ${basename(e.file)} — ${e.reason}`);
    }
  }

  if (report.python.entries.filter((e) => !e.hasStructuredFormat).length > 0) {
    console.log(`\n  Legacy witnesses (need migration to witness_base.py):`);
    for (const e of report.python.entries.filter(
      (e) => !e.hasStructuredFormat
    )) {
      console.log(`    📋 ${basename(e.file)}`);
    }
  }

  console.log(`\n${"═".repeat(72)}`);
  console.log(`  END OF WITNESS AUDIT`);
  console.log(`${"═".repeat(72)}\n`);
}

// ── CLI ──────────────────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const jsonMode = args.includes("--json");
  const leanOnly = args.includes("--lean-only");
  const pyOnly = args.includes("--py-only");

  const report = runAudit({ leanOnly, pyOnly });

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
  }
}

export { runAudit, type WitnessAuditReport, type WitnessStatus };
