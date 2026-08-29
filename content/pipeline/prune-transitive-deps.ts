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
 * ## Editorial relation only
 *
 * `uses[]` is the **editorial** relation — what a reader must have read
 * first (see `BlockBase.uses` in `schemas/types.ts`). Transitive
 * reduction is sound HERE precisely because reading-order is transitive:
 * a reader sent to B, who is in turn sent to C, has read C. Listing C
 * directly adds nothing.
 *
 * It is NOT sound on the **formal** relation, and this script must never
 * be pointed at one. A direct formal dependency is a fact about the
 * proof term — that this declaration mentions that one — and remains
 * true no matter what else the proof also invokes. Reducing it would
 * discard real structure.
 *
 * The `uses-editorial-hygiene` QA criterion reports (as `warn`) blocks
 * this script would change.
 *
 * Usage:
 *   bun run content/pipeline/prune-transitive-deps.ts              # dry-run (report only)
 *   bun run content/pipeline/prune-transitive-deps.ts --apply      # rewrite .ts files
 *   bun run content/pipeline/prune-transitive-deps.ts --paper NAME # multi-paper folio
 *
 * @module content/pipeline/prune-transitive-deps
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Paper, Chapter, Section, Block } from "../../schemas/types";
import { findContentRepoRoot } from "./repo-root";
import { requirePaper } from "./repo-root";
import { findUsesField, replaceUsesArray, removeUsesField } from "./uses-field";
import { verifyEditedBlock } from "./block-module";

// Was rooted at this file's own location, which is the PLATFORM — but every
// path below is folio content. `findContentRepoRoot()` walks up from cwd;
// it must not use `import.meta.dir`, which resolves back through a folio's
// `folio-assistant/` symlink to the platform.
const REPO_ROOT = findContentRepoRoot();
const CONTENT_ROOT = join(REPO_ROOT, "content");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const argValue = (flag: string) =>
  args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
// Was a hardcoded folio paper name in PLATFORM code; see `requirePaper`.
// `--paper` matters in a MULTI-paper folio: `requirePaper()` with no argument
// throws "5 papers found — name one explicitly", and until this flag existed
// there was no way to name one, so the script could not run there at all.
//
// A FLAG here, where `generate-index.ts` and `find-dangling-remarks.ts` both
// take the paper positionally as `process.argv[2]`. That is deliberate, not
// drift: those two take no flags, while this script takes `--apply`. Under the
// positional convention, `prune-transitive-deps.ts --apply` would read
// `argv[2] === "--apply"` as the paper name and `requirePaper` would hand it
// straight back, so the run would look for a paper called `--apply` instead of
// pruning anything.
// (qou carries five: bach2013-double-slit, fred2005-formal-groups,
// quantum-observable-universe, unital-groebner-bases, visualizer.)
const PAPER_NAME = requirePaper(argValue("--paper"));
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

async function applyPruning(
  blocks: BlockInfo[],
  pruning: Map<string, { pruned: string[] }>,
): Promise<number> {
  let filesChanged = 0;
  let refused = 0;
  const blockByLabel = new Map<string, BlockInfo>();
  for (const b of blocks) blockByLabel.set(b.label, b);

  for (const [label, { pruned }] of pruning) {
    const block = blockByLabel.get(label);
    if (!block) continue;

    const tsPath = block.tsPath;
    let content = readFileSync(tsPath, "utf-8");

    // Locate the uses[] field. The previous pattern was
    // `/uses:\s*\[[\s\S]*?\]/` — no word boundary, so on a block with a
    // `causes:` field earlier in the object this WROTE OVER THAT FIELD,
    // and non-greedy, so an entry containing `]` truncated the match
    // mid-array. This is the write path; both mistakes edit content.
    if (!findUsesField(content)) {
      console.warn(`  ⚠ Could not find uses[] in ${tsPath}`);
      continue;
    }

    if (pruned.length === 0) {
      content = removeUsesField(content);
    } else if (pruned.length === 1) {
      content = replaceUsesArray(content, `["${pruned[0]}"]`);
    } else {
      const indent = "    ";
      const entries = pruned.map((u) => `${indent}"${u}",`).join("\n");
      content = replaceUsesArray(content, `[\n${entries}\n  ]`);
    }

    // Verify the edit against the module system before it lands.
    //
    // Every version of this write path has been a text edit trusted on
    // faith. The block is a module, so its post-edit `uses[]` can simply
    // be read rather than assumed — and that catches any way the splice
    // could be wrong, including ones nobody anticipated, instead of only
    // the two that have been found so far.
    const verdict = await verifyEditedBlock(tsPath, content, pruned);
    if (!verdict.ok) {
      console.error(`  ✗ REFUSED to write ${tsPath}\n      ${verdict.reason}`);
      refused++;
      continue;
    }

    writeFileSync(tsPath, content);
    filesChanged++;
  }

  if (refused > 0) {
    console.error(
      `\n  ${refused} file(s) NOT written — the edit did not verify against the ` +
        `loaded module. Nothing was changed for those blocks.`,
    );
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
    const changed = await applyPruning(blocks, pruning);
    console.log(`✓ ${changed} files updated.`);
  } else {
    console.log("\nDry run — pass --apply to rewrite files.");
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
