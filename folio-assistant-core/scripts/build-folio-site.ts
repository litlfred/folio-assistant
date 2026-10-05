#!/usr/bin/env bun
/**
 * build-folio-site — a folio as lightweight static pages that load their
 * content from the knowledge graph. Owner, 2026-10-05:
 *
 * > there should be a static page like <base_url>/cat-harness/folio/<paper>,
 * > <base_url>/cat-harness/folio/<paper>/<chapter> and
 * > <base_url>/cat-harness/folio/<paper>/<chapter>/<section> etc... these
 * > should be super light weight and use dynamic loading of KG content.
 *
 * ## Why not one page per document
 *
 * `build-document-site.ts` writes each document as one page. For qou that page
 * is 12 MB with ~83,000 equations: usable, but only after a long download, and
 * a link to one section still fetches the whole paper. Here every page is the
 * same small shell, and what it shows is fetched:
 *
 *   <route>/index.html                               the folio's documents
 *   <route>/<paper>/index.html                       the paper: chapters load as you scroll
 *   <route>/<paper>/<chapter>/index.html             the chapter: sections load as you scroll
 *   <route>/<paper>/<chapter>/<section>/…/index.html one section (subsections nest)
 *   <route>/<paper>/outline.json                     chapters, sections and blocks, in manifest order
 *   <route>/<paper>/blocks/<chapter>/<block>.json    one block's KG node, plus its rendered HTML
 *   <route>/assets/folio-site.{js,css}               the one loader every shell shares
 *
 * `<route>` defaults to `cat-harness/folio`.
 *
 * ## The block payload IS the KG node
 *
 * Every block already has a JSON-LD node beside it (`<block>.jsonld`, written
 * by `gen-block-jsonld.ts`: `@id`, `@type`, kind, label, title, `uses`). The
 * payload is that node, unchanged, with one added property, `html`: the body
 * rendered by `renderDocumentHtml`, so math, glossary directives and
 * citations behave exactly as on the document site. A block with no `.jsonld`
 * still gets a payload built from its manifest, so a folio whose graph has not
 * been generated is not a blank site.
 *
 * ## Links work from any depth, and under a staging prefix
 *
 * A shell names its own depth (`data-root`, relative), so the same tree works
 * at `/`, under `/STAGING/<branch>/` and from a local file server. Nothing
 * absolute is baked in. A cross-reference `#label` that is not on the current
 * page is resolved through the outline to the section page that holds it.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { readHarnessConfig } from "../../cat-harness/schemas/harness-config.js";
import type { Block, Chapter, Paper, Section, SectionRef } from "../../cat-harness/schemas/types.js";
import { renderBlockMarkdown } from "../../cat-harness/content/pipeline/render-markdown.js";
import { documentManifests, katexMacros, renderDocumentHtml } from "./build-document-site.js";

export const SITE_OUTLINE_SCHEMA = "folio-site-outline/v1" as const;

export interface SiteSection {
  slug: string;
  title: string;
  label?: string;
  /** Block payload paths, relative to the paper directory. */
  blocks: string[];
  sections: SiteSection[];
}
export interface SiteChapter {
  slug: string;
  title: string;
  label?: string;
  sections: SiteSection[];
}
export interface SiteOutline {
  $schema: typeof SITE_OUTLINE_SCHEMA;
  slug: string;
  title: string;
  math: boolean;
  macros: Record<string, string>;
  chapters: SiteChapter[];
  /** Block label -> its section's path below the paper (`<chapter>/<section>/…`). */
  labels: Record<string, string>;
}

const isRef = (s: Section | SectionRef): s is SectionRef => !("blocks" in s);

/** `sec:commutative-formal-group` -> `commutative-formal-group`; a title is slugified. */
export function sectionSlug(sec: { label?: string; title: string }, taken: Set<string>): string {
  const base =
    (sec.label ? sec.label.replace(/^[a-z]+:/i, "") : sec.title)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  taken.add(slug);
  return slug;
}

