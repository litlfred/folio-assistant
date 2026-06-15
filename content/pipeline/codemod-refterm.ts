/**
 * `:refterm[…]` backfill codemod (Phase C of the glossary rollout).
 *
 * Walks every block's `.md` file, parses to mdast (via the shared
 * `parseMdCached`), and replaces bare-text occurrences of known
 * glossary terms with `:refterm[<phrase>]{#<slug>}` directives.
 *
 * Source of truth for "known terms" is the folio-wide `defines[]`
 * index built from the same paper passed to this script.
 *
 * Behaviour:
 *
 *   - **Idempotent.** A text node already inside a `textDirective`
 *     (or whose word is already wrapped) is never re-wrapped.
 *   - **Word-boundary matched.** "alpha-helix" never matches inside
 *     "alphabet". Hyphens in slugs become spaces in the search phrase.
 *   - **Defining occurrence skipped.** If the block declares the slug
 *     in its own `defines[]`, all references in that block are left
 *     alone (the author retains control over the canonical defterm site).
 *   - **Per-chapter scope.** Pass a chapter directory to limit blast
 *     radius during rollout; pass the paper directory to run against
 *     every chapter.
 *   - **Dry-run by default.** Without `--write`, prints a unified-diff
 *     style preview without touching files.
 *
 * Usage:
 *
 *   bun run pipeline/codemod-refterm.ts <paper-or-chapter-dir>            # dry-run
 *   bun run pipeline/codemod-refterm.ts <paper-or-chapter-dir> --write    # apply
 *
 * Mdast-based; no regex over raw markdown source.
 *
 * @module content/pipeline/codemod-refterm
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { basename, join, resolve } from "path";
import { remark } from "remark";
import remarkDirective from "remark-directive";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import { gfmTable } from "micromark-extension-gfm-table";
import { gfmTableFromMarkdown, gfmTableToMarkdown } from "mdast-util-gfm-table";
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough";
import { gfmStrikethroughFromMarkdown, gfmStrikethroughToMarkdown } from "mdast-util-gfm-strikethrough";
import type { Block, Chapter, Paper, Section } from "../schema/types";
import { ChapterSchema, PaperSchema } from "../schema/constraints";
import { buildGlossary } from "./build-glossary";

// Round-trip parser/serializer with directive support. Must mirror
// the configuration used in `render-latex.ts` so that round-tripping
// preserves all existing formatting.
const proc = remark()
  .data("micromarkExtensions", [gfmTable(), gfmStrikethrough()])
  .data("fromMarkdownExtensions", [gfmTableFromMarkdown(), gfmStrikethroughFromMarkdown()])
  .data("toMarkdownExtensions", [gfmTableToMarkdown(), gfmStrikethroughToMarkdown()])
  .use(remarkDirective)
  .use(remarkMath);

interface PhraseEntry {
  /** Canonical slug. */
  slug: string;
  /** Lowercase phrase to search for in text nodes. */
  phrase: string;
}

/** Build the search list, longest-phrase first to win precedence. */
function phraseTable(slugs: string[]): PhraseEntry[] {
  const entries = slugs.map(slug => ({ slug, phrase: slug.replace(/-/g, " ") }));
  entries.sort((a, b) => b.phrase.length - a.phrase.length);
  return entries;
}

/**
 * Replace bare-text mentions of known phrases with `:refterm[…]{#slug}`
 * directives in a single text node. Returns the new sibling array
 * (text + directive nodes) when at least one replacement was made;
 * returns null if nothing changed.
 */
function rewriteTextNode(value: string, phrases: PhraseEntry[]): any[] | null {
  let segments: any[] = [{ type: "text", value }];
  let changed = false;

  for (const { slug, phrase } of phrases) {
    const next: any[] = [];
    const re = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "gi");
    for (const seg of segments) {
      if (seg.type !== "text") {
        next.push(seg);
        continue;
      }
      const text: string = seg.value;
      let last = 0;
      let m: RegExpExecArray | null;
      let any = false;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) {
        any = true;
        if (m.index > last) next.push({ type: "text", value: text.slice(last, m.index) });
        const visible = m[0];
        next.push({
          type: "textDirective",
          name: "refterm",
          attributes: { id: slug },
          children: [{ type: "text", value: visible }],
        });
        last = m.index + visible.length;
      }
      if (any) {
        if (last < text.length) next.push({ type: "text", value: text.slice(last) });
        changed = true;
      } else {
        next.push(seg);
      }
    }
    segments = next;
  }

  return changed ? segments : null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Apply the refterm codemod to a single .md file. Returns the new
 * markdown source, or null if no changes were needed.
 */
