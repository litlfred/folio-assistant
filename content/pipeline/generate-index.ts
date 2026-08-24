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
 *   bun run content/pipeline/generate-index.ts --paper NAME   # multi-paper folio
 */

import { writeFileSync } from "fs";
import { join} from "path";
import type { Section, SectionRef } from "../../schemas/types";
import { findContentRepoRoot } from "./repo-root";
import { requirePaper } from "./repo-root";

// Was rooted at this file's own location, which is the PLATFORM — but every
// path below is folio content. `findContentRepoRoot()` walks up from cwd;
// it must not use `import.meta.dir`, which resolves back through a folio's
// `folio-assistant/` symlink to the platform.
const REPO_ROOT = findContentRepoRoot();
const CONTENT_ROOT = join(REPO_ROOT, "content");
const args = process.argv.slice(2);
const argValue = (flag: string) =>
  args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
// Was a hardcoded folio paper name in PLATFORM code; see `requirePaper`.
// `--paper` matters in a MULTI-paper folio, where `requirePaper()` with no
// argument throws "N papers found — name one explicitly" and, without this
// flag, left no way to name one. qou carries five.
const PAPER_NAME = requirePaper(argValue("--paper"));
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
  /** Blocks the walk could not load, reported rather than silently dropped. */
  const skipped: string[] = [];

  // Auto-number chapters from manifest order: skip unnumbered ones (tabLabel set)
  let autoNum = 1;
  for (const chRef of paper.chapters) {
    const chDir = join(PAPER_DIR, chRef.dir);
    const chMod = await import(join(chDir, `${chRef.dir}.ts`));
    const ch = chMod.default;
    // Chapters with tabLabel are unnumbered (Introduction, Glossary, etc.)
    const chapterNumber = ch.tabLabel != null ? undefined : autoNum++;

    // Walk sections AND their subsections. A single-level loop over
    // `ch.sections` misses every block in a nested `section({...})`, and
    // chapters do nest — `mass-theory.ts` alone puts ~107 indexed blocks
    // inside subsections. Measured against qou 2026-08-24: the walk found
    // 1102 entries where the file it overwrites listed 1269, and the 167
    // it omitted were registered blocks in nested subsections, not retired
    // ones. A generator that silently narrows the index it rewrites is the
    // worst shape for this: the total is printed as if it were the corpus.
    const walkSection = async (section: Section): Promise<void> => {
      for (const rootName of section.blocks ?? []) {
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
        } catch (e) {
          // Was a silent `catch {}`. A block that failed to import then
          // vanished from the index with nothing said — an absent entry
          // indistinguishable from a block that has no label.
          skipped.push(`${chRef.dir}/${rootName}: ${(e as Error).message.split("\n")[0]}`);
        }
      }
      for (const sub of section.subsections ?? []) {
        const inline = sub as Partial<Section>;
        if (Array.isArray(inline.blocks) || Array.isArray(inline.subsections)) {
          await walkSection(sub as Section);
        } else if ((sub as SectionRef).name) {
          // A `SectionRef` names a file this walker does not resolve.
          // Report rather than drop: entries behind it would be missing.
          skipped.push(`${chRef.dir}: unresolved sectionRef "${(sub as SectionRef).name}"`);
        }
      }
    };
    for (const section of ch.sections) await walkSection(section);
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

    // Naive `+ "s"` wrote "## Corollarys". The committed index said
    // "Corollaries", so the heading had been hand-corrected and every
    // regeneration silently undid it.
    const PLURAL: Record<string, string> = { corollary: "Corollaries" };
    const kindTitle =
      PLURAL[kind] ?? kind.charAt(0).toUpperCase() + kind.slice(1) + "s";
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
  if (skipped.length > 0) {
    console.log(`  ! ${skipped.length} block(s) NOT indexed — the total above is`);
    console.log(`    short by that many, and these are why:`);
    for (const s of skipped.slice(0, 20)) console.log(`      ${s}`);
    if (skipped.length > 20) console.log(`      ... ${skipped.length - 20} more`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
