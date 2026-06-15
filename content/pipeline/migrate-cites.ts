#!/usr/bin/env bun
/**
 * One-shot migration: auto-populate cites[] in block manifests.
 *
 * Scans each .ts block, reads its sibling .md, extracts \cite{} keys,
 * and adds `cites: [...]` to the builder call if not already present.
 *
 * Usage:
 *   bun run pipeline/migrate-cites.ts          # dry run
 *   bun run pipeline/migrate-cites.ts --write  # actually modify files
 *
 * @module content/pipeline/migrate-cites
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { extractCitations } from "./citations";

const REPO_ROOT = resolve(import.meta.dir, "../..");
const CONTENT_ROOT = join(REPO_ROOT, "content");
const args = process.argv.slice(2);
const dryRun = !args.includes("--write");

if (dryRun) console.log("DRY RUN — pass --write to modify files\n");

let modified = 0;
let skipped = 0;
let noCites = 0;

function walkDir(dir: string) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "schema" || entry.name === "pipeline") continue;
      walkDir(full);
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      processBlock(full);
    }
  }
}

function processBlock(tsPath: string) {
  const rootName = tsPath.replace(/\.ts$/, "");
  const mdPath = rootName + ".md";
  if (!existsSync(mdPath)) return;

  const tsContent = readFileSync(tsPath, "utf-8");
  const mdContent = readFileSync(mdPath, "utf-8");

  // Only process files that use builder functions
  if (!/(definition|theorem|lemma|proposition|corollary|conjecture|example|remark|proof|prose)\(/.test(tsContent)) return;

  // Skip if cites already present
  if (/\bcites\s*:/.test(tsContent)) {
    skipped++;
    return;
  }

  const cites = extractCitations(mdContent);
  if (cites.length === 0) {
    noCites++;
    return;
  }

  // Insert cites after the label field, or after kind if no label
  let newContent = tsContent;

  // Strategy: insert `cites: [...]` after the label line
  const citesStr = `  cites: [${cites.map(k => `"${k}"`).join(", ")}],`;

  // Try to insert after label: "..." line
  const labelMatch = newContent.match(/^(\s*label\s*:\s*"[^"]*"\s*,?\s*)$/m);
  if (labelMatch) {
    const insertIdx = newContent.indexOf(labelMatch[0]) + labelMatch[0].length;
    newContent = newContent.slice(0, insertIdx) + "\n" + citesStr + newContent.slice(insertIdx);
  } else {
    // Try after title: "..." line
    const titleMatch = newContent.match(/^(\s*title\s*:\s*"[^"]*"\s*,?\s*)$/m);
    if (titleMatch) {
      const insertIdx = newContent.indexOf(titleMatch[0]) + titleMatch[0].length;
      newContent = newContent.slice(0, insertIdx) + "\n" + citesStr + newContent.slice(insertIdx);
    } else {
      // Skip — can't find insertion point
      console.log(`  SKIP (no label/title): ${tsPath.replace(CONTENT_ROOT + "/", "")}`);
      return;
    }
  }

  const relPath = tsPath.replace(CONTENT_ROOT + "/", "");
  console.log(`  ${dryRun ? "WOULD" : "WRITE"}: ${relPath}  cites: [${cites.join(", ")}]`);

  if (!dryRun) {
    writeFileSync(tsPath, newContent);
  }
  modified++;
}

walkDir(CONTENT_ROOT);

console.log(`\n${modified} files ${dryRun ? "would be" : ""} modified`);
console.log(`${skipped} already had cites`);
console.log(`${noCites} had no citations in .md`);
