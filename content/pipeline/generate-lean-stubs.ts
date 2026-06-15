#!/usr/bin/env bun
/**
 * Generate minimal Lean declarations for stub .lean files.
 *
 * Reads each stub's .ts manifest for the lean.ref URI, extracts the
 * expected declaration name, and appends a sorry-backed declaration
 * matching the block kind. Preserves existing docstrings.
 *
 * Usage:
 *   bun run pipeline/generate-lean-stubs.ts <chapter-dir>
 *   bun run pipeline/generate-lean-stubs.ts <chapter-dir> --dry-run
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname, basename, relative } from "path";
import { fileURLToPath } from "url";
import { walkBlocks, loadQaReport } from "./qa-utils";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..");

interface Args {
  root: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { root: "", dryRun: false };
  for (const a of argv) {
    if (a === "--dry-run") out.dryRun = true;
    else if (!a.startsWith("-")) out.root = a;
  }
  return out;
}

function extractLeanRef(tsText: string): string | undefined {
  const m = tsText.match(/ref:\s*["']([^"']+)["']/);
  return m?.[1];
}

function extractLabel(tsText: string): string | undefined {
  const m = tsText.match(/label:\s*["']([^"']+)["']/);
  return m?.[1];
}

function extractTitle(tsText: string): string | undefined {
  const m = tsText.match(/title:\s*["']([^"']+)["']/);
  return m?.[1];
}

function extractKind(tsText: string): string | undefined {
  const m = tsText.match(/(?:export\s+default\s+)(\w+)\s*\(/);
  return m?.[1];
}

function labelToNamespace(label: string): string {
  const suffix = label.replace(/^(def|thm|lem|prop|cor|conj|rem|ex|prf):/, "");
  return suffix
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function labelToSnake(label: string): string {
  return label.replace(/^(def|thm|lem|prop|cor|conj|rem|ex|prf):/, "").replace(/-/g, "_");
}

function hasLeanDecls(leanText: string): boolean {
  const cleaned = leanText
    .replace(/\/-[\!]?[\s\S]*?-\//g, (m) => "\n".repeat(m.split("\n").length - 1))
    .replace(/--[^\n]*/g, "");
  return /^(?:theorem|lemma|def|noncomputable def|instance|class|structure|inductive|abbrev)\s/m.test(cleaned);
}

function generateDeclaration(
  kind: string,
  label: string,
  title: string,
  leanRef: string | undefined,
): string {
  const snake = labelToSnake(label);
  const ns = leanRef
    ? leanRef.replace(/^[^:]+:/, "").split(".").slice(0, -1).join(".")
    : `QOU.${labelToNamespace(label).split(/(?=[A-Z])/).slice(0, 2).join(".")}`;
  const declName = leanRef
    ? leanRef.replace(/^[^:]+:/, "").split(".").pop()!
    : snake;

  const lines: string[] = [];
  lines.push("");
  lines.push(`namespace ${ns}`);
  lines.push("");

  switch (kind) {
    case "definition":
      lines.push(`/-- ${title} -/`);
      lines.push(`def ${declName} :=`);
      lines.push(`  -- Ref: [manuscript] ${label}`);
      lines.push(`  sorry`);
      break;

    case "theorem":
      lines.push(`/-- **THEOREM.** ${title} -/`);
      lines.push(`theorem ${declName} : True := by`);
      lines.push(`  -- Ref: [manuscript] ${label}`);
      lines.push(`  sorry`);
      break;

    case "lemma":
      lines.push(`/-- **LEMMA.** ${title} -/`);
      lines.push(`theorem ${declName} : True := by`);
      lines.push(`  -- Ref: [manuscript] ${label}`);
      lines.push(`  sorry`);
      break;

    case "proposition":
      lines.push(`/-- **PROPOSITION.** ${title} -/`);
      lines.push(`theorem ${declName} : True := by`);
      lines.push(`  -- Ref: [manuscript] ${label}`);
      lines.push(`  sorry`);
      break;

    case "corollary":
      lines.push(`/-- **COROLLARY.** ${title} -/`);
      lines.push(`theorem ${declName} : True := by`);
      lines.push(`  -- Ref: [manuscript] ${label}`);
      lines.push(`  sorry`);
      break;

    case "conjecture":
      lines.push(`/-- **CONJECTURE.** ${title} -/`);
      lines.push(`class ${labelToNamespace(label)} where`);
      lines.push(`  holds : Prop`);
      lines.push(`  -- Ref: [manuscript] ${label}`);
      break;

    case "proof":
      lines.push(`/-- Proof of ${title}. -/`);
      lines.push(`theorem ${declName} : True := by`);
      lines.push(`  -- Ref: [manuscript] ${label}`);
      lines.push(`  sorry`);
      break;

    default:
      lines.push(`/-- ${title} -/`);
      lines.push(`def ${declName} :=`);
      lines.push(`  -- Ref: [manuscript] ${label}`);
      lines.push(`  sorry`);
  }

  lines.push("");
  lines.push(`end ${ns}`);
  lines.push("");
  return lines.join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.root) {
    console.error("Usage: bun run pipeline/generate-lean-stubs.ts <chapter-dir>");
    process.exit(2);
  }

  const rootPath = resolve(REPO_ROOT, "content", args.root);
  if (!existsSync(rootPath)) {
    console.error(`Root not found: ${rootPath}`);
    process.exit(2);
  }

  let generated = 0;
  let skipped = 0;

  for (const block of walkBlocks(rootPath)) {
    if (!block.lean) { continue; }
    const leanPath = resolve(REPO_ROOT, "content", block.lean);
    if (!existsSync(leanPath)) { continue; }

    const leanText = readFileSync(leanPath, "utf-8");
    if (hasLeanDecls(leanText)) {
      skipped++;
      continue;
    }

    const tsPath = resolve(REPO_ROOT, "content", block.ts);
    const tsText = readFileSync(tsPath, "utf-8");
    const kind = extractKind(tsText);
    const label = extractLabel(tsText);
    const title = extractTitle(tsText) ?? label ?? "untitled";
    const leanRef = extractLeanRef(tsText);

    if (!kind || !label) {
      skipped++;
      continue;
    }

    const decl = generateDeclaration(kind, label, title, leanRef);

    if (args.dryRun) {
      console.log(`WOULD GENERATE: ${relative(REPO_ROOT, leanPath)}`);
      console.log(`  kind=${kind} label=${label} ref=${leanRef ?? "(none)"}`);
      console.log(`  decl preview: ${decl.split("\n").filter(l => l.includes("theorem") || l.includes("def ") || l.includes("class ")).join("; ")}`);
    } else {
      const updated = leanText.trimEnd() + "\n" + decl;
      writeFileSync(leanPath, updated, "utf-8");
      console.log(`GENERATED: ${relative(REPO_ROOT, leanPath)} (${kind} ${label})`);
    }
    generated++;
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped (already have declarations)`);
}

main();
