/**
 * Glossary builder (Phase D of the `\defterm` / `\refterm` rollout).
 *
 * Walks every block in a paper, collects each block's `defines[]`,
 * resolves the canonical site (chapter + section + block label +
 * Lean declaration) and emits:
 *
 *   - `glossary.json`  — machine-readable index for the viewer / Lean
 *   - `chapters/glossary.tex` — chapter-grouped, alphabetical-within-chapter
 *     LaTeX glossary chapter. Duplicates (same slug declared by multiple
 *     blocks) render in red with a "(also defined at …)" cross-link.
 *
 * Run modes:
 *
 *   bun run pipeline/build-glossary.ts <paper-dir>           # write outputs
 *   bun run pipeline/build-glossary.ts <paper-dir> --check    # CI gate
 *
 * In `--check` mode the script exits non-zero if any glossary slug is
 * duplicated, if `glossary.json` on disk would change, or if any block's
 * `defines[]` cannot be resolved to a section.
 *
 * @module content/pipeline/build-glossary
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { basename, dirname, join, resolve } from "path";
import type { Block, Chapter, Paper, Section } from "../schema/types";
import { ChapterSchema, PaperSchema } from "../schema/constraints";

// ── Types ────────────────────────────────────────────────────────

export interface GlossaryEntry {
  /** Canonical slug (lowercase, hyphen-separated). */
  slug: string;
  /** Chapter directory name (e.g. "quantum-universes"). */
  chapter: string;
  /** Chapter title (resolved from chapter manifest). */
  chapterTitle: string;
  /** Section title within the chapter, if any. */
  section: string | null;
  /** Block label (e.g. "def:rigid-monoidal-category"). */
  block: string;
  /** Block kind (definition, theorem, …). */
  kind: string;
  /** Lean ref URI (e.g. "qou:QOU.Foo.bar"), if any. */
  lean: string | null;
}

export interface GlossaryIndex {
  /** Build timestamp (ISO 8601). */
  generated: string;
  /** Source paper directory name. */
  paper: string;
  /** All entries, alphabetical by slug. */
  entries: GlossaryEntry[];
  /** Slugs declared by more than one block (slug → list of block labels). */
  duplicates: Record<string, string[]>;
}

// ── Helpers ──────────────────────────────────────────────────────

/** Locate the chapter+section that contains a given block name. */
function locateBlock(
  blockName: string,
  chapter: Chapter,
): { sectionTitle: string | null } {
  for (const sec of chapter.sections) {
    if ("blocks" in sec) {
      const s = sec as Section;
      if (s.blocks.includes(blockName)) {
        return { sectionTitle: s.title ?? null };
      }
    }
  }
  return { sectionTitle: null };
}

/**
 * Walk a paper directory, importing the paper manifest, every chapter
 * manifest, and every block .ts file. Returns the flat list of glossary
 * entries plus the duplicate map.
 */
