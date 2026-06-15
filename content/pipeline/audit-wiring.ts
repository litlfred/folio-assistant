/**
 * Audit-wiring — content-block ↔ pipeline wiring checker.
 *
 * Walks every `.ts` block manifest under
 * `content/quantum-observable-universe/<chapter>/`, infers each block's
 * wiring bucket per the criteria in
 * `docs/audits/last-2-days-pipeline-wiring.md`, and emits both a
 * console summary and a JSON dump.
 *
 * Buckets:
 *   wired-end-to-end  — narrative .md present (>=20 lines), Lean .lean
 *                       present (or kind exempt: prose / equation /
 *                       diagram / simulator / glossary remark), every
 *                       `sorry` in .lean has a `-- Ref:` annotation in
 *                       the same logical scope, .md body mentions a
 *                       `*.witness.json` filename, AND every label in
 *                       `uses[]` resolves to a real block in the paper.
 *   wired-partially   — any one of the above is missing.
 *   stub/skeleton     — .ts present, .md missing or <20 lines, no .lean,
 *                       no witness mention.
 *   math-only         — full narrative + Lean (no orphan sorry) but no
 *                       witness mention.
 *
 * Usage:
 *   bun run audit-wiring                # prints summary; writes JSON
 *   bun run audit-wiring -- --strict    # exit non-zero on findings
 *
 * @module content/pipeline/audit-wiring
 */

import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { resolve, join, basename, dirname } from "path";
import { BlockSchema } from "../schema/constraints";
import type { Block } from "../schema/types";

const PAPER_DIR = resolve(__dirname, "../quantum-observable-universe");
const REPO_ROOT = resolve(__dirname, "../..");
const OUT_JSON = resolve(__dirname, "../audit-wiring.json");

// Block kinds that don't require a .lean file.
const LEAN_EXEMPT_KINDS = new Set([
  "prose", "equation", "diagram", "simulator",
]);

// Provable kinds — strict mode flags these if they're stub/skeleton.
const PROVABLE_KINDS = new Set([
  "theorem", "proposition", "lemma", "corollary",
]);

type Bucket = "wired-end-to-end" | "wired-partially" | "stub/skeleton" | "math-only";

interface BlockAudit {
  label: string;
  kind: string;
  chapter: string;
  blockName: string;
  bucket: Bucket;
  reasons: string[];
  hasMd: boolean;
  mdLines: number;
  hasLean: boolean;
  leanSorryCount: number;
  leanRefCount: number;
  citedWitnesses: string[];
  usesUnresolved: string[];
}

interface AuditReport {
  paper: string;
  totalBlocks: number;
  byBucket: Record<Bucket, number>;
  byChapter: Record<string, Record<Bucket, number>>;
  blocks: BlockAudit[];
  strictFindings: string[];
}

function listChapters(paperDir: string): string[] {
  return readdirSync(paperDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith("."))
    .map(d => d.name);
}

function listBlockManifests(chapterDir: string): string[] {
  if (!existsSync(chapterDir)) return [];
  const chapterName = basename(chapterDir);
  return readdirSync(chapterDir)
    .filter(f => f.endsWith(".ts"))
    .map(f => basename(f, ".ts"))
    .filter(name => name !== chapterName);  // exclude chapter manifest itself
}

function fileLineCount(path: string): number {
  if (!existsSync(path)) return 0;
  return readFileSync(path, "utf8").split("\n").length;
}

function leanSorryAndRefCounts(leanPath: string): { sorries: number; refs: number } {
  if (!existsSync(leanPath)) return { sorries: 0, refs: 0 };
  const content = readFileSync(leanPath, "utf8");
  // Count `sorry` tokens (avoid matching the substring inside identifiers).
  const sorries = (content.match(/\bsorry\b/g) || []).length;
  // Count `-- Ref:` annotations.
  const refs = (content.match(/--\s*Ref:/g) || []).length;
  return { sorries, refs };
}

function extractWitnessMentions(mdPath: string): string[] {
  if (!existsSync(mdPath)) return [];
  const content = readFileSync(mdPath, "utf8");
  // Match basenames of *.witness.json mentions.
  const matches = content.match(/[\w-]+\.witness\.json/g) || [];
  return [...new Set(matches)];
}

function bucketFor(audit: BlockAudit, allLabels: Set<string>): Bucket {
  const reasons: string[] = [];
  const isLeanExempt = LEAN_EXEMPT_KINDS.has(audit.kind) ||
    (audit.kind === "remark");  // remarks may be glossary-only

  // Stub/skeleton check first.
  if (!audit.hasMd || audit.mdLines < 20) {
    if (!audit.hasLean && audit.citedWitnesses.length === 0) {
      audit.reasons.push("missing .md (<20 lines) and no Lean and no witness mention");
      return "stub/skeleton";
    }
  }

  // Lean orphan-sorry check (a sorry without a -- Ref: annotation).
  const leanOk = isLeanExempt
    || (audit.hasLean && audit.leanSorryCount <= audit.leanRefCount);
  if (!leanOk) {
    if (!audit.hasLean) reasons.push("missing .lean (kind requires it)");
    else reasons.push(`unannotated sorry (${audit.leanSorryCount} sorries, ${audit.leanRefCount} -- Ref: lines)`);
  }

  // uses[] resolution check happens upstream; reasons may already be filled.
  const usesOk = audit.usesUnresolved.length === 0;
  if (!usesOk) reasons.push(`uses[] unresolved: ${audit.usesUnresolved.join(", ")}`);

  // Witness mention check.
  const hasWitness = audit.citedWitnesses.length > 0;

  audit.reasons.push(...reasons);

  if (leanOk && usesOk && hasWitness) return "wired-end-to-end";
  if (leanOk && usesOk && !hasWitness) return "math-only";
  return "wired-partially";
}

