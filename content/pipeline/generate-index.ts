#!/usr/bin/env bun
/**
 * Generate the Index of Definitions markdown.
 *
 * Walks all chapters and collects labelled blocks of provable kinds
 * (definition, theorem, proposition, lemma, corollary, conjecture),
 * then writes a markdown table with links to each block's location.
 *
 * Usage:
 *   bun run content/pipeline/generate-index.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const REPO_ROOT = resolve(import.meta.dir, "../..");
const CONTENT_ROOT = join(REPO_ROOT, "content");
const PAPER_NAME = "quantum-observable-universe";
const PAPER_DIR = join(CONTENT_ROOT, PAPER_NAME);
const INDEX_MD = join(PAPER_DIR, "index-of-definitions", "definition-index.md");

const INDEXED_KINDS = new Set([
  "definition", "theorem", "proposition", "lemma",
  "corollary", "conjecture", "example",
]);

interface IndexEntry {
  kind: string;
  label: string;
  title: string;
  chapter: string;
  chapterNumber: number | undefined;
  section: string;
  lean?: string;
}

async function main() {
  // Load paper manifest
  const paperMod = await import(join(PAPER_DIR, `${PAPER_NAME}.ts`));
  const paper = paperMod.default;

  const entries: IndexEntry[] = [];

  // Auto-number chapters from manifest order: skip unnumbered ones (tabLabel set)
  let autoNum = 1;
  for (const chRef of paper.chapters) {
    const chDir = join(PAPER_DIR, chRef.dir);
    const chMod = await import(join(chDir, `${chRef.dir}.ts`));
    const ch = chMod.default;
    // Chapters with tabLabel are unnumbered (Introduction, Glossary, etc.)
    const chapterNumber = ch.tabLabel != null ? undefined : autoNum++;

    for (const section of ch.sections) {
      for (const rootName of section.blocks) {
        try {
          const blockMod = await import(join(chDir, `${rootName}.ts`));
          const block = blockMod.default;
          if (!block.label || !INDEXED_KINDS.has(block.kind)) continue;

          entries.push({
            kind: block.kind,
            label: block.label,
            title: block.title || rootName,
            chapter: ch.title,
            chapterNumber: chapterNumber,
            section: section.title,
            lean: block.lean?.ref,
          });
        } catch {
          // Skip blocks that fail to load
        }
      }
    }
  }

  // Sort by kind, then alphabetically by title
  const kindOrder = ["definition", "theorem", "proposition", "lemma", "corollary", "conjecture", "example"];
  entries.sort((a, b) => {
    const ka = kindOrder.indexOf(a.kind);
    const kb = kindOrder.indexOf(b.kind);
    if (ka !== kb) return ka - kb;
    return a.title.localeCompare(b.title);
  });

  // Group by kind
  const groups = new Map<string, IndexEntry[]>();
  for (const e of entries) {
    if (!groups.has(e.kind)) groups.set(e.kind, []);
    groups.get(e.kind)!.push(e);
  }

  // Generate markdown
  const lines: string[] = [];
  lines.push(`**${entries.length}** indexed entries across ${groups.size} categories.\n`);

  for (const kind of kindOrder) {
    const group = groups.get(kind);
    if (!group) continue;

    const kindTitle = kind.charAt(0).toUpperCase() + kind.slice(1) + "s";
    lines.push(`## ${kindTitle}\n`);
    lines.push("| Label | Title | Chapter | Lean |");
    lines.push("|-------|-------|---------|------|");

    for (const e of group) {
      const chLabel = e.chapterNumber != null ? `Ch ${e.chapterNumber}` : e.chapter;
      const leanCol = e.lean ? `\`${e.lean}\`` : "—";
      lines.push(`| [${e.label}](#${e.label}) | ${e.title} | ${chLabel} | ${leanCol} |`);
    }
    lines.push("");
  }

  writeFileSync(INDEX_MD, lines.join("\n") + "\n");
  console.log(`Index written: ${entries.length} entries → ${INDEX_MD}`);
}

main().catch(e => { console.error(e); process.exit(1); });
