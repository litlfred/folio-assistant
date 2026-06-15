#!/usr/bin/env bun
/**
 * Merge a batch of agent / human QA findings into the per-block
 * `<block>.qa.json` sidecars. Each finding appends a new entry to
 * the named criterion's reviewer-entry array. Prior entries are
 * NEVER deleted — multi-reviewer history is preserved.
 *
 * Input format (JSON, via stdin or `--file <path>`):
 *
 *   {
 *     "reviewer": { "kind": "agent", "id": "<agent-name>", "version": "<model-id>" },
 *     "findings": [
 *       {
 *         "block_md": "content/.../carbon-valence.md",
 *         "criterion": "voice-scholarly-default",
 *         "result": "pass" | "fail" | "warn" | "n/a",
 *         "severity": "critical" | "major" | "minor",   // omit on pass / n/a
 *         "evidence": "<file:line: quote>",             // omit on pass / n/a
 *         "notes": "<free-form rationale>"
 *       },
 *       ...
 *     ]
 *   }
 *
 * Usage:
 *
 *   bun run pipeline/qa-merge-findings.ts --file findings.json
 *   bun run pipeline/qa-merge-findings.ts < findings.json
 *
 * @module content/pipeline/qa-merge-findings
 */

import { readFileSync, existsSync } from "fs";
import { resolve, relative } from "path";
import { execSync } from "child_process";
import {
  hashBlockFiles,
  gitHeadSha,
  loadQaReport,
  saveQaReport,
  readBlockManifest,
} from "./qa-utils";
import { QA_CRITERIA_BY_ID } from "./qa-criteria-registry";
import type {
  BlockQaReport,
  QaCriterionEntry,
  QaReviewer,
} from "../../folio-assistant/schemas/block-qa";

interface FindingInput {
  block_md?: string;
  block_ts?: string;
  block_root?: string;
  criterion: string;
  result: "pass" | "fail" | "warn" | "n/a";
  severity?: "critical" | "major" | "minor";
  evidence?: string;
  notes?: string;
}

interface BatchInput {
  reviewer: QaReviewer;
  findings: FindingInput[];
}

function readStdin(): string {
  return readFileSync(0, "utf-8");
}

function parseArgs(argv: string[]): { file?: string } {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--file" && argv[i + 1]) return { file: argv[i + 1] };
  }
  return {};
}

/**
 * Repo root (one ancestor of `content/`). Resolved once via
 * `git rev-parse --show-toplevel`; falls back to the parent of
 * the current working directory if not in a git repo.
 */
