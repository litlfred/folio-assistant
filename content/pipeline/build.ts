/**
 * Build pipeline: content objects → LaTeX chapters.
 *
 * Loads a paper manifest (with ChapterRef[]), resolves chapter .ts files,
 * loads all blocks from chapter directories, renders to LaTeX,
 * validates AST integrity, writes output.
 *
 * Usage:
 *   bun run pipeline/build.ts [paper.ts] [--out-dir chapters/]
 *
 * @module content/pipeline/build
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname, resolve, relative } from "path";
import type { Paper, Chapter, Section, Block, RenderOptions } from "../../schemas/types";
import { extractBlockLabel, isCrossPaperRef } from "../../schemas/types";
import { renderChapter, validateLatexAst } from "./render-latex";
import { generateMainTex } from "./generate-main-tex";
import { runPreflight } from "./latex-preflight";
import { resolveLeanFile, leanFileStatus } from "../../scripts/lean-coverage";

// ── Build ────────────────────────────────────────────────────────

export interface BuildResult {
  /** Rendered LaTeX per chapter (keyed by chapter number). */
  chapters: Map<number, string>;
  /** Chapter slug names derived from directory names (e.g. "quantum-observable-universe"). */
  chapterSlugs: Map<number, string>;
  /**
   * Standalone appendix chapters — excluded from the main paper PDF and
   * compiled as separate PDFs. Detected as back-matter chapters: those
   * with a `tabLabel` that appear after all numbered (non-tabLabel) chapters
   * in the manifest. The Introduction (tabLabel "I", typically first) is
   * never treated as an appendix.
   */
  appendixChapters: Map<number, { slug: string; title: string; tabLabel: string }>;
  /**
   * Labels from blocks in excluded appendix chapters. These are emitted
   * as phantom labels in main.tex so that \hyperref references from the
   * main body resolve without "undefined" warnings.
   */
  appendixPhantomLabels: string[];
  /** Validation issues encountered. */
  issues: { level: string; message: string }[];
  /** Whether all rendered LaTeX passes AST validation. */
  astValid: boolean;
}

/**
 * Build a paper from its manifest.
 *
 * Resolves ChapterRef[] → Chapter[] by importing chapter .ts manifests
 * from their directories, then loads block .ts + .md pairs from the
 * same chapter directories.
 *
 * @param paperPath - Path to the paper .ts manifest
 * @param opts - Render options (print mode, compact inline refs)
 */
