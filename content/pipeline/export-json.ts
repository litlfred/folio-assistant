#!/usr/bin/env bun
/**
 * Export content tree to static JSON for the SPA viewer.
 *
 * Walks the paper manifest, resolves all chapters/sections/blocks,
 * reads .md and .lean files, and writes a single paper.json.
 *
 * Usage:
 *   bun run content/pipeline/export-json.ts
 *   bun run content/pipeline/export-json.ts --paper quantum-observable-universe
 *   bun run content/pipeline/export-json.ts --out build/viewer
 *
 * Output:
 *   <out>/paper.json — full paper tree with all content inlined
 *
 * @module content/pipeline/export-json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { createHash } from "crypto";
import type {
  Paper,
  Chapter,
  Section,
  Block,
  RenderedAsset,
  LeanRef,
} from "../../schemas/types";
import type { Data as CSLData } from "csl-json";
import { references, referenceMap } from "../../schemas/references";
import { mergeCitations } from "./citations";
import { isWitnessed, leanFileHash } from "../../scripts/lean-witness";
import { leanPackageByName, parseLeanRef } from "../../folio-assistant/schemas/lean-packages";

const REPO_ROOT = resolve(import.meta.dir, "../..");
const CONTENT_ROOT = join(REPO_ROOT, "content");

const args = process.argv.slice(2);
function argVal(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}

const PAPER_NAME = argVal("paper", "quantum-observable-universe");
const OUT_DIR = argVal("out", join(REPO_ROOT, "build", "viewer"));
const PAPER_DIR = join(CONTENT_ROOT, PAPER_NAME);

// ── Types for export ─────────────────────────────────────────────

interface ExportedBlock {
  rootName: string;
  kind: string;
  label?: string;
  title?: string;
  uses?: string[];
  /** Resolved citation keys (explicit + auto-extracted from .md). */
  cites?: string[];
  lean?: LeanRef & { source?: string };
  proofs?: string[];
  examples?: string[];
  tex?: string;
  caption?: string;
  rendered?: RenderedAsset[];
  md: string;
  mdModified: string;
  meta?: Record<string, unknown>;
  /** Simulator-specific fields */
  html?: string;
  defaultView?: { name: string; title?: string; params?: Record<string, unknown> };
  views?: Array<{ name: string; title?: string; params?: Record<string, unknown> }>;
  /** Remark interprets link */
  interprets?: string;
}

interface ExportedSection {
  title: string;
  label?: string;
  blocks: ExportedBlock[];
}

interface ExportedChapter {
  number?: number;
  tabLabel?: string;
  title: string;
  label?: string;
  sections: ExportedSection[];
  /** Aggregated bibliography: CSL-JSON entries cited by any block in this chapter. */
  bibliography?: CSLData[];
}

interface ExportedPaper {
  title: string;
  authors: string[];
  date?: string;
  chapters: ExportedChapter[];
  /** Full bibliography database (CSL-JSON) for cross-linking. */
  references?: CSLData[];
  /** Custom LaTeX macros (name → {tex, unicode}) for KaTeX rendering. */
  macros?: Record<string, { tex: string; unicode?: string }>;
  meta?: Record<string, unknown>;
  _hash: string;
  _built: string;
}

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Resolve the Lake package root for a block's `lean.ref`.  Returns the
 * absolute path to e.g. `content/quantum-observable-universe/lean/`.
 */