function repoRoot(): string {
  try {
    return execSync("git rev-parse --show-toplevel", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return process.cwd();
  }
}

/**
 * Resolve a block path tolerantly. The script may be invoked from
 * repo root OR from `content/` (the conventional CWD for the other
 * pipeline CLIs). Findings JSON may use either prefix shape:
 *
 *   - `content/quantum-observable-universe/.../carbon-valence.md`
 *     (repo-root-relative, the natural form when the JSON is hand-
 *     authored)
 *   - `quantum-observable-universe/.../carbon-valence.md`
 *     (content-relative, the natural form when invoking other CLIs
 *     from `content/`)
 *
 * Resolution order:
 *   1. The path as given, resolved from the current CWD.
 *   2. The path as given, resolved from the repo root.
 *   3. With a leading `content/` prefix stripped, resolved from CWD.
 *   4. With a leading `content/` prefix prepended, resolved from CWD.
 *
 * Returns the first variant whose `<root>.ts` exists. If none
 * exist, returns the CWD-resolved form of the given path (so the
 * caller surfaces the original error).
 */
function resolveBlockRoot(input: string): string {
  const root = repoRoot();
  const candidates = [
    resolve(input),
    resolve(root, input),
    resolve(input.replace(/^content\//, "")),
    resolve("content", input),
  ];
  for (const c of candidates) {
    if (existsSync(c + ".ts")) return c;
  }
  return candidates[0];
}

function blockRootFromInput(f: FindingInput): string | undefined {
  if (f.block_root) return f.block_root;
  if (f.block_md) return f.block_md.replace(/\.md$/, "");
  if (f.block_ts) return f.block_ts.replace(/\.ts$/, "");
  return undefined;
}

function run(): void {
  const args = parseArgs(process.argv.slice(2));
  const raw = args.file ? readFileSync(args.file, "utf-8") : readStdin();
  let batch: BatchInput;
  try {
    batch = JSON.parse(raw);
  } catch (e) {
    const where = args.file ? `--file ${args.file}` : "stdin";
    console.error(`failed to parse JSON from ${where}: ${(e as Error).message}`);
    process.exit(2);
  }
  if (!batch.reviewer || !Array.isArray(batch.findings)) {
    console.error("input must have { reviewer, findings: [] }");
    process.exit(2);
  }
  if (batch.reviewer.kind !== "agent" && batch.reviewer.kind !== "human") {
    console.error("reviewer.kind must be 'agent' or 'human' (use qa-sweep.ts for scripts)");
    process.exit(2);
  }

  const headSha = gitHeadSha();
  const nowIso = new Date().toISOString();
  let added = 0;
  let skipped = 0;

  for (const f of batch.findings) {
    const root = blockRootFromInput(f);
    if (!root) {
      console.error("finding missing block_md / block_ts / block_root:", f);
      skipped++;
      continue;
    }
    const rootAbs = resolveBlockRoot(root);
    const tsPath = rootAbs + ".ts";
    const mdPath = rootAbs + ".md";
    const leanPath = rootAbs + ".lean";
    const qaPath = rootAbs + ".qa.json";
    if (!existsSync(tsPath)) {
      console.error(`no .ts manifest at ${tsPath}`);
      skipped++;
      continue;
    }
    const def = QA_CRITERIA_BY_ID[f.criterion];
    if (!def) {
      console.error(`unknown criterion: ${f.criterion}`);
      skipped++;
      continue;
    }

    const currentHashes = hashBlockFiles({
      md: existsSync(mdPath) ? mdPath : undefined,
      ts: tsPath,
      lean: existsSync(leanPath) ? leanPath : undefined,
    });

    let report: BlockQaReport | undefined = loadQaReport(qaPath);
    if (!report) {
      // Bootstrap a fresh sidecar — agent can write the first
      // entry even if qa-sweep hasn't run yet. Reuses the shared
      // `readBlockManifest` helper to extract { kind, label } in a
      // single file read.
      const manifest = readBlockManifest(tsPath);
      const label = manifest?.label ?? "unknown";
      const kind = manifest?.kind ?? "unknown";
      report = {
        $schema: "block-qa/v1",
        label,
        kind,
        paths: {
          ts: relative(process.cwd(), tsPath),
          md: existsSync(mdPath) ? relative(process.cwd(), mdPath) : undefined,
          lean: existsSync(leanPath)
            ? relative(process.cwd(), leanPath)
            : undefined,
        },
        source_hashes: currentHashes,
        criteria: {},
        updated_at: nowIso,
      };
    }
    // Refresh source hashes (best-effort).
    report.source_hashes = currentHashes;

    const entry: QaCriterionEntry = {
      field_hash: currentHashes,
      result: f.result,
      reviewer: batch.reviewer,
      reviewed_at: nowIso,
      reviewed_sha: headSha,
    };
    if (f.severity) entry.severity = f.severity;
    if (f.evidence) entry.evidence = f.evidence;
    if (f.notes) entry.notes = f.notes;

    const existing = report.criteria[f.criterion] ?? [];
    report.criteria[f.criterion] = [...existing, entry];
    report.updated_at = nowIso;
    saveQaReport(qaPath, report);
    added++;
  }

  console.log(
    JSON.stringify(
      {
        added,
        skipped,
        reviewer: batch.reviewer,
        head: headSha,
      },
      null,
      2,
    ),
  );
}

run();