export function rewriteMarkdown(
  md: string,
  globalSlugs: Set<string>,
  selfDefines: Set<string>,
): string | null {
  const tree = proc.parse(md);
  const phrases = phraseTable([...globalSlugs].filter(s => !selfDefines.has(s)));
  if (phrases.length === 0) return null;

  let mutated = false;

  visit(tree as any, (node: any, index: number | null, parent: any) => {
    if (!parent || index === null) return;
    if (node.type !== "text") return;
    // Skip text nodes that are children of any directive — they are
    // already part of a wrapped term.
    if (parent.type === "textDirective" || parent.type === "leafDirective" ||
        parent.type === "containerDirective") {
      return;
    }
    // Skip text nodes inside code/math contexts (different types, but
    // belt-and-braces against future additions).
    if (parent.type === "inlineCode" || parent.type === "code" ||
        parent.type === "inlineMath" || parent.type === "math") {
      return;
    }
    const replacement = rewriteTextNode(node.value as string, phrases);
    if (replacement) {
      parent.children.splice(index, 1, ...replacement);
      mutated = true;
      // Skip past the inserted nodes to avoid re-visiting.
      return index + replacement.length;
    }
  });

  if (!mutated) return null;
  return String(proc.stringify(tree as any));
}

// ── Discovery ────────────────────────────────────────────────────

/**
 * Resolve the target chapter directories from a paper or chapter dir.
 */
async function resolveChapters(
  target: string,
): Promise<{ paperDir: string; chapterDirs: string[] }> {
  const dirName = basename(target);
  const manifest = join(target, `${dirName}.ts`);
  if (!existsSync(manifest)) {
    throw new Error(`Manifest not found: ${manifest}`);
  }
  const mod = await import(manifest);
  if (PaperSchema.safeParse(mod.default).success) {
    const paper: Paper = mod.default;
    return {
      paperDir: target,
      chapterDirs: paper.chapters.map(c => join(target, c.dir)),
    };
  }
  if (ChapterSchema.safeParse(mod.default).success) {
    // Single-chapter mode — paperDir is the parent.
    return {
      paperDir: resolve(target, ".."),
      chapterDirs: [target],
    };
  }
  throw new Error(`Unrecognised manifest at ${manifest}`);
}

async function chapterBlockNames(chapterDir: string): Promise<string[]> {
  const dirName = basename(chapterDir);
  const manifest = join(chapterDir, `${dirName}.ts`);
  if (!existsSync(manifest)) return [];
  const mod = await import(manifest);
  if (!ChapterSchema.safeParse(mod.default).success) return [];
  const chapter: Chapter = mod.default;
  const names: string[] = [];
  for (const sec of chapter.sections) {
    if ("blocks" in sec) names.push(...(sec as Section).blocks);
  }
  return names;
}

async function blockSelfDefines(blockTsPath: string): Promise<Set<string>> {
  try {
    const mod = await import(blockTsPath);
    const block: Block = mod.default;
    return new Set(((block as any).defines as string[] | undefined) ?? []);
  } catch {
    return new Set();
  }
}

// ── CLI entry point ──────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const positional = args.filter(a => !a.startsWith("--"));
  const target = resolve(positional[0] || "");
  if (!target || !existsSync(target)) {
    console.error(`Usage: codemod-refterm.ts <paper-or-chapter-dir> [--write]`);
    process.exit(2);
  }

  const { paperDir, chapterDirs } = await resolveChapters(target);
  const glossary = await buildGlossary(paperDir);
  const globalSlugs = new Set(glossary.entries.map(e => e.slug));
  if (globalSlugs.size === 0) {
    console.log("No glossary terms declared yet — nothing to backfill.");
    process.exit(0);
  }

  let touched = 0;
  for (const chDir of chapterDirs) {
    const names = await chapterBlockNames(chDir);
    for (const name of names) {
      const tsPath = join(chDir, `${name}.ts`);
      const mdPath = join(chDir, `${name}.md`);
      if (!existsSync(mdPath)) continue;
      const md = readFileSync(mdPath, "utf-8");
      const selfDefines = await blockSelfDefines(tsPath);
      const next = rewriteMarkdown(md, globalSlugs, selfDefines);
      if (next === null || next === md) continue;
      touched += 1;
      if (write) {
        writeFileSync(mdPath, next);
        console.log(`✎ ${mdPath}`);
      } else {
        console.log(`--- ${mdPath} (dry-run) ---`);
        // Show a tiny diff: count of lines changed for orientation.
        const beforeLines = md.split("\n").length;
        const afterLines = next.split("\n").length;
        console.log(`  ${beforeLines}→${afterLines} lines (use --write to apply)`);
      }
    }
  }

  console.log(`\n${write ? "Applied" : "Would apply"} changes to ${touched} file(s).`);
}
