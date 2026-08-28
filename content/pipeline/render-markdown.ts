/**
 * Assemble a folio into a single Markdown document — the render path that
 * needs no TeX installation.
 *
 * ## Why this exists rather than reusing the LaTeX pipeline
 *
 * `render-latex.ts` is a *translator*: block `.md` is Markdown, LaTeX is not,
 * so ~1,800 lines convert one to the other and the fidelity of that
 * conversion is most of the file. Assembling the same corpus into Markdown is
 * a different job — the block bodies are already in the target language, so
 * what is left is structure: headings, block headers, labels, anchors and
 * ordering. Routing Markdown through the LaTeX renderer and back out again
 * would introduce an escaping round-trip that can only lose information.
 *
 * The consequence worth stating: this module is not a second renderer to keep
 * in sync with the first. It shares the *inputs* (the same manifests, the
 * same `.md` files) and nothing else, so a change to LaTeX escaping has no
 * counterpart here to drift from.
 *
 * ## What it deliberately does not do
 *
 * No citation resolution, no bibliography, no glossary, no cross-reference
 * numbering. Those are real features of the LaTeX pipeline and their absence
 * here is a gap, not a design statement — but each needs a decision about
 * what the Markdown analogue *is* (a footnote? a link? CSL JSON?), and
 * guessing wrong would be worse than the honest omission. Cross-references
 * are emitted as anchor links, which is the one case where the analogue is
 * unambiguous. `\cite{…}` is left verbatim so it is visible in the output
 * rather than silently dropped.
 *
 * @module content/pipeline/render-markdown
 */

import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";

import type { Block, Chapter, Paper, Section } from "../../schemas/types";
import { isSectionRef } from "../../adapters/manifest-entries";

// ── Block headers ────────────────────────────────────────────────

/**
 * The heading shown above a block, by kind.
 *
 * `prose` is absent on purpose: a prose block is narrative, and stamping
 * "**Prose.**" above every paragraph of a policy document would be noise on
 * the most common kind in the corpus. Every other kind names itself, because
 * a reader needs to know whether they are looking at an example or a
 * normative statement.
 */
const KIND_HEADING: Record<string, string> = {
  definition: "Definition",
  theorem: "Theorem",
  lemma: "Lemma",
  proposition: "Proposition",
  corollary: "Corollary",
  algorithm: "Algorithm",
  conjecture: "Conjecture",
  example: "Example",
  remark: "Remark",
  proof: "Proof",
  simulator: "Simulator",
  equation: "Equation",
  diagram: "Figure",
  table: "Table",
};

/** A block as this module needs it: the manifest plus its narrative body. */
export interface LoadedBlockEntry {
  block: Block;
  mdContent: string;
}

export interface MarkdownRenderOptions {
  /**
   * Emit an HTML anchor (`<a id="…">`) before each labelled block.
   *
   * On by default because a label is the only stable handle a cross-reference
   * has, and GFM's heading-derived anchors change whenever a title is edited
   * — which is exactly when a link most needs to keep working.
   */
  anchors?: boolean;
  /** Heading level the chapter title is emitted at. Sections take this + 1. */
  baseHeadingLevel?: number;
}

/** `#` repeated, clamped to the six levels HTML actually has. */
function hashes(level: number): string {
  return "#".repeat(Math.max(1, Math.min(6, level)));
}

function blockLabel(block: Block): string | undefined {
  return "label" in block && typeof block.label === "string" ? block.label : undefined;
}

function blockTitle(block: Block): string | undefined {
  return "title" in block && typeof block.title === "string" ? block.title : undefined;
}

/**
 * Render one block: an optional anchor, a bolded kind heading, then the body
 * verbatim.
 *
 * The body is emitted **unchanged**. That is the whole point of the Markdown
 * path — whatever an author wrote, including raw HTML, footnotes and GFM
 * tables, survives to the output because nothing translates it.
 */
export function renderBlockMarkdown(
  entry: LoadedBlockEntry,
  opts: MarkdownRenderOptions = {},
): string {
  const { block, mdContent } = entry;
  const lines: string[] = [];
  const label = blockLabel(block);
  const heading = KIND_HEADING[block.kind];

  if (opts.anchors !== false && label) lines.push(`<a id="${label}"></a>`);

  if (heading) {
    const title = blockTitle(block);
    lines.push(title ? `**${heading}.** *${title}*` : `**${heading}.**`);
    lines.push("");
  }

  const body = mdContent.trim();
  if (body) lines.push(body);

  return lines.join("\n");
}

/** The block root-names a section contributes, its subsections included. */
function sectionBlocks(sec: Section): string[] {
  const own = Array.isArray(sec.blocks) ? sec.blocks : [];
  const subs = Array.isArray(sec.subsections)
    ? sec.subsections.flatMap((s) =>
        !isSectionRef(s) && Array.isArray(s.blocks) ? s.blocks : [],
      )
    : [];
  return [...own, ...subs];
}