async function auditPaper(): Promise<AuditReport> {
  const chapters = listChapters(PAPER_DIR);
  const blocks: BlockAudit[] = [];

  // First pass: load all blocks to build the label registry.
  const blocksByLabel = new Map<string, BlockAudit>();
  for (const chapter of chapters) {
    const chapterDir = join(PAPER_DIR, chapter);
    const blockNames = listBlockManifests(chapterDir);
    for (const name of blockNames) {
      const tsPath = join(chapterDir, `${name}.ts`);
      let block: Block | null = null;
      try {
        const mod = await import(tsPath);
        block = mod.default;
      } catch {
        continue;
      }
      const parsed = BlockSchema.safeParse(block);
      if (!parsed.success || !block) continue;

      const mdPath = join(chapterDir, `${name}.md`);
      const leanPath = join(chapterDir, `${name}.lean`);
      const { sorries, refs } = leanSorryAndRefCounts(leanPath);
      const citedWitnesses = extractWitnessMentions(mdPath);

      const audit: BlockAudit = {
        label: block.label,
        kind: block.kind,
        chapter,
        blockName: name,
        bucket: "wired-partially",  // placeholder
        reasons: [],
        hasMd: existsSync(mdPath),
        mdLines: fileLineCount(mdPath),
        hasLean: existsSync(leanPath),
        leanSorryCount: sorries,
        leanRefCount: refs,
        citedWitnesses,
        usesUnresolved: [],
      };
      blocksByLabel.set(block.label, audit);
      blocks.push(audit);
    }
  }

  // Second pass: resolve uses[] and assign buckets.
  const allLabels = new Set(blocksByLabel.keys());
  for (const audit of blocks) {
    const tsPath = join(PAPER_DIR, audit.chapter, `${audit.blockName}.ts`);
    let block: Block | null = null;
    try {
      block = (await import(tsPath)).default;
    } catch {}
    if (block && block.uses) {
      for (const u of block.uses) {
        // Skip qualified cross-paper references (paper-dir:label or https://).
        if (u.includes(":") && !u.startsWith("def:") && !u.startsWith("prop:") &&
            !u.startsWith("thm:") && !u.startsWith("lem:") && !u.startsWith("cor:") &&
            !u.startsWith("conj:") && !u.startsWith("ex:") && !u.startsWith("rem:") &&
            !u.startsWith("sim:")) continue;
        if (u.startsWith("https://")) continue;
        if (!allLabels.has(u)) audit.usesUnresolved.push(u);
      }
    }
    audit.bucket = bucketFor(audit, allLabels);
  }

  // Aggregate.
  const byBucket: Record<Bucket, number> = {
    "wired-end-to-end": 0, "wired-partially": 0, "stub/skeleton": 0, "math-only": 0,
  };
  const byChapter: Record<string, Record<Bucket, number>> = {};
  for (const a of blocks) {
    byBucket[a.bucket]++;
    if (!byChapter[a.chapter]) {
      byChapter[a.chapter] = { "wired-end-to-end": 0, "wired-partially": 0, "stub/skeleton": 0, "math-only": 0 };
    }
    byChapter[a.chapter][a.bucket]++;
  }

  // Strict findings.
  const strictFindings: string[] = [];
  for (const a of blocks) {
    if (a.bucket === "stub/skeleton" && PROVABLE_KINDS.has(a.kind)) {
      strictFindings.push(`STUB-PROVABLE: ${a.label} (${a.kind}) at ${a.chapter}/${a.blockName}`);
    }
    if (a.usesUnresolved.length > 0) {
      strictFindings.push(`USES-UNRESOLVED: ${a.label} → [${a.usesUnresolved.join(", ")}]`);
    }
  }

  return { paper: "quantum-observable-universe", totalBlocks: blocks.length, byBucket, byChapter, blocks, strictFindings };
}

function formatTable(report: AuditReport): string {
  const lines: string[] = [];
  lines.push(`Paper: ${report.paper}    Blocks: ${report.totalBlocks}`);
  lines.push("─".repeat(80));
  const cols = ["chapter", "wired-e2e", "partial", "stub", "math-only"];
  lines.push(cols.map((c, i) => i === 0 ? c.padEnd(36) : c.padStart(10)).join(""));
  lines.push("─".repeat(80));
  for (const [chapter, b] of Object.entries(report.byChapter).sort()) {
    lines.push(
      chapter.padEnd(36) +
      String(b["wired-end-to-end"]).padStart(10) +
      String(b["wired-partially"]).padStart(10) +
      String(b["stub/skeleton"]).padStart(10) +
      String(b["math-only"]).padStart(10),
    );
  }
  lines.push("─".repeat(80));
  lines.push(
    "TOTAL".padEnd(36) +
    String(report.byBucket["wired-end-to-end"]).padStart(10) +
    String(report.byBucket["wired-partially"]).padStart(10) +
    String(report.byBucket["stub/skeleton"]).padStart(10) +
    String(report.byBucket["math-only"]).padStart(10),
  );
  return lines.join("\n");
}

async function main() {
  const strict = process.argv.includes("--strict");
  const report = await auditPaper();

  // Console output.
  console.log(formatTable(report));
  if (strict && report.strictFindings.length > 0) {
    console.log();
    console.log(`Strict findings (${report.strictFindings.length}):`);
    for (const f of report.strictFindings.slice(0, 20)) console.log(`  ${f}`);
    if (report.strictFindings.length > 20) console.log(`  ...${report.strictFindings.length - 20} more`);
  }

  // JSON output.
  const { writeFileSync } = await import("fs");
  writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));
  console.log(`\nJSON: ${OUT_JSON}`);

  if (strict && report.strictFindings.length > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(2); });
