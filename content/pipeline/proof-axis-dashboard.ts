#!/usr/bin/env bun
/**
 * Proof-axis QA dashboard — one-page summary of all proof criteria.
 *
 * Usage:
 *   bun run pipeline/proof-axis-dashboard.ts [paper-dir] [--json]
 *
 * Reads all .qa.json sidecars and aggregates proof-* criterion results
 * into a structured summary for triage.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");

interface Args {
  root: string;
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  // Read the positional argument FIRST, then fall back to auto-detection.
  //
  // This computed `requirePaper()` as the initial value of `out.root`, which
  // is eager: the fallback ran before the loop could see an explicit
  // argument, so in any repo with more than one paper `requirePaper` threw
  // ("N papers found — name one explicitly") even when a paper *was* named.
  // qou carries five, so the dashboard could not be run there at all.
  // `requirePaper` already takes `explicit?` for exactly this — pass it.
  let root: string | undefined;
  let json = false;
  for (const a of argv) {
    if (a === "--json") json = true;
    else if (!a.startsWith("-")) root = a;
  }
  return { root: requirePaper(root), json };
}

interface CriterionSummary {
  pass: number;
  fail: number;
  warn: number;
  "n/a": number;
  missing: number;
  total: number;
  failBlocks: string[];
  warnBlocks: string[];
}

interface StubFile {
  label: string;
  kind: string;
  chapter: string;
  leanPath: string;
}

interface KindMismatch {
  label: string;
  kind: string;
  chapter: string;
  evidence: string;
}

interface SorryInfo {
  file: string;
  chapter: string;
  lineCount: number;
  isConjectural: boolean;
}

import { walkBlocks, loadQaReport } from "./qa-utils";
import { WATCHER_CRITERIA_BY_AXIS } from "./qa-criteria-registry";
import { requirePaper } from "./repo-root";

/** `evidence` as searchable text, whichever of its two shapes it is. */
function evidenceText(ev: string | Array<{ line?: number; text?: string }> | undefined): string {
  if (typeof ev === "string") return ev;
  if (!Array.isArray(ev)) return "";
  return ev.map((h) => `${h.line ?? ""}:${h.text ?? ""}`).join(" | ");
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  // `args.root` may be either a PAPER NAME (resolved under this platform's
  // own `content/`, which is how it works when the platform repo also holds
  // the content) or a PATH to a content root. The second case is the normal
  // one: folio-assistant is the platform, and the folio it serves lives in a
  // separate repo, so `<platform>/content/<paper>` does not exist there.
  //
  // Resolving only the first way meant this dashboard could not be pointed at
  // a real folio at all — `find` errored, zero blocks were walked, and every
  // criterion scored 0/0. Accept a path when one is given, like `qa-sweep.ts`
  // already does.
  const asPath = resolve(process.cwd(), args.root);
  const rootPath = existsSync(asPath) ? asPath : resolve(REPO_ROOT, "content", args.root);
  if (!existsSync(rootPath)) {
    console.error(
      `proof-axis-dashboard: no such content root: ${args.root}\n` +
        `  tried (as path):  ${asPath}\n` +
        `  tried (as paper): ${resolve(REPO_ROOT, "content", args.root)}\n` +
        `Pass the path to the folio's content root, e.g.\n` +
        `  bun run <platform>/content/pipeline/proof-axis-dashboard.ts content/<paper>`,
    );
    process.exit(2);
  }

  const proofCriteria = WATCHER_CRITERIA_BY_AXIS["proof"] ?? [];

  const summaries: Record<string, CriterionSummary> = {};
  for (const cid of proofCriteria) {
    summaries[cid] = { pass: 0, fail: 0, warn: 0, "n/a": 0, missing: 0, total: 0, failBlocks: [], warnBlocks: [] };
  }

  const stubs: StubFile[] = [];
  const mismatches: KindMismatch[] = [];
  let totalBlocks = 0;
  let blocksWithLean = 0;

  for (const block of walkBlocks(rootPath)) {
    totalBlocks++;
    const qaPath = block.qa ? resolve(REPO_ROOT, "content", block.qa) : undefined;
    const report = qaPath ? loadQaReport(qaPath) : undefined;

    const hasLean = block.lean && existsSync(resolve(REPO_ROOT, "content", block.lean));
    if (hasLean) blocksWithLean++;

    for (const cid of proofCriteria) {
      const s = summaries[cid];
      s.total++;
      if (!report) { s.missing++; continue; }
      const entries = report.criteria[cid] ?? [];
      if (entries.length === 0) { s.missing++; continue; }
      const latest = entries[entries.length - 1];
      const r = latest.result as keyof CriterionSummary;
      if (r === "pass" || r === "fail" || r === "warn" || r === "n/a") {
        (s[r] as number)++;
      }
      if (r === "fail") s.failBlocks.push(report.label);
      if (r === "warn") {
        s.warnBlocks.push(report.label);
        // `QaCriterionEntry.evidence` is `string | Array<{line?, text?}>`.
        // This was used directly as a string: `ev.includes("no declarations")`
        // on the ARRAY form is Array.prototype.includes — exact-element
        // membership, not substring — so it was always false and the
        // "no declarations" mismatch silently never fired for array-form
        // evidence. Flatten to text first.
        const ev = evidenceText(latest.evidence);
        const notes = latest.notes ?? "";
        if (ev.includes("no declarations")) {
          const relTs = relative(rootPath, block.ts);
          const chapter = relTs.split("/")[0] ?? "";
          stubs.push({
            label: report.label,
            kind: report.kind,
            chapter,
            leanPath: block.lean ?? "",
          });
        }
        if ((ev + notes).toLowerCase().includes("mismatch")) {
          const relTs = relative(rootPath, block.ts);
          const chapter = relTs.split("/")[0] ?? "";
          mismatches.push({
            label: report.label,
            kind: report.kind,
            chapter,
            evidence: ev,
          });
        }
      }
    }
  }

  // Scan for actual sorry in code
  const sorries: SorryInfo[] = [];
  try {
    const grepOut = execSync(
      `find ${rootPath} -name '*.lean' ! -path '*/lean/*' -exec grep -l '\\bsorry\\b' {} +`,
      { encoding: "utf-8", timeout: 30000 }
    ).trim();
    for (const f of grepOut.split("\n").filter(Boolean)) {
      const src = readFileSync(f, "utf-8");
      const cleaned = src
        .replace(/\/-[\!]?[\s\S]*?-\//g, (m: string) => "\n".repeat(m.split("\n").length - 1))
        .replace(/--[^\n]*/g, "");
      const count = (cleaned.match(/\bsorry\b/g) ?? []).length;
      if (count > 0) {
        const chapter = relative(rootPath, f).split("/")[0] ?? "";
        const hasClass = /\bclass\s/.test(src);
        const hasConj = /conj[:\-]/.test(src) || /conjecture/i.test(src);
        const srcLines = src.split("\n");
        const cleanedLines = cleaned.split("\n");
        const hasRefOnSorryLine = cleanedLines.some(
          (l: string, idx: number) => /\bsorry\b/.test(l) && /Ref:/.test(srcLines[idx] ?? "")
        );
        const hasInstanceSorry = /instance[\s\S]{0,200}sorry/.test(cleaned);
        sorries.push({
          file: relative(REPO_ROOT, f),
          chapter,
          lineCount: count,
          isConjectural: hasClass || hasConj || hasInstanceSorry || hasRefOnSorryLine,
        });
      }
    }
  } catch { /* no sorry files */ }

  if (args.json) {
    console.log(JSON.stringify({
      paper: args.root,
      totalBlocks,
      blocksWithLean,
      criteria: summaries,
      stubs,
      mismatches,
      sorries,
    }, null, 2));
    return;
  }

  // Text output
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║         PROOF-AXIS QA DASHBOARD                  ║`);
  console.log(`║  ${args.root.padEnd(46)}  ║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);

  console.log(`Blocks: ${totalBlocks} total, ${blocksWithLean} with .lean sibling\n`);

  console.log(`── Automated criteria ──────────────────────────────`);
  console.log(`${"Criterion".padEnd(42)} Pass   Fail  Warn   N/A  Miss`);
  console.log(`${"─".repeat(42)} ${"─".repeat(5)} ${"─".repeat(5)} ${"─".repeat(5)} ${"─".repeat(5)} ${"─".repeat(5)}`);
  for (const cid of proofCriteria) {
    const s = summaries[cid];
    const p = String(s.pass).padStart(5);
    const f = String(s.fail).padStart(5);
    const w = String(s.warn).padStart(5);
    const n = String(s["n/a"]).padStart(5);
    const m = String(s.missing).padStart(5);
    const marker = s.fail > 0 ? " ✗" : s.warn > 0 ? " ⚠" : " ✓";
    console.log(`${cid.padEnd(42)}${p}${f}${w}${n}${m}${marker}`);
  }

  console.log(`\n── Stub .lean files (no declarations) ─────────────`);
  console.log(`Total: ${stubs.length}`);
  const stubByChapter: Record<string, number> = {};
  const stubByKind: Record<string, number> = {};
  for (const s of stubs) {
    stubByChapter[s.chapter] = (stubByChapter[s.chapter] ?? 0) + 1;
    stubByKind[s.kind] = (stubByKind[s.kind] ?? 0) + 1;
  }
  console.log(`By kind: ${Object.entries(stubByKind).sort((a,b) => b[1]-a[1]).map(([k,v]) => `${k}=${v}`).join(", ")}`);
  console.log(`Top chapters: ${Object.entries(stubByChapter).sort((a,b) => b[1]-a[1]).slice(0,5).map(([k,v]) => `${k}(${v})`).join(", ")}`);

  if (mismatches.length > 0) {
    console.log(`\n── Kind-declaration mismatches ─────────────────────`);
    console.log(`Total: ${mismatches.length}`);
    for (const m of mismatches) {
      console.log(`  ${m.label} (${m.chapter}): ${m.evidence.slice(0, 100)}`);
    }
  }

  console.log(`\n── Sorry in code (not comments) ────────────────────`);
  console.log(`Files: ${sorries.length}, Total sorries: ${sorries.reduce((a,s) => a + s.lineCount, 0)}`);
  const conj = sorries.filter(s => s.isConjectural);
  const deferred = sorries.filter(s => !s.isConjectural);
  console.log(`Conjectural (intentional): ${conj.length} files, ${conj.reduce((a,s) => a + s.lineCount, 0)} sorries`);
  console.log(`Deferred proofs (closeable): ${deferred.length} files, ${deferred.reduce((a,s) => a + s.lineCount, 0)} sorries`);
  if (deferred.length > 0) {
    console.log(`Deferred files:`);
    for (const s of deferred.sort((a,b) => b.lineCount - a.lineCount)) {
      console.log(`  ${s.lineCount} sorry  ${s.file}`);
    }
  }

  console.log(`\n── Summary ────────────────────────────────────────`);
  const anyFail = Object.values(summaries).some(s => s.fail > 0);
  const totalFail = Object.values(summaries).reduce((a, s) => a + s.fail, 0);
  const totalWarn = Object.values(summaries).reduce((a,s) => a + s.warn, 0);

  // An empty scan is NOT a pass. Every criterion scoring 0/0/0 used to print
  // "Automated: PASS (0 failures)", which reads as a clean bill of health and
  // is indistinguishable from one — the single most misleading thing a gate
  // can do. If nothing was examined, say so and exit non-zero so a caller
  // (e.g. /prepare-merge) cannot quote it as green.
  if (totalBlocks === 0) {
    console.log(`Automated: NO DATA — 0 blocks walked under ${rootPath}`);
    console.log(`This is not a pass. Check the content root argument.`);
    console.log(``);
    process.exit(1);
  }

  // The count was hardcoded to 0, so a genuine failure printed
  // "FAIL (0 failures)".
  console.log(`Automated: ${anyFail ? "FAIL" : "PASS"} (${totalFail} failures)`);
  console.log(`Warnings: ${totalWarn} (${stubs.length} stubs + ${mismatches.length} mismatches)`);
  console.log(`Sorry closure: ${deferred.length} deferred files actionable with Lean`);
  console.log(``);
}

main();