export async function buildGlossary(paperDir: string): Promise<GlossaryIndex> {
  const paperName = basename(paperDir);
  const paperManifest = join(paperDir, `${paperName}.ts`);
  if (!existsSync(paperManifest)) {
    throw new Error(`Paper manifest not found: ${paperManifest}`);
  }

  const paperMod = await import(paperManifest);
  const paperParsed = PaperSchema.safeParse(paperMod.default);
  if (!paperParsed.success) {
    throw new Error(`Invalid paper manifest: ${paperManifest}`);
  }
  const paper: Paper = paperMod.default;

  const entries: GlossaryEntry[] = [];

  for (const chRef of paper.chapters) {
    const chDir = join(paperDir, chRef.dir);
    const chManifest = join(chDir, `${chRef.dir}.ts`);
    if (!existsSync(chManifest)) continue;

    const chMod = await import(chManifest);
    const chParsed = ChapterSchema.safeParse(chMod.default);
    if (!chParsed.success) continue;
    const chapter: Chapter = chMod.default;

    // Collect block names from sections, in document order.
    const blockNames: string[] = [];
    for (const sec of chapter.sections) {
      if ("blocks" in sec) blockNames.push(...(sec as Section).blocks);
    }

    for (const name of blockNames) {
      const tsPath = join(chDir, `${name}.ts`);
      if (!existsSync(tsPath)) continue;
      try {
        const mod = await import(tsPath);
        const block: Block = mod.default;
        const defines = (block as any).defines as string[] | undefined;
        if (!defines || defines.length === 0) continue;

        const { sectionTitle } = locateBlock(name, chapter);
        const lean = (block as any).lean?.ref ?? null;

        for (const slug of defines) {
          entries.push({
            slug,
            chapter: chRef.dir,
            chapterTitle: chapter.title ?? chRef.dir,
            section: sectionTitle,
            block: (block as any).label ?? name,
            kind: block.kind,
            lean,
          });
        }
      } catch {
        // Skip unimportable blocks; the main validator will report them.
      }
    }
  }

  // Sort entries alphabetically by slug, then by chapter for stability.
  entries.sort((a, b) => a.slug.localeCompare(b.slug) || a.chapter.localeCompare(b.chapter));

  // Build duplicate map.
  const duplicates: Record<string, string[]> = {};
  const bySlug = new Map<string, GlossaryEntry[]>();
  for (const e of entries) {
    const list = bySlug.get(e.slug) ?? [];
    list.push(e);
    bySlug.set(e.slug, list);
  }
  for (const [slug, list] of bySlug) {
    if (list.length > 1) duplicates[slug] = list.map(e => e.block);
  }

  return {
    generated: new Date().toISOString(),
    paper: paperName,
    entries,
    duplicates,
  };
}

// ── LaTeX rendering ──────────────────────────────────────────────

/**
 * Escape body text for LaTeX. Covers the full set of fragile characters
 * (`\\ _ & % # $ { } ~ ^`) so the output is safe in any text-mode context
 * (chapter/section titles, item bodies, `\texttt{}` arguments, etc.).
 *
 * Inline math segments delimited by `$…$` are passed through verbatim
 * so that section titles like `Reeb derivation for $\mathrm{SU}(2)$`
 * render correctly.
 */
