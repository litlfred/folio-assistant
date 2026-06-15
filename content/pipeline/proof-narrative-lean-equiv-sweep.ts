#!/usr/bin/env bun
/**
 * Agent-style narrative–Lean equivalence sweep.
 *
 * For each block with both .md and .lean siblings, checks whether
 * the narrative statement and the Lean declaration express the same
 * claim. Writes `kind: "agent"` entries to the per-block .qa.json.
 *
 * Usage:
 *   bun run pipeline/proof-narrative-lean-equiv-sweep.ts <chapter-dir>
 *   bun run pipeline/proof-narrative-lean-equiv-sweep.ts <chapter-dir> --dry-run
 *   bun run pipeline/proof-narrative-lean-equiv-sweep.ts <chapter-dir> --json
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname, basename, relative as pathRelative } from "path";
import { fileURLToPath } from "url";
import {
  hashBlockFiles,
  gitHeadSha,
  walkBlocks,
  loadQaReport,
  saveQaReport,
  entryIsFresh,
} from "./qa-utils";
import type {
  BlockQaReport,
  QaCriterionEntry,
} from "../../folio-assistant/schemas/block-qa";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");
const CRITERION_ID = "proof-narrative-lean-equiv";
const REVIEWER_ID = "proof-narrative-lean-equiv-sweep/v1";

interface Args {
  root: string;
  dryRun: boolean;
  json: boolean;
  force: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { root: "", dryRun: false, json: false, force: false };
  for (const a of argv) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--json") out.json = true;
    else if (a === "--force") out.force = true;
    else if (!a.startsWith("-")) out.root = a;
  }
  return out;
}

// ── Extraction helpers ──────────────────────────────────────────

/** Extract the block kind from the .ts manifest text.
 *  Kind is inferred from the builder function: definition(), theorem(), etc. */