/** How deep below `<route>` a shell sits, as a relative prefix back to `<route>`. */
const up = (depth: number) => (depth === 0 ? "./" : "../".repeat(depth));

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** The shell every page is: a title, a scope, and the shared loader. */
export function shellHtml(title: string, depth: number, scope: { paper?: string; path?: string }): string {
  const root = up(depth);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${root}assets/folio-site.css">
<script defer src="${root}assets/folio-site.js"></script>
</head>
<body data-root="${root}" data-paper="${esc(scope.paper ?? "")}" data-path="${esc(scope.path ?? "")}">
<nav id="toc" aria-label="Contents"></nav>
<main><p class="crumbs" id="crumbs"></p><h1>${esc(title)}</h1><div id="content"><p class="muted">Loading…</p></div></main>
</body>
</html>
`;
}

export interface FolioSiteResult {
  papers: { slug: string; blocks: number; pages: number }[];
  errors: string[];
}

export async function buildFolioSite(
  repoRoot: string,
  outDir: string,
  opts: { route?: string; math?: boolean } = {},
): Promise<FolioSiteResult> {
  const route = (opts.route ?? "cat-harness/folio").replace(/^\/+|\/+$/g, "");
  const base = join(outDir, route);
  const math = opts.math ?? readHarnessConfig(repoRoot)?.contentType === "paper";
  const result: FolioSiteResult = { papers: [], errors: [] };
  const docs = documentManifests(repoRoot);
  if (docs.length === 0) {
    result.errors.push(`no document manifest under ${repoRoot} (expected folio/<slug>/<slug>.ts)`);
    return result;
  }
  mkdirSync(join(base, "assets"), { recursive: true });
  cpSync(join(import.meta.dir, "folio-site-assets"), join(base, "assets"), { recursive: true });

  const papers: { slug: string; title: string }[] = [];
  for (const d of docs) {
    const paper = (await import(d.path)).default as Paper;
    const docDir = dirname(d.path);
    const paperOut = join(base, d.slug);
    const outline: SiteOutline = {
      $schema: SITE_OUTLINE_SCHEMA,
      slug: d.slug,
      title: paper.title ?? d.slug,
      math,
      macros: math ? katexMacros(paper.macros) : {},
      chapters: [],
      labels: {},
    };
    let blockCount = 0;
    let pages = 1;
    const writeShell = (path: string, title: string) => {
      const depth = path ? path.split("/").length + 1 : 1;
      const dir = join(paperOut, path);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "index.html"), shellHtml(title, depth, { paper: d.slug, path }));
      pages++;
    };

    for (const chRef of paper.chapters) {
      const chDir = join(docDir, chRef.dir);
      const chPath = join(chDir, `${chRef.dir}.ts`);
      if (!existsSync(chPath)) {
        result.errors.push(`${d.slug}: chapter manifest not found: ${relative(repoRoot, chPath)}`);
        continue;
      }
      const chapter = (await import(chPath)).default as Chapter;
      const ch: SiteChapter = { slug: chRef.dir, title: chapter.title, ...(chapter.label ? { label: chapter.label } : {}), sections: [] };
      if (chapter.label) outline.labels[chapter.label] = chRef.dir;

      const walk = async (secs: Array<Section | SectionRef>, parentPath: string, taken: Set<string>): Promise<SiteSection[]> => {
        const out: SiteSection[] = [];
        for (const sec of secs) {
          if (isRef(sec)) continue;
          const slug = sectionSlug(sec, taken);
          const path = `${parentPath}/${slug}`;
          const s: SiteSection = { slug, title: sec.title, ...(sec.label ? { label: sec.label } : {}), blocks: [], sections: [] };
          if (sec.label) outline.labels[sec.label] = path;
          for (const root of sec.blocks) {
            const ts = join(chDir, `${root}.ts`);
            if (!existsSync(ts)) {
              result.errors.push(`${d.slug}: block manifest not found: ${relative(repoRoot, ts)}`);
              continue;
            }
            const block = (await import(ts)).default as Block;
            const mdPath = join(chDir, `${root}.md`);
            const mdContent = existsSync(mdPath) ? readFileSync(mdPath, "utf-8") : "";
            const html = await renderDocumentHtml(renderBlockMarkdown({ block, mdContent }), { math });
            const jsonld = join(chDir, `${root}.jsonld`);
            const node: Record<string, unknown> = existsSync(jsonld)
              ? JSON.parse(readFileSync(jsonld, "utf-8"))
              : { kind: block.kind, ...("label" in block && block.label ? { label: block.label } : {}), ...("title" in block && block.title ? { title: block.title } : {}) };
            node.html = html;
            const rel = `blocks/${chRef.dir}/${root}.json`;
            mkdirSync(join(paperOut, "blocks", chRef.dir), { recursive: true });
            writeFileSync(join(paperOut, rel), JSON.stringify(node) + "\n");
            s.blocks.push(rel);
            blockCount++;
            if ("label" in block && typeof block.label === "string") outline.labels[block.label] = path;
          }
          if (sec.subsections) s.sections = await walk(sec.subsections, path, new Set());
          writeShell(path, sec.title);
          out.push(s);
        }
        return out;
      };
      ch.sections = await walk(chapter.sections, chRef.dir, new Set());
      writeShell(chRef.dir, chapter.title);
      outline.chapters.push(ch);
    }
    mkdirSync(paperOut, { recursive: true });
    writeFileSync(join(paperOut, "outline.json"), JSON.stringify(outline) + "\n");
    writeFileSync(join(paperOut, "index.html"), shellHtml(outline.title, 1, { paper: d.slug, path: "" }));
    papers.push({ slug: d.slug, title: outline.title });
    result.papers.push({ slug: d.slug, blocks: blockCount, pages });
  }
  writeFileSync(join(base, "papers.json"), JSON.stringify({ papers }) + "\n");
  writeFileSync(join(base, "index.html"), shellHtml("Folio", 0, {}));
  return result;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (n: string) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  if (args.includes("--help")) {
    console.log(
      "usage: bun run folio-assistant-core/scripts/build-folio-site.ts [--repo <folio root>] [--out _site] [--route cat-harness/folio] [--math | --no-math]",
    );
    process.exit(0);
  }
  const repo = resolve(opt("repo") ?? process.cwd());
  const out = resolve(repo, opt("out") ?? "_site");
  const math = args.includes("--math") ? true : args.includes("--no-math") ? false : undefined;
  const r = await buildFolioSite(repo, out, { route: opt("route"), math });
  for (const p of r.papers) console.error(`  ${p.slug}: ${p.blocks} block(s), ${p.pages} page(s)`);
  if (r.errors.length > 0) {
    for (const e of r.errors) console.error(`✗ ${e}`);
    process.exit(1);
  }
  console.error(`✓ ${r.papers.length} paper(s) → ${relative(repo, out) || "."}`);
}