function texEscapeText(s: string): string {
  // Split on inline math; even-indexed pieces are text, odd-indexed are math.
  const parts = s.split(/(\$[^$]*\$)/g);
  // Single-pass replacement so each character is matched at most once
  // (silences the CodeQL `js/incomplete-sanitization` false positive
  // that flags chained `replace` calls even when backslash is handled
  // first).
  const map: Record<string, string> = {
    "\\": "\\textbackslash{}",
    "_": "\\_",
    "&": "\\&",
    "%": "\\%",
    "#": "\\#",
    "$": "\\$",
    "{": "\\{",
    "}": "\\}",
    "~": "\\textasciitilde{}",
    "^": "\\textasciicircum{}",
  };
  return parts
    .map((p, i) => (i % 2 === 1 ? p : p.replace(/[\\_&%#${}~^]/g, c => map[c])))
    .join("");
}

/**
 * Return a label string suitable as the first argument of `\label{}`,
 * `\hyperref[…]`, or `\ref{…}`. LaTeX label arguments are literal
 * identifiers — escaping `_` (or any other character) here would break
 * cross-references to `\label{def:foo_bar}` written elsewhere in the
 * document. The label is therefore returned verbatim.
 */
function texEscapeLabel(s: string): string {
  return s;
}

/**
 * Render the glossary as a generated LaTeX chapter.
 *
 * Layout: chapter-grouped (in paper.chapters order); within each chapter
 * the slugs are alphabetical. Duplicates render in red with a
 * "(also defined at …)" cross-reference.
 */
export function renderGlossaryTex(index: GlossaryIndex): string {
  const lines: string[] = [];
  lines.push("% Generated by content/pipeline/build-glossary.ts — do not edit by hand.");
  lines.push("\\chapter{Glossary}");
  lines.push("\\label{chap:glossary}");
  lines.push("");

  // Group by chapter, preserving declaration order.
  const byChapter = new Map<string, { title: string; entries: GlossaryEntry[] }>();
  for (const e of index.entries) {
    let bucket = byChapter.get(e.chapter);
    if (!bucket) {
      bucket = { title: e.chapterTitle, entries: [] };
      byChapter.set(e.chapter, bucket);
    }
    bucket.entries.push(e);
  }

  for (const [chap, { title, entries }] of byChapter) {
    lines.push(`\\section*{${texEscapeText(title)}}`);
    lines.push(`\\label{glossary:${texEscapeLabel(chap)}}`);
    lines.push("\\begin{description}");
    // Alphabetical within chapter.
    const sorted = [...entries].sort((a, b) => a.slug.localeCompare(b.slug));
    for (const e of sorted) {
      const isDup = (index.duplicates[e.slug] ?? []).length > 1;
      const term = `\\refterm{${texEscapeLabel(e.slug)}}`;
      const labelLink = `\\hyperref[${texEscapeLabel(e.block)}]{${texEscapeText(e.block)}}`;
      let body = `defined at ${labelLink}`;
      if (e.section) body += ` (\\S{}${texEscapeText(e.section)})`;
      if (e.lean) body += `; Lean: \\texttt{${texEscapeText(e.lean)}}`;
      if (isDup) {
        const others = (index.duplicates[e.slug] ?? []).filter(b => b !== e.block);
        const otherLinks = others
          .map(b => `\\hyperref[${texEscapeLabel(b)}]{${texEscapeText(b)}}`)
          .join(", ");
        body = `\\textcolor{red}{${body}; also defined at ${otherLinks}}`;
      }
      lines.push(`  \\item[${term}] ${body}`);
    }
    lines.push("\\end{description}");
    lines.push("");
  }

  return lines.join("\n") + "\n";
}

// ── CLI entry point ──────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const checkMode = args.includes("--check");
  const positional = args.filter(a => !a.startsWith("--"));
  const paperDir = resolve(positional[0] || "");
  if (!paperDir || !existsSync(paperDir)) {
    console.error(`Usage: build-glossary.ts <paper-dir> [--check]`);
    process.exit(2);
  }

  const index = await buildGlossary(paperDir);
  const tex = renderGlossaryTex(index);

  const jsonOutPath = join(paperDir, "glossary.json");
  // chapters/ is the conventional generated-LaTeX location at the repo root.
  const repoRoot = resolve(dirname(paperDir), "..");
  const texOutDir = join(repoRoot, "chapters");
  const texOutPath = join(texOutDir, "glossary.tex");

  if (checkMode) {
    let drift = false;
    const expected = JSON.stringify(index, null, 2) + "\n";
    if (existsSync(jsonOutPath)) {
      const onDisk = readFileSync(jsonOutPath, "utf-8");
      // Compare excluding the `generated` timestamp which changes per run.
      const stripTimestamp = (s: string) => s.replace(/"generated":\s*"[^"]*",?\s*\n?/g, "");
      if (stripTimestamp(onDisk) !== stripTimestamp(expected)) {
        console.error(`✗ glossary.json is out of date — re-run without --check.`);
        drift = true;
      }
    } else {
      console.error(`✗ glossary.json missing at ${jsonOutPath}`);
      drift = true;
    }
    if (Object.keys(index.duplicates).length > 0) {
      for (const [slug, owners] of Object.entries(index.duplicates)) {
        console.error(`✗ duplicate slug "${slug}" declared by: ${owners.join(", ")}`);
      }
      drift = true;
    }
    console.log(`Glossary entries: ${index.entries.length}, duplicates: ${Object.keys(index.duplicates).length}`);
    process.exit(drift ? 1 : 0);
  }

  writeFileSync(jsonOutPath, JSON.stringify(index, null, 2) + "\n");
  if (!existsSync(texOutDir)) mkdirSync(texOutDir, { recursive: true });
  writeFileSync(texOutPath, tex);
  console.log(`✓ Wrote ${jsonOutPath}`);
  console.log(`✓ Wrote ${texOutPath}`);
  console.log(`  ${index.entries.length} entries, ${Object.keys(index.duplicates).length} duplicates`);
}