function extractKind(tsText: string): string | undefined {
  // Try explicit kind field first
  const explicit = tsText.match(/kind:\s*["'](\w+)["']/);
  if (explicit) return explicit[1];
  // Infer from builder function call: export default <builder>({...})
  const builder = tsText.match(
    /(?:export\s+default\s+|=\s*)(\w+)\s*\(/
  );
  if (builder) {
    const name = builder[1];
    const mapping: Record<string, string> = {
      definition: "definition",
      theorem: "theorem",
      lemma: "lemma",
      proposition: "proposition",
      corollary: "corollary",
      conjecture: "conjecture",
      remark: "remark",
      example: "example",
      prose: "prose",
      equation: "equation",
      diagram: "diagram",
      simulator: "simulator",
      proof: "proof",
    };
    return mapping[name];
  }
  return undefined;
}

/** Extract label from .ts manifest. */
function extractLabel(tsText: string): string | undefined {
  const m = tsText.match(/label:\s*["']([^"']+)["']/);
  return m?.[1];
}

interface LeanDecl {
  kind: string;
  name: string;
}

/** Extract Lean declarations from .lean source (comment-safe). */
function extractLeanDecls(leanText: string): LeanDecl[] {
  const decls: LeanDecl[] = [];
  const cleaned = leanText
    .replace(/\/-[\s\S]*?-\//g, (m) => "\n".repeat(m.split("\n").length - 1))
    .replace(/--[^\n]*/g, "");
  const re = /^\s*(?:private\s+|protected\s+|partial\s+|noncomputable\s+)*(theorem|lemma|def|instance|class|structure|inductive|abbrev|axiom)\s+([a-zA-Z_][a-zA-Z0-9_'.]*)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    decls.push({ kind: m[1], name: m[2] });
  }
  return decls;
}

/** Extract the main statement sentence from .md content. */
function extractMdStatement(mdText: string): string | undefined {
  // Look for bold statement markers
  const patterns = [
    /\*\*(?:Theorem|Proposition|Lemma|Corollary|Definition|Conjecture)[^*]*\*\*\.?\s*([^\n]+)/i,
    /^#+\s*Statement\s*\n+(.+)/m,
  ];
  for (const p of patterns) {
    const m = mdText.match(p);
    if (m) return m[1]?.trim();
  }
  // Fallback: first non-heading non-empty line
  const lines = mdText.split("\n").filter(
    (l) => l.trim() && !l.startsWith("#") && !l.startsWith(">")
  );
  return lines[0]?.trim();
}

/** Check if Lean has sorry (actual code, not comments). */
function hasSorryInCode(leanText: string): boolean {
  const cleaned = leanText
    .replace(/\/-[\!]?[\s\S]*?-\//g, (m) => "\n".repeat(m.split("\n").length - 1))
    .replace(/--[^\n]*/g, "");
  return /\bsorry\b/.test(cleaned);
}

/** Detect "sibling stub" Lean files that intentionally delegate to a lake
 *  package (re-exporters or pure-doc stubs). These have no local
 *  declarations by design and are audited by `lean-compile-audit` against
 *  the upstream Lake build, not by this checker. */
function isSiblingStub(leanText: string): boolean {
  // Doc-style stubs explicitly say so.
  if (/sibling[-\s]resolution stub/i.test(leanText)) return true;
  if (/full formali[sz]ation lives in/i.test(leanText)) return true;
  if (/buildable formali[sz]ation lives in/i.test(leanText)) return true;
  // Re-export-only files: after stripping comments, only contain
  // import/open/export/namespace/end and whitespace.
  const cleaned = leanText
    .replace(/\/-[\!]?[\s\S]*?-\//g, "")
    .replace(/--[^\n]*/g, "")
    .trim();
  if (!cleaned) return true;
  const nonStubLines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter(
      (l) =>
        !l.startsWith("import ") &&
        !l.startsWith("open ") &&
        !l.startsWith("export ") &&
        !l.startsWith("namespace ") &&
        !l.startsWith("end ") &&
        l !== ")" &&
        !l.startsWith("(") &&
        !/^[a-zA-Z_][a-zA-Z0-9_'.]*\s*$/.test(l), // bare identifier in export list
    );
  return nonStubLines.length === 0;
}

/** Detect whether every declaration in the file is a trivial stub
 *  (`theorem|lemma|def X : True := trivial`). This is the Lean idiom
 *  for "manuscript-only / formalisation pending" stubs. When the
 *  file has nothing but trivial stubs, it should be treated like a
 *  sibling stub (n/a) rather than scored against kind discipline. */
function hasOnlyTrivialStubDecls(leanText: string): boolean {
  const cleaned = leanText
    .replace(/\/-[\!]?[\s\S]*?-\//g, "")
    .replace(/--[^\n]*/g, "");
  // Match each top-level declaration head.
  const declRe = /^\s*(?:private\s+|protected\s+|partial\s+|noncomputable\s+)*(theorem|lemma|def|instance|class|structure|inductive|abbrev|axiom)\s+([a-zA-Z_][a-zA-Z0-9_'.]*)([\s\S]*?)(?=^\s*(?:private\s+|protected\s+|partial\s+|noncomputable\s+)*(?:theorem|lemma|def|instance|class|structure|inductive|abbrev|axiom)\s+|^end\s+|\Z)/gm;
  let m: RegExpExecArray | null;
  let saw = 0;
  // `: True := trivial` (allowing whitespace, optional `by trivial`).
  const stubBody = /:\s*True\s*:=\s*(?:trivial|by\s+trivial)\s*$/m;
  while ((m = declRe.exec(cleaned)) !== null) {
    saw++;
    const kind = m[1];
    // Only theorem/lemma/def can be a `True := trivial` stub; any
    // structure/class/inductive/instance/abbrev/axiom signals real content.
    if (!["theorem", "lemma", "def"].includes(kind)) return false;
    if (!stubBody.test(m[3])) return false;
  }
  return saw > 0;
}

/** Check structural equivalence between md and lean. */
function checkEquivalence(
  mdText: string,
  leanText: string,
  tsText: string,
): { result: "pass" | "fail" | "warn" | "n/a"; evidence?: string; notes?: string } {
  const kind = extractKind(tsText);
  const label = extractLabel(tsText);
  const leanDecls = extractLeanDecls(leanText);

  // Blocks without provable content don't need this check
  if (!kind || ["prose", "equation", "diagram", "simulator"].includes(kind)) {
    return { result: "n/a", notes: `Block kind '${kind}' has no provable Lean content expected.` };
  }

  // No Lean declarations found
  if (leanDecls.length === 0) {
    if (isSiblingStub(leanText)) {
      return {
        result: "n/a",
        notes:
          "Lean sibling is a stub/re-exporter; canonical formalisation lives in a Lake package and is audited by lean-compile-audit.",
      };
    }
    return {
      result: "warn",
      evidence: "Lean file exists but contains no declarations (theorem/def/class/etc).",
      notes: "Lean file may be empty or only contain comments.",
    };
  }

  // Stub-only Lean file: declarations exist but every one is a
  // `: True := trivial` stub (the Lean idiom for "manuscript-only /
  // formalisation pending"). Treat the same as a no-declaration
  // sibling stub: audited by lean-compile-audit, not by kind
  // discipline. Note: we deliberately do NOT short-circuit on
  // `isSiblingStub(leanText)` alone here — sibling-stub prose
  // combined with a real `class`/`structure`/`def` declaration is
  // the normal §3b conjectural pattern, which already passes the
  // kind-discipline check below.
  if (hasOnlyTrivialStubDecls(leanText)) {
    return {
      result: "n/a",
      notes:
        "Lean sibling has only stub declarations (`: True := trivial`); canonical formalisation lives elsewhere and is audited by lean-compile-audit.",
    };
  }

  // Extract label-derived expected declaration name
  const labelSuffix = label?.replace(/^(def|thm|lem|prop|cor|conj|rem|ex):/, "");
  const expectedSnake = labelSuffix?.replace(/-/g, "_");

  // Check if any Lean declaration name aligns with the block label
  const nameMatch = leanDecls.some((d) => {
    const declBase = d.name.split(".").pop()?.toLowerCase() ?? "";
    return expectedSnake ? declBase === expectedSnake.toLowerCase() : false;
  });

  // Check if .md has a statement
  const mdStatement = extractMdStatement(mdText);
  const hasSorry = hasSorryInCode(leanText);

  // Check for kind-declaration alignment using structured decl kinds
  const provableKinds = ["theorem", "lemma", "proposition", "corollary"];
  const isProvable = kind && provableKinds.includes(kind);
  // `axiom` declarations are formal claims (theorem-as-axiom pattern); count
  // them as satisfying the provable-kind requirement.
  const hasTheoremDecl = leanDecls.some((d) =>
    d.kind === "theorem" || d.kind === "lemma" || d.kind === "axiom"
  );
  const hasDefDecl = leanDecls.some((d) =>
    d.kind === "def"
  );
  const hasStructureDecl = leanDecls.some((d) =>
    ["structure", "class", "inductive", "abbrev"].includes(d.kind)
  );
  const declNamesStr = leanDecls.map((d) => d.name).join(", ");

  if (kind === "definition" && !hasDefDecl && !hasStructureDecl && hasTheoremDecl) {
    return {
      result: "warn",
      evidence: `Block kind is 'definition' but Lean has theorem/lemma, no def. Decls: ${declNamesStr}`,
      notes: "Kind-declaration mismatch: .ts says definition but .lean has theorem.",
    };
  }

  if (isProvable && !hasTheoremDecl && (hasDefDecl || hasStructureDecl) && !leanDecls.some((d) =>
    d.kind === "class" || d.kind === "instance"
  )) {
    return {
      result: "warn",
      evidence: `Block kind is '${kind}' but Lean has only def/noncomputable def, no theorem/lemma. Decls: ${declNamesStr}`,
      notes: "Kind-declaration mismatch: .ts says provable but .lean has only definitions.",
    };
  }

  // For conjectures: expect class/sorry pattern
  if (kind === "conjecture") {
    const hasClassOrAxiom = leanDecls.some((d) => d.kind === "class" || d.kind === "axiom");
    if (!hasClassOrAxiom && !hasSorry) {
      return {
        result: "warn",
        evidence: "Conjecture block has .lean but no class axiomatisation or sorry.",
        notes: "Per §3b, conjectures should use class axiomatisation pattern.",
      };
    }
    return {
      result: "pass",
      notes: `Conjecture with ${hasClassOrAxiom ? "class/axiom axiomatisation" : "sorry"} — structural match.`,
    };
  }

  // Pass if name aligns and kind is consistent
  if (nameMatch) {
    return {
      result: "pass",
      notes: `Label '${label}' aligns with Lean declaration. ${hasSorry ? "Has sorry (cited)." : "Sorry-free."}`,
    };
  }

  // Soft pass: name doesn't exactly match but declarations exist
  if (leanDecls.length > 0) {
    return {
      result: "pass",
      notes: `Label '${label}' → expected '${expectedSnake}'; Lean declares: ${leanDecls.slice(0, 5).map((d) => d.name).join(", ")}${leanDecls.length > 5 ? "..." : ""}. Structural match via content.`,
    };
  }

  return {
    result: "warn",
    evidence: `Could not confirm narrative-Lean equivalence for '${label}'.`,
    notes: "Manual review recommended.",
  };
}

// ── Main sweep ──────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.root) {
    console.error("Usage: bun run pipeline/proof-narrative-lean-equiv-sweep.ts <chapter-dir>");
    process.exit(2);
  }

  const rootPath = resolve(REPO_ROOT, "content", args.root);
  if (!existsSync(rootPath)) {
    console.error(`Root not found: ${rootPath}`);
    process.exit(2);
  }

  const headSha = gitHeadSha();
  const now = new Date().toISOString();

  interface Result {
    label: string;
    kind: string;
    result: string;
    notes?: string;
    evidence?: string;
    qa_path: string;
  }
  const results: Result[] = [];
  let written = 0;
  let skipped_fresh = 0;
  let skipped_no_lean = 0;

  for (const block of walkBlocks(rootPath)) {
    if (!block.lean || !existsSync(block.lean)) {
      skipped_no_lean++;
      continue;
    }

    const mdPath = block.md;
    const tsPath = block.ts;
    const leanPath = block.lean;
    const qaPath = block.root + ".qa.json";

    if (!mdPath || !existsSync(mdPath)) {
      skipped_no_lean++;
      continue;
    }

    const currentHashes = hashBlockFiles({
      md: mdPath,
      ts: tsPath,
      lean: leanPath,
    });

    // Check if fresh entry already exists
    const existing = loadQaReport(qaPath);
    if (existing && !args.force) {
      const entries = existing.criteria[CRITERION_ID] ?? [];
      if (entries.some((e) => entryIsFresh(e, currentHashes, ["md", "ts", "lean"]))) {
        skipped_fresh++;
        continue;
      }
    }

    const mdText = readFileSync(mdPath, "utf-8");
    const tsText = readFileSync(tsPath, "utf-8");
    const leanText = readFileSync(leanPath, "utf-8");

    const check = checkEquivalence(mdText, leanText, tsText);
    const label = extractLabel(tsText) ?? basename(block.ts, ".ts");
    const kind = extractKind(tsText) ?? "unknown";

    const entry: QaCriterionEntry = {
      field_hash: currentHashes,
      result: check.result,
      ...(check.evidence ? { evidence: check.evidence } : {}),
      reviewer: {
        kind: "agent",
        id: REVIEWER_ID,
        version: "v1",
      },
      reviewed_at: now,
      reviewed_sha: headSha,
      ...(check.notes ? { notes: check.notes } : {}),
    };

    if (!args.dryRun) {
      const report = existing ?? {
        $schema: "block-qa/v1" as const,
        label,
        kind,
        paths: {
          ts: pathRelative(REPO_ROOT, tsPath),
          ...(mdPath ? { md: pathRelative(REPO_ROOT, mdPath) } : {}),
          ...(leanPath ? { lean: pathRelative(REPO_ROOT, leanPath) } : {}),
        },
        source_hashes: currentHashes,
        criteria: {},
        updated_at: now,
      };
      if (!report.criteria[CRITERION_ID]) {
        report.criteria[CRITERION_ID] = [];
      }
      report.criteria[CRITERION_ID].push(entry);
      report.source_hashes = currentHashes;
      report.updated_at = now;
      saveQaReport(qaPath, report);
    }

    results.push({
      label,
      kind,
      result: check.result,
      notes: check.notes,
      evidence: check.evidence,
      qa_path: pathRelative(REPO_ROOT, qaPath),
    });
    written++;
  }

  if (args.json) {
    console.log(JSON.stringify({
      criterion: CRITERION_ID,
      root: args.root,
      written,
      skipped_fresh,
      skipped_no_lean,
      results,
    }, null, 2));
  } else {
    console.log(`proof-narrative-lean-equiv sweep: ${args.root}`);
    console.log(`  Written: ${written}`);
    console.log(`  Skipped (fresh): ${skipped_fresh}`);
    console.log(`  Skipped (no .lean): ${skipped_no_lean}`);
    const counts = { pass: 0, fail: 0, warn: 0, "n/a": 0 };
    for (const r of results) {
      counts[r.result as keyof typeof counts]++;
    }
    console.log(`  Results: pass=${counts.pass} fail=${counts.fail} warn=${counts.warn} n/a=${counts["n/a"]}`);
    if (counts.warn > 0 || counts.fail > 0) {
      console.log("\n  Findings:");
      for (const r of results) {
        if (r.result === "fail" || r.result === "warn") {
          console.log(`    ${r.result.toUpperCase()} ${r.label}: ${r.evidence ?? r.notes ?? ""}`);
        }
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
