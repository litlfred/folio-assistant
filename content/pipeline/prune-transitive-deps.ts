#!/usr/bin/env bun
/**
 * Prune transitive dependencies from content block uses[] fields.
 *
 * If A uses B and B uses C, then A does not need C in its uses[] —
 * only immediate neighbors belong in uses[].
 *
 * This computes the transitive reduction of the dependency graph:
 * for each block, remove any uses[] entry that is reachable through
 * another uses[] entry.
 *
 * Usage:
 *   bun run content/pipeline/prune-transitive-deps.ts              # dry-run (report only)
 *   bun run content/pipeline/prune-transitive-deps.ts --apply      # rewrite .ts files
 *
 * @module content/pipeline/prune-transitive-deps
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import type { Paper, Chapter, Section, Block } from "../../schemas/types";

const REPO_ROOT = resolve(import.meta.dir, "../..");
const CONTENT_ROOT = join(REPO_ROOT, "content");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const PAPER_NAME = "quantum-observable-universe";
const PAPER_DIR = join(CONTENT_ROOT, PAPER_NAME);

// ── Load all blocks ─────────────────────────────────────────────

interface BlockInfo {
  label: string;
  uses: string[];
  rootName: string;
  tsPath: string;
}

async function loadAllBlocks(): Promise<BlockInfo[]> {
  const paperPath = join(PAPER_DIR, `${PAPER_NAME}.ts`);
  const paper: Paper = (await import(paperPath)).default;
  const blocks: BlockInfo[] = [];

  for (const chRef of paper.chapters) {
    const chDir = join(PAPER_DIR, chRef.dir);
    const chPath = join(chDir, `${chRef.dir}.ts`);
    const ch: Chapter = (await import(chPath)).default;

    for (const sec of ch.sections) {
      if ("name" in sec && !("blocks" in sec)) continue;
      const section = sec as Section;

      for (const rootName of section.blocks) {
        const tsPath = join(chDir, `${rootName}.ts`);
        try {
          const block: Block = (await import(tsPath)).default;
          const label = "label" in block ? block.label : undefined;
          const uses = "uses" in block ? (block.uses as string[] ?? []) : [];
          if (label) {
            blocks.push({ label, uses, rootName, tsPath });
          }
        } catch (e) {
          console.warn(`  ⚠ Failed to load block: ${tsPath}`, e);
        }
      }
    }
  }

  return blocks;
}

// ── Transitive reduction ────────────────────────────────────────

/**
 * Check if `target` is reachable from `start` in the dependency graph,
 * WITHOUT going through `start`'s direct edge to `target`.
 *
 * We do BFS from each of start's OTHER uses entries, checking if any
 * path leads to target.
 */
function isReachableIndirectly(
  start: string,
  target: string,
  graph: Map<string, string[]>,
): boolean {
  const directUses = graph.get(start) ?? [];
  // Start BFS from all neighbors EXCEPT the direct edge to target
  const queue: string[] = directUses.filter(u => u !== target);
  const visited = new Set<string>();
  visited.add(start); // don't revisit start

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === target) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = graph.get(current) ?? [];
    for (const n of neighbors) {
      if (!visited.has(n)) {
        queue.push(n);
      }
    }
  }
  return false;
}

/**
 * Compute the transitive reduction: for each block, remove uses[]
 * entries that are reachable via another uses[] entry.
 */
function computePruning(
  blocks: BlockInfo[],
): Map<string, { original: string[]; pruned: string[]; removed: string[] }> {
  // Build adjacency map
  const graph = new Map<string, string[]>();
  for (const b of blocks) {
    graph.set(b.label, [...b.uses]);
  }

  const results = new Map<string, { original: string[]; pruned: string[]; removed: string[] }>();

  for (const b of blocks) {
    if (b.uses.length <= 1) continue; // nothing to prune with 0-1 deps

    const removed: string[] = [];
    const pruned: string[] = [];

    for (const dep of b.uses) {
      if (isReachableIndirectly(b.label, dep, graph)) {
        removed.push(dep);
      } else {
        pruned.push(dep);
      }
    }

    if (removed.length > 0) {
      results.set(b.label, {
        original: b.uses,
        pruned,
        removed,
      });
    }
  }

  return results;
}

// ── Apply changes to .ts files ──────────────────────────────────

function applyPruning(
  blocks: BlockInfo[],
  pruning: Map<string, { pruned: string[] }>,
): number {
  let filesChanged = 0;
  const blockByLabel = new Map<string, BlockInfo>();
  for (const b of blocks) blockByLabel.set(b.label, b);

  for (const [label, { pruned }] of pruning) {
    const block = blockByLabel.get(label);
    if (!block) continue;

    const tsPath = block.tsPath;
    let content = readFileSync(tsPath, "utf-8");

    // Match the uses array in the .ts file and replace it
    // Pattern: uses: [ ... ] (possibly multiline)
    const usesPattern = /uses:\s*\[[\s\S]*?\]/;
    const match = content.match(usesPattern);
    if (!match) {
      console.warn(`  ⚠ Could not find uses[] in ${tsPath}`);
      continue;
    }

    let newUses: string;
    if (pruned.length === 0) {
      // Remove the uses field entirely
      // Match uses: [...], with optional trailing comma
      const removePattern = /\s*uses:\s*\[[\s\S]*?\],?\n?/;
      content = content.replace(removePattern, "\n");
    } else if (pruned.length === 1) {
      newUses = `uses: ["${pruned[0]}"]`;
      content = content.replace(usesPattern, newUses);
    } else {
      const indent = "    ";
      const entries = pruned.map(u => `${indent}"${u}",`).join("\n");
      newUses = `uses: [\n${entries}\n  ]`;
      content = content.replace(usesPattern, newUses);
    }

    writeFileSync(tsPath, content);
    filesChanged++;
  }

  return filesChanged;
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  console.log("Loading all content blocks...");
  const blocks = await loadAllBlocks();
  console.log(`  ${blocks.length} blocks loaded, ${blocks.filter(b => b.uses.length > 0).length} with uses[]`);

  console.log("\nComputing transitive reduction...");
  const pruning = computePruning(blocks);

  if (pruning.size === 0) {
    console.log("\n✓ No transitive dependencies found. Graph is already minimal.");
    return;
  }

  // Report
  let totalRemoved = 0;
  console.log(`\n${pruning.size} blocks have transitive deps to prune:\n`);
  for (const [label, { original, pruned, removed }] of pruning) {
    totalRemoved += removed.length;
    console.log(`  ${label}  (${original.length} → ${pruned.length})`);
    for (const r of removed) {
      console.log(`    - ${r}`);
    }
  }
  console.log(`\nTotal edges to remove: ${totalRemoved}`);

  if (APPLY) {
    console.log("\nApplying changes...");
    const changed = applyPruning(blocks, pruning);
    console.log(`✓ ${changed} files updated.`);
  } else {
    console.log("\nDry run — pass --apply to rewrite files.");
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