export async function buildPaper(
  paperPath: string,
  opts: RenderOptions = {},
): Promise<BuildResult> {
  const issues: { level: string; message: string }[] = [];
  const paperDir = dirname(paperPath);
  // Lake library root for this paper — used to resolve each block's `.lean`
  // (sibling or lean.ref) when overlaying live formalisation status below.
  const leanRoot = join(paperDir, "lean");

  // 1. Load paper manifest
  const paperMod = await import(paperPath);
  const paper: Paper = paperMod.default;

  // 2. Resolve chapters and load all blocks
  const resolvedChapters: { chapter: Chapter; manifestIdx: number; dir: string }[] = [];
  const chapterSlugs = new Map<number, string>();
  const chapterMeta = new Map<number, { slug: string; title: string; tabLabel?: string }>();
  const blocks = new Map<string, { block: Block; mdContent: string; sourceDir?: string }>();

  for (let chIdx = 0; chIdx < paper.chapters.length; chIdx++) {
    const chRef = paper.chapters[chIdx];
    const chDir = join(paperDir, chRef.dir);
    const chPath = join(chDir, `${chRef.dir}.ts`);

    if (!existsSync(chPath)) {
      issues.push({ level: "error", message: `Chapter manifest not found: ${chPath}` });
      continue;
    }

    try {
      const chMod = await import(chPath);
      const chapter: Chapter = chMod.default;
      resolvedChapters.push({ chapter, manifestIdx: chIdx, dir: chRef.dir });

      // Chapter slug is now simply the directory name (no ch#- prefix to strip).
      const slug = chRef.dir;
      // Use manifest index as key to preserve author-defined chapter order
      chapterSlugs.set(chIdx, slug);
      chapterMeta.set(chIdx, { slug, title: chapter.title, tabLabel: chapter.tabLabel });

      // Load blocks from the chapter directory. Sections may nest one
      // level of `subsections`, each carrying its own `blocks`; the render
      // side (renderSection) flattens those, so the loader must too — else
      // subsection-only blocks are never loaded into the block map and
      // silently drop from the paper (their labels come out undefined).
      for (const sec of chapter.sections) {
        if (!("blocks" in sec)) continue;
        const section = sec as Section;
        const subBlocks = Array.isArray(section.subsections)
          ? section.subsections.flatMap((s) =>
              "blocks" in s ? (s as Section).blocks : [],
            )
          : [];
        for (const rootName of [...section.blocks, ...subBlocks]) {
          if (blocks.has(rootName)) continue;

          const tsPath = join(chDir, `${rootName}.ts`);
          const mdPath = join(chDir, `${rootName}.md`);

          try {
            const mod = await import(tsPath);
            const block: Block = mod.default;
            const mdContent = existsSync(mdPath) ? readFileSync(mdPath, "utf-8") : "";
            // sourceDir relative to repo root (one level above content/)
            const repoRoot = resolve(paperDir, "..");
            const sourceDir = relative(repoRoot, chDir);
            // Overlay LIVE Lean status so the PDF ∀ margin marks reflect the
            // actual .lean, not the (usually `not_checked`) hand-set field.
            // Without this every mark defaults to "drafted" even when the
            // proof is sorry-free. Resolve sibling-or-ref, then classify.
            if (block && "lean" in block && block.lean) {
              const leanFile = resolveLeanFile(tsPath, readFileSync(tsPath, "utf-8"), leanRoot);
              if (leanFile) {
                const st = leanFileStatus(leanFile);
                block.lean.sorryFree = st.sorryFree;
                // Keep an explicit validation only when the manifest hasn't
                // already recorded a stronger CI verdict.
                if (!block.lean.validation || block.lean.validation === "not_checked") {
                  block.lean.validation = st.validation;
                }
              }
            }
            blocks.set(rootName, { block, mdContent, sourceDir });
          } catch (e) {
            issues.push({
              level: "error",
              message: `Failed to load block "${rootName}": ${e instanceof Error ? e.message : String(e)}`,
            });
          }
        }
      }
    } catch (e) {
      issues.push({
        level: "error",
        message: `Failed to load chapter "${chRef.dir}": ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  // 2b. Detect standalone appendix chapters.
  // Back-matter chapters are tabLabel'd chapters that appear AFTER all
  // numbered (non-tabLabel) chapters in the manifest. The Introduction
  // (first chapter, tabLabel "I") is never an appendix. Chapters like
  // Preface or Acknowledgments that precede numbered content would also
  // be kept in the main paper by this logic.
  const appendixChapters = new Map<number, { slug: string; title: string; tabLabel: string }>();
  let lastNumberedIdx = -1;
  for (const [idx, meta] of chapterMeta) {
    if (!meta.tabLabel) lastNumberedIdx = idx;
  }
  if (lastNumberedIdx > -1) {
    for (const [idx, meta] of chapterMeta) {
      if (meta.tabLabel && idx > lastNumberedIdx) {
        appendixChapters.set(idx, {
          slug: meta.slug,
          title: meta.title,
          tabLabel: meta.tabLabel,
        });
      }
    }
  }

  // 2c. Collect phantom labels from excluded appendix chapters.
  // When appendix chapters are excluded from main.tex (compiled standalone),
  // their block labels are undefined in the main paper. We collect these
  // labels so main.tex can declare phantom anchors, preventing hyperref
  // "undefined" warnings.
  const appendixPhantomLabels: string[] = [];
  for (const [idx] of appendixChapters) {
    const resolved = resolvedChapters.find(r => r.manifestIdx === idx);
    if (!resolved) continue;
    const ch = resolved.chapter;
    // Collect chapter label
    if (ch.label) appendixPhantomLabels.push(ch.label);
    for (const sec of ch.sections) {
      if (!("blocks" in sec)) continue;
      const s = sec as Section;
      // Collect section label
      if (s.label) appendixPhantomLabels.push(s.label);
      // Collect block labels
      for (const rootName of s.blocks) {
        const entry = blocks.get(rootName);
        if (!entry) continue;
        const label = extractBlockLabel(entry.block);
        if (label) appendixPhantomLabels.push(label);
      }
    }
  }

  // 3. Render chapters
  const chapters = new Map<number, string>();
  let astValid = true;

  // Paper slug = the last path segment of paperDir, used to build the
  // `\sourcebase`-relative chapter URL inside \chapterannot{}.
  const paperSlug = paperDir.split("/").filter(Boolean).pop() ?? "";
  for (const { chapter, manifestIdx, dir } of resolvedChapters) {
    const latex = renderChapter(chapter, blocks, opts, dir, paperSlug);
    chapters.set(manifestIdx, latex);

    // AST validation
    const ast = validateLatexAst(latex);
    if (!ast.valid) {
      astValid = false;
      for (const err of ast.errors) {
        issues.push({ level: "error", message: `Chapter ${chapter.number ?? chapter.title} AST: ${err}` });
      }
    }
  }

  // 4. Cross-reference validation: detect \hyperref targets that have
  //    no corresponding \label in the rendered output.
  //    Collect all defined labels (from blocks, sections, chapters).
  const definedLabels = new Set<string>();
  for (const [name, entry] of blocks) {
    if (!entry.block || typeof entry.block !== "object") {
      console.warn(`build: skipping malformed block entry for "${name}" `
        + `(block is ${entry.block === null ? "null"
          : typeof entry.block})`);
      continue;
    }
    const label = extractBlockLabel(entry.block);
    if (label) definedLabels.add(label);
  }
  for (const { chapter } of resolvedChapters) {
    if (chapter.label) definedLabels.add(chapter.label);
    for (const sec of chapter.sections) {
      if (!("blocks" in sec)) continue;
      if ((sec as Section).label) definedLabels.add((sec as Section).label!);
    }
  }

  // Scan all markdown content for [text](#label) cross-references
  const referencedLabels = new Set<string>();
  for (const [, entry] of blocks) {
    const matches = entry.mdContent.matchAll(/\[([^\]]*)\]\(#([^)]+)\)/g);
    for (const match of matches) {
      const label = match[2];
      // Skip cross-paper references (handled separately in render)
      if (!isCrossPaperRef(label)) {
        referencedLabels.add(label);
      }
    }
  }

  // Report undefined references as warnings
  for (const label of referencedLabels) {
    if (!definedLabels.has(label)) {
      issues.push({
        level: "warning",
        message: `Undefined cross-reference: "${label}" — referenced but no content block defines this label`,
      });
    }
  }

  return { chapters, chapterSlugs, appendixChapters, appendixPhantomLabels, issues, astValid };
}

// ── CLI entry point ──────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const defaultPaper = join(import.meta.dir, "../quantum-observable-universe/quantum-observable-universe.ts");
  // Resolve relative paths against cwd so `bun run pipeline/build.ts rel/path` works.
  // Only treat args[0] as a paper path if it's a positional argument (not a --flag);
  // otherwise fall back to the default paper. This allows invocations like
  // `bun run pipeline/build.ts --generate-main --main-out main.tex` without a path.
  const firstPositional = args[0] && !args[0].startsWith("--") ? args[0] : undefined;
  const paperPath = resolve(firstPositional || defaultPaper);
  const outDirIdx = args.indexOf("--out-dir");
  const outDir = resolve(outDirIdx >= 0 ? args[outDirIdx + 1] : join(import.meta.dir, "../../chapters"));

  // Parse print mode options
  const printModeIdx = args.indexOf("--print-mode");
  const printMode = printModeIdx >= 0 ? args[printModeIdx + 1] as "formal" | "compact" : "compact";
  const noInlineRefs = args.includes("--no-inline-refs");

  console.log(`Building paper: ${paperPath}`);
  console.log(`Output dir: ${outDir}`);
  console.log(`Print mode: ${printMode}${noInlineRefs ? " (inline refs disabled)" : ""}\n`);

  const result = await buildPaper(paperPath, {
    printMode,
    compactInlineRefs: !noInlineRefs,
  });

  // Print issues
  for (const issue of result.issues) {
    const icon = issue.level === "error" ? "✗" : issue.level === "warning" ? "⚠" : "ℹ";
    console.log(`  ${icon} ${issue.message}`);
  }

  // Write chapter output
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  for (const [num, latex] of result.chapters) {
    const slug = result.chapterSlugs.get(num);
    const filename = slug ? `${slug}.tex` : `chapter-${num}.tex`;
    const outPath = join(outDir, filename);
    writeFileSync(outPath, latex);
    console.log(`  → ${outPath}`);
  }

  // Generate main.tex from paper manifest + shared preamble
  if (args.includes("--generate-main")) {
    const mainOutIdx = args.indexOf("--main-out");
    const mainOutPath = resolve(mainOutIdx >= 0 ? args[mainOutIdx + 1] : "main.tex");
    const preambleIdx = args.indexOf("--preamble");
    const preamblePath = resolve(
      preambleIdx >= 0 ? args[preambleIdx + 1] : join(import.meta.dir, "../../latex/preamble.tex"),
    );
    // Compute relative chapters dir from the main.tex output location
    const chaptersDirIdx = args.indexOf("--chapters-dir");
    const chaptersDir = chaptersDirIdx >= 0 ? args[chaptersDirIdx + 1] : "chapters/";

    const paperMod = await import(paperPath);
    const paperData: Paper = paperMod.default;

    // Exclude standalone appendix chapters from the main paper PDF
    const excludeChapterIndices = new Set(result.appendixChapters.keys());

    const mainTex = generateMainTex(paperData, {
      preamblePath,
      chaptersDir,
      chapterSlugs: result.chapterSlugs,
      excludeChapterIndices,
      phantomLabels: result.appendixPhantomLabels,
    });
    writeFileSync(mainOutPath, mainTex);
    console.log(`\n  → main.tex: ${mainOutPath}`);

    // Generate standalone .tex files for each appendix chapter
    const { generateStandaloneAppendixTex } = await import("./generate-main-tex");
    const mainOutDir = dirname(mainOutPath);
    for (const [_idx, info] of result.appendixChapters) {
      const appendixTex = generateStandaloneAppendixTex(paperData, info.slug, info.title, {
        preamblePath,
        chaptersDir,
      });
      const appendixPath = join(mainOutDir, `standalone-${info.slug}.tex`);
      writeFileSync(appendixPath, appendixTex);
      console.log(`  → standalone: ${appendixPath}`);
    }

    // LaTeX preflight (macro lint) on the generated compile unit. Catches
    // the recurring fatal-pdflatex classes (duplicate \newcommand,
    // undefined control sequence, fragile math-accent script) that the
    // unified-latex AST validation cannot see. Reported here for local
    // feedback; CI gates on it separately in publish.yml.
    const pre = runPreflight(mainOutPath);
    if (pre.ok) {
      console.log(
        `  → LaTeX preflight: ✓ clean (${pre.usedCount} macros, ` +
          `${pre.filesScanned} files)`,
      );
    } else {
      console.log(`  → LaTeX preflight: ✗ ${pre.issues.length} issue(s)`);
      for (const iss of pre.issues.slice(0, 30)) {
        console.log(`     [${iss.check}] ${iss.message}`);
      }
      if (pre.issues.length > 30) {
        console.log(`     … and ${pre.issues.length - 30} more`);
      }
    }
  }

  console.log(`\nAST validation: ${result.astValid ? "✓ pass" : "✗ fail"}`);
  const errorCount = result.issues.filter(i => i.level === "error").length;
  console.log(`Issues: ${errorCount} error(s), ${result.issues.length - errorCount} warning(s)`);

  process.exit(errorCount > 0 ? 1 : 0);
}