function leanPackageRoot(leanRef: LeanRef | undefined): string | undefined {
  if (!leanRef?.ref) return undefined;
  try {
    const parsed = parseLeanRef(leanRef.ref);
    const pkg = leanPackageByName(parsed.package);
    return pkg ? join(REPO_ROOT, pkg.lakeRoot) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolve the absolute path of the `.lean` file backing a block.
 *
 * Candidates, in order:
 *   1. Co-located sibling (`<chapter>/<block>.lean`).
 *   2. Package-qualified path under the Lake root, walking the decl
 *      from longest to shortest prefix
 *      (`qou:QOU.Foo.Bar` → `<lakeRoot>/QOU/Foo/Bar.lean`,
 *       then `<lakeRoot>/QOU/Foo.lean`).
 *
 * Used by both `readLeanSource` (returns the file content) and the
 * witness-hash step (needs the resolved path even when no sibling
 * file is present).  Returns the first candidate that exists, or
 * `undefined` if nothing resolves.
 */
function resolveLeanFilePath(
  leanRef: LeanRef | undefined,
  colocatedLeanPath?: string,
): string | undefined {
  if (!leanRef) return undefined;

  if (colocatedLeanPath && existsSync(colocatedLeanPath)) {
    return colocatedLeanPath;
  }

  const pkgRoot = leanPackageRoot(leanRef);
  if (!pkgRoot || !leanRef.ref) return undefined;
  let parsed;
  try {
    parsed = parseLeanRef(leanRef.ref);
  } catch {
    return undefined;
  }
  const parts = parsed.decl.split(".");
  for (let i = parts.length; i >= 2; i--) {
    const candidate = join(pkgRoot, parts.slice(0, i).join("/") + ".lean");
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

function readLeanSource(leanRef: LeanRef | undefined, colocatedLeanPath?: string): string | undefined {
  const path = resolveLeanFilePath(leanRef, colocatedLeanPath);
  return path ? readFileSync(path, "utf-8") : undefined;
}

function readRenderedAssets(
  rendered: RenderedAsset[] | undefined,
  blockDir: string,
  outDir: string,
): RenderedAsset[] | undefined {
  if (!rendered || rendered.length === 0) return undefined;

  return rendered.map((asset) => {
    const srcPath = join(blockDir, asset.url);
    if (existsSync(srcPath)) {
      // Copy SVG/PNG to output dir and adjust URL
      const outPath = join(outDir, "assets", asset.url);
      const outAssetDir = join(outPath, "..");
      mkdirSync(outAssetDir, { recursive: true });
      writeFileSync(outPath, readFileSync(srcPath));
      return { ...asset, url: `assets/${asset.url}` };
    }
    return asset;
  });
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log(`Exporting: ${PAPER_NAME}`);

  const paperPath = join(PAPER_DIR, `${PAPER_NAME}.ts`);
  const paper: Paper = (await import(paperPath)).default;

  const chapters: ExportedChapter[] = [];

  for (const chRef of paper.chapters) {
    const chDir = join(PAPER_DIR, chRef.dir);
    const chPath = join(chDir, `${chRef.dir}.ts`);
    const ch: Chapter = (await import(chPath)).default;

    const sections: ExportedSection[] = [];

    for (const sec of ch.sections) {
      if ("name" in sec && !("blocks" in sec)) continue;
      const section = sec as Section;
      const blocks: ExportedBlock[] = [];

      for (const rootName of section.blocks) {
        const tsPath = join(chDir, `${rootName}.ts`);
        const mdPath = join(chDir, `${rootName}.md`);

        try {
          const block: Block = (await import(tsPath)).default;
          const md = existsSync(mdPath) ? readFileSync(mdPath, "utf-8") : "";
          const mdStat = existsSync(mdPath) ? statSync(mdPath) : null;
          const leanRef = "lean" in block ? (block.lean as LeanRef | undefined) : undefined;
          const colocatedLean = join(chDir, `${rootName}.lean`);
          const leanSource = readLeanSource(leanRef, colocatedLean);

          // Compute lean hash and check witness cache
          let leanHash: string | undefined;
          let witnessed: boolean | undefined;
          if (leanRef) {
            // Witness keys off whichever `.lean` file actually backs
            // this block — sibling first, then the package-resolved
            // candidate.  `resolveLeanFilePath` walks the same order
            // as `readLeanSource`, so witness metadata is consistent
            // with the source we actually emit downstream.
            const leanFilePath = resolveLeanFilePath(leanRef, colocatedLean);
            if (leanFilePath) {
              const result = isWitnessed(leanFilePath);
              leanHash = result.hash;
              witnessed = result.witnessed;
            }
          }
          const rendered = "rendered" in block
            ? readRenderedAssets(block.rendered as RenderedAsset[] | undefined, chDir, OUT_DIR)
            : undefined;

          // Merge explicit cites[] with auto-extracted from .md
          const explicitCites = "cites" in block ? (block as any).cites as string[] | undefined : undefined;
          const cites = mergeCitations(explicitCites, md);

          blocks.push({
            rootName,
            kind: block.kind,
            label: "label" in block ? block.label : undefined,
            title: "title" in block ? block.title : undefined,
            uses: "uses" in block ? block.uses : undefined,
            cites: cites.length > 0 ? cites : undefined,
            lean: leanRef ? { ...leanRef, source: leanSource, leanHash, witnessed } : undefined,
            proofs: "proofs" in block ? block.proofs : undefined,
            examples: "examples" in block ? block.examples : undefined,
            tex: "tex" in block ? block.tex : undefined,
            caption: "caption" in block ? block.caption : undefined,
            rendered,
            md,
            mdModified: mdStat ? mdStat.mtime.toISOString() : "",
            meta: "meta" in block ? block.meta : undefined,
            html: "html" in block ? (block as any).html : undefined,
            defaultView: "defaultView" in block ? (block as any).defaultView : undefined,
            views: "views" in block ? (block as any).views : undefined,
            interprets: "interprets" in block ? (block as any).interprets : undefined,
          });
        } catch (e) {
          blocks.push({
            rootName,
            kind: "error",
            md: `Failed to load: ${e instanceof Error ? e.message : String(e)}`,
            mdModified: "",
          });
        }
      }

      sections.push({ title: section.title, label: section.label, blocks });
    }

    // Aggregate chapter-level bibliography from all blocks
    const chapterCiteKeys = new Set<string>();
    for (const sec of sections) {
      for (const b of sec.blocks) {
        if (b.cites) for (const key of b.cites) chapterCiteKeys.add(key);
      }
    }
    const bibliography = [...chapterCiteKeys]
      .sort()
      .map(key => referenceMap.get(key))
      .filter((r): r is CSLData => r !== undefined);

    chapters.push({
      number: ch.number,
      tabLabel: ch.tabLabel,
      title: ch.title,
      label: ch.label,
      sections,
      bibliography: bibliography.length > 0 ? bibliography : undefined,
    });
  }

  const result: Omit<ExportedPaper, "_hash"> = {
    title: paper.title,
    authors: paper.authors,
    date: paper.date,
    chapters,
    references,
    macros: (paper as any).macros,
    meta: paper.meta,
    _built: new Date().toISOString(),
  };

  const hash = createHash("sha256")
    .update(JSON.stringify(result))
    .digest("hex")
    .slice(0, 12);

  const exported: ExportedPaper = { ...result, _hash: hash };

  const json = JSON.stringify(exported, null, 2);

  // Write to build dir
  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, "paper.json");
  writeFileSync(outPath, json);
  console.log(`  → ${outPath} (${(json.length / 1024).toFixed(1)} KB)`);

  // Also write paper.js into viewer/ for file:// access (no fetch needed)
  const viewerDir = join(REPO_ROOT, "viewer");
  if (existsSync(viewerDir)) {
    const jsPath = join(viewerDir, "paper.js");
    writeFileSync(jsPath, `// Auto-generated by export-json.ts — do not edit\nwindow.__PAPER_DATA__ = ${json};\n`);
    console.log(`  → ${jsPath} (file:// compatible)`);
  }
}

main();