/** Render one section: its heading, then each of its blocks in order. */
export function renderSectionMarkdown(
  section: Section,
  blocks: Map<string, LoadedBlockEntry>,
  opts: MarkdownRenderOptions = {},
): string {
  const level = (opts.baseHeadingLevel ?? 1) + 1;
  const lines: string[] = [];

  if (opts.anchors !== false && section.label) lines.push(`<a id="${section.label}"></a>`);
  lines.push(`${hashes(level)} ${section.title}`);
  lines.push("");

  for (const rootName of sectionBlocks(section)) {
    const entry = blocks.get(rootName);
    // A missing block is reported, never skipped in silence: a section that
    // renders short is otherwise indistinguishable from a section that is
    // short, and the manifest naming a block that does not exist is a real
    // finding that `content_validate` will also raise.
    if (!entry) {
      lines.push(`> **Missing block:** \`${rootName}\` is named by this section but was not loaded.`);
      lines.push("");
      continue;
    }
    lines.push(renderBlockMarkdown(entry, opts));
    lines.push("");
  }

  return lines.join("\n");
}

/** Render one chapter: its heading, then each section in manifest order. */
export function renderChapterMarkdown(
  chapter: Chapter,
  blocks: Map<string, LoadedBlockEntry>,
  opts: MarkdownRenderOptions = {},
): string {
  const level = opts.baseHeadingLevel ?? 1;
  const lines: string[] = [];

  if (opts.anchors !== false && chapter.label) lines.push(`<a id="${chapter.label}"></a>`);
  lines.push(`${hashes(level)} ${chapter.title}`);
  lines.push("");

  for (const sec of chapter.sections) {
    if (isSectionRef(sec)) continue;
    lines.push(renderSectionMarkdown(sec, blocks, opts));
  }

  return lines.join("\n");
}

// ── Whole-folio build ────────────────────────────────────────────

export interface MarkdownBuildResult {
  /** The assembled document. */
  markdown: string;
  /** Chapter directory names, in manifest order. */
  chapterSlugs: string[];
  /** How many blocks were loaded and rendered. */
  blockCount: number;
  /** Anything that went wrong, at the level it went wrong at. */
  issues: { level: "error" | "warn"; message: string }[];
}

/**
 * Build a whole document to Markdown from its `.ts` manifest.
 *
 * Mirrors `buildPaper`'s traversal — manifest → chapter dirs → block `.ts` +
 * `.md` pairs — minus the Lean status overlay and the LaTeX render, neither
 * of which a document folio has any use for.
 *
 * @param paperPath - Path to the document's `.ts` manifest.
 */
export async function buildDocumentMarkdown(
  paperPath: string,
  opts: MarkdownRenderOptions = {},
): Promise<MarkdownBuildResult> {
  const issues: MarkdownBuildResult["issues"] = [];
  const docDir = dirname(paperPath);

  const paperMod = await import(paperPath);
  const paper: Paper = paperMod.default;

  const blocks = new Map<string, LoadedBlockEntry>();
  const chapterSlugs: string[] = [];
  const rendered: string[] = [];

  rendered.push(`# ${paper.title ?? "Untitled document"}`, "");


  for (const chRef of paper.chapters) {
    const chDir = join(docDir, chRef.dir);
    const chPath = join(chDir, `${chRef.dir}.ts`);
    if (!existsSync(chPath)) {
      issues.push({ level: "error", message: `Chapter manifest not found: ${chPath}` });
      continue;
    }

    let chapter: Chapter;
    try {
      chapter = (await import(chPath)).default as Chapter;
    } catch (e) {
      issues.push({
        level: "error",
        message: `Chapter manifest failed to import: ${chPath} — ${e instanceof Error ? e.message : String(e)}`,
      });
      continue;
    }
    chapterSlugs.push(chRef.dir);

    for (const sec of chapter.sections) {
      if (isSectionRef(sec)) continue;
      for (const rootName of sectionBlocks(sec)) {
        if (blocks.has(rootName)) continue;
        const tsPath = join(chDir, `${rootName}.ts`);
        const mdPath = join(chDir, `${rootName}.md`);
        if (!existsSync(tsPath)) {
          issues.push({ level: "error", message: `Block manifest not found: ${tsPath}` });
          continue;
        }
        try {
          const block = (await import(tsPath)).default as Block;
          const mdContent = existsSync(mdPath) ? readFileSync(mdPath, "utf-8") : "";
          if (!mdContent.trim()) {
            issues.push({ level: "warn", message: `Block has no narrative body: ${mdPath}` });
          }
          blocks.set(rootName, { block, mdContent });
        } catch (e) {
          issues.push({
            level: "error",
            message: `Block manifest failed to import: ${tsPath} — ${e instanceof Error ? e.message : String(e)}`,
          });
        }
      }
    }

    rendered.push(renderChapterMarkdown(chapter, blocks, { baseHeadingLevel: 2, ...opts }));
  }

  return {
    markdown: rendered.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n",
    chapterSlugs,
    blockCount: blocks.size,
    issues,
  };
}
