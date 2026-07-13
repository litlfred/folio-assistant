/**
 * Agent-drain queue generator.
 *
 * Scans every content block under a paper root and emits a trackable
 * work-queue of the *agent-only* QA criteria that lack a fresh
 * agent/human entry (the sub-agent backlog). Automated criteria are
 * NOT included — those are drained mechanically by `qa-sweep.ts`.
 *
 * The queue is batched (default 25 blocks/batch, grouped by chapter)
 * so a fleet of sub-agents can each claim one batch, audit it, and
 * commit its own work to its own branch.
 *
 *   bun run content/pipeline/qa-agent-drain-queue.ts \
 *     content/quantum-observable-universe [--batch-size 25] \
 *     [--out todos/qa-agent-drain-queue.json]
 *
 * Output (todos/ is gitignored — a runtime artifact, regenerated on
 * demand): { total_gaps, total_blocks, total_batches, batches[] }.
 *
 * @module content/pipeline/qa-agent-drain-queue
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { walkBlocks, hashFile, loadQaReport } from "./qa-utils";
import { QA_CRITERIA_REGISTRY } from "./qa-criteria-registry";
import { findContentRepoRoot } from "./repo-root";

// chdir to the content-repo root before any path work. The default
// `root` and `--out` paths are repo-relative, and `walkBlocks` yields
// cwd-relative paths whose chapter slug is read positionally
// (`b.ts.split("/")[2]`); both only behave correctly when cwd is the
// content-repo root. Without this, an invocation from a subdirectory
// (e.g. `cd content && bun run …`) resolves the default root to a
// nonexistent path and silently emits a 0-gap queue. We walk up from
// cwd rather than from import.meta.dir so resolution is correct when
// folio-assistant is embedded as a symlinked subdir (import-relative
// would land inside folio-assistant, not the content repo).
process.chdir(findContentRepoRoot());

const root = process.argv[2] ?? "content/quantum-observable-universe";
const bsIdx = process.argv.indexOf("--batch-size");
const bsVal =
  bsIdx >= 0 && bsIdx + 1 < process.argv.length
    ? process.argv[bsIdx + 1]
    : null;
const bsNum = bsVal && !bsVal.startsWith("-") ? Number(bsVal) : NaN;
const batchSize = Number.isInteger(bsNum) && bsNum > 0 ? bsNum : 25;
const outIdx = process.argv.indexOf("--out");
const out =
  outIdx >= 0 ? process.argv[outIdx + 1] : "todos/qa-agent-drain-queue.json";

// Agent-only criteria = registry entries with automated === false.
const AGENT_CRITS = QA_CRITERIA_REGISTRY.filter((c) => !c.automated);

interface Row {
  block: string;
  chapter: string;
  kind: string;
  need: string[];
}

const rows: Row[] = [];
for (const b of walkBlocks(root)) {
  if (!b.md) continue;
  const curmd = hashFile(b.md);
  const report = b.qa ? loadQaReport(b.qa) : undefined;
  const crit = report?.criteria ?? {};
  const need: string[] = [];
  for (const def of AGENT_CRITS) {
    if (def.applies_to && def.applies_to.length && !def.applies_to.includes(b.kind))
      continue;
    const rawEntries = crit[def.id];
    const entries = Array.isArray(rawEntries) ? rawEntries : (rawEntries ? [rawEntries] : []);
    const fresh = entries.some(
      (e) =>
        (e.reviewer.kind === "agent" || e.reviewer.kind === "human") &&
        e.field_hash?.md === curmd,
    );
    if (!fresh) need.push(def.id);
  }
  if (need.length) {
    const parts = b.ts.split("/");
    rows.push({ block: b.ts.slice(0, -3), chapter: parts[2] ?? "?", kind: b.kind, need });
  }
}

const byChap = new Map<string, Row[]>();
for (const r of rows) {
  if (!byChap.has(r.chapter)) byChap.set(r.chapter, []);
  byChap.get(r.chapter)!.push(r);
}

interface Batch {
  batch_id: number;
  chapter: string;
  status: "pending";
  blocks: Row[];
}

let bid = 0;
const batches: Batch[] = [];
for (const [chapter, items] of [...byChap.entries()].sort()) {
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push({
      batch_id: ++bid,
      chapter,
      status: "pending",
      blocks: items.slice(i, i + batchSize),
    });
  }
}

const queue = {
  generated_at: new Date().toISOString().slice(0, 10),
  total_gaps: rows.reduce((s, r) => s + r.need.length, 0),
  total_blocks: rows.length,
  total_batches: batches.length,
  batches,
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(queue, null, 1));
console.log(
  `agent-drain queue: ${queue.total_batches} batches, ${queue.total_blocks} blocks, ${queue.total_gaps} gaps -> ${out}`,
);
