#!/usr/bin/env bun
/**
 * Append an agent (or human) reviewer entry to a block's QA sidecar.
 *
 * The adjudication counterpart of the script scanners: a sub-agent that
 * has read a block in full records its verdict per criterion without
 * hand-editing JSON. Entries are APPENDED to the criterion's array
 * (script candidates are preserved; the freshest entry whose field_hash
 * matches the current sources wins, per the block-qa/v1 convention).
 *
 *   bun run cat-harness/content/pipeline/qa-agent-entry.ts \
 *     --block   <path to block .md>            (required)
 *     --criterion <criterion-id>               (required)
 *     --result  pass|fail|warn|n/a             (required)
 *     [--severity critical|major|minor]
 *     [--evidence "<what was found / why the verdict>"]
 *     [--notes    "<fix applied / fix proposed / scope note>"]
 *     [--id       <reviewer id>]               (default: agent:session)
 *
 * The field_hash is computed from the block's CURRENT .md/.ts content,
 * so run this AFTER any prose fix, and the entry certifies the fixed
 * state.
 *
 * @module content/pipeline/qa-agent-entry
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, join } from "node:path";
import { blockQaPath, existingBlockQaPath } from "./qa-paths";
import { findContentRepoRoot } from "./repo-root";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const blockMd = arg("block");
const criterion = arg("criterion");
const result = arg("result");
const severity = arg("severity");
const evidence = arg("evidence");
const notes = arg("notes");
const reviewerId = arg("id") ?? "agent:session";

if (!blockMd || !criterion || !result) {
  console.error(
    "usage: qa-agent-entry.ts --block <block.md> --criterion <id> " +
      "--result pass|fail|warn|n/a [--severity ...] [--evidence ...] " +
      "[--notes ...] [--id ...]",
  );
  process.exit(2);
}
if (!["pass", "fail", "warn", "n/a"].includes(result)) {
  console.error(`invalid --result: ${result}`);
  process.exit(2);
}
if (!existsSync(blockMd)) {
  console.error(`no such block .md: ${blockMd}`);
  process.exit(2);
}

const dir = dirname(blockMd);
const root = basename(blockMd, ".md");
const tsPath = join(dir, `${root}.ts`);
// LOAD-THEN-WRITE, so the two halves use different helpers deliberately.
//
// The read falls back to the legacy sibling: this entry point appends one
// agent adjudication to an existing verdict, and a folio whose verdicts have
// not migrated would otherwise have its history silently discarded — the tool
// would read nothing, start an empty document, and overwrite.
//
// The write never falls back. It lands in the results tree, which is what
// makes running this once a MIGRATION rather than a fork: after it, the block
// has exactly one verdict and it is in the new place.
const repoRoot = findContentRepoRoot();
const blockRoot = join(dir, root);
const qaReadPath = existingBlockQaPath(repoRoot, blockRoot);
const qaPath = blockQaPath(repoRoot, blockRoot);

const sha12 = (s: string) =>
  createHash("sha256").update(s).digest("hex").slice(0, 12);

let reviewedSha = "unknown";
try {
  reviewedSha = execFileSync("git", ["rev-parse", "HEAD"]).toString().trim();
} catch {
  /* ignore */
}

interface QaEntry {
  field_hash: { md: string; ts?: string };
  result: string;
  severity?: string;
  evidence?: string;
  notes?: string;
  reviewer: { kind: string; id: string; version?: string };
  reviewed_at: string;
  reviewed_sha: string;
}
interface QaSidecarDoc {
  $schema?: string;
  criteria?: Record<string, QaEntry[]>;
  updated_at?: string;
  [k: string]: unknown;
}

let doc: QaSidecarDoc = {};
if (qaReadPath) {
  try {
    doc = JSON.parse(readFileSync(qaReadPath, "utf8")) as QaSidecarDoc;
  } catch {
    console.error(`unparseable sidecar (fix by hand first): ${qaReadPath}`);
    process.exit(1);
  }
}
doc.$schema ??= "block-qa/v1";
doc.criteria ??= {};
doc.criteria[criterion] ??= [];

const entry: QaEntry = {
  field_hash: {
    md: sha12(readFileSync(blockMd, "utf8")),
    ...(existsSync(tsPath) ? { ts: sha12(readFileSync(tsPath, "utf8")) } : {}),
  },
  result,
  reviewer: { kind: "agent", id: reviewerId, version: "v1" },
  reviewed_at: new Date().toISOString(),
  reviewed_sha: reviewedSha,
};
if (severity) entry.severity = severity;
if (evidence) entry.evidence = evidence;
if (notes) entry.notes = notes;

doc.criteria![criterion].push(entry);
doc.updated_at = entry.reviewed_at;
// The mirrored results directory is not guaranteed to exist for a block
// that has never had a verdict written under the new convention; the
// legacy sibling location always did, because it was the block's own.
mkdirSync(dirname(qaPath), { recursive: true });
writeFileSync(qaPath, JSON.stringify(doc, null, 2) + "\n");
console.log(`${qaPath}: ${criterion} <- agent ${result}`);
