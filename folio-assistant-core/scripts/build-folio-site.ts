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
import { createHash } from "node:crypto";
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { readHarnessConfig } from "../../cat-harness/schemas/harness-config.js";
import type { Block, Chapter, Paper, Section, SectionRef } from "../../cat-harness/schemas/types.js";
import { kindHeading } from "../../cat-harness/schemas/translation.js";
import { resolveLiquidValues } from "../../cat-harness/content/pipeline/liquid-values.js";
import { documentManifests, katexMacros, renderDocumentHtml } from "./build-document-site.js";
import { addToReport, emptyReport, imageExistsUnder, qaBlockHtml, type SiteQaReport } from "./folio-site-qa.js";

export const SITE_OUTLINE_SCHEMA = "folio-site-outline/v1" as const;

export interface SiteSection {
  slug: string;
  /** `2.3`, `2.3.1`: the section's number, as a paper prints it. */
  number: string;
  title: string;
  label?: string;
  /** Block payload paths, relative to the paper directory. */
  blocks: string[];
  sections: SiteSection[];
}
export interface SiteChapter {
  slug: string;
  number: string;
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
  /** Label -> its printed number (`Proposition 2.3.1` prints `2.3.1`), for `\ref` link text. */
  numbers: Record<string, string>;
  /** Where the sources live, for each block's edit / feedback / Lean links. Absent when undeclared. */
  source?: { repository: string; ref: string };
}

const isRef = (s: Section | SectionRef): s is SectionRef => !("blocks" in s);

/** The kinds a paper numbers (amsthm's theorem-like environments). Proofs, prose, equations and figures are not. */
const NUMBERED_KINDS = new Set(["definition", "theorem", "lemma", "proposition", "corollary", "conjecture", "example", "remark", "algorithm"]);

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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<link rel="stylesheet" href="${root}assets/folio-site.css">
<script defer src="${root}assets/folio-site.js"></script>
</head>
<body data-root="${root}" data-paper="${esc(scope.paper ?? "")}" data-path="${esc(scope.path ?? "")}">
<div class="folio-page"><nav id="toc" aria-label="Contents"></nav>
<main><p class="crumbs" id="crumbs"></p><h1>${esc(title)}</h1><div id="content"><p class="muted">Loading…</p></div></main></div>
</body>
</html>
`;
}


/**
 * A block's fenced ```tex blocks, made readable. The paper pipeline has no
 * HTML for raw TeX environments, so on the site they were code listings.
 *
 * 1. A PRE-RENDERED SVG, when the block manifest's `rendered[]` lists one whose
 *    `hash` equals this fence's — sha256 of the trimmed source, first 12 hex,
 *    exactly as `render-tex-blocks.ts` computes it. Matched by HASH, never by
 *    position: a manifest can list an asset for a fence that has since changed
 *    or gone, and showing it would show the wrong picture.
 * 2. Display MATH, when the fence is an environment KaTeX renders (anything but
 *    `tikzcd` / `tikzpicture` / `tabular`), with `equation` unwrapped and
 *    `\label` dropped. Only when math is on.
 * 3. Otherwise a labelled placeholder with the source behind a disclosure, as
 *    the viewer does.
 *
 * An SVG is emitted as `<img data-src="rendered/<chapter>/<file>">`, a path
 * below the paper, and the loader resolves it against the paper's base: the
 * same block is shown on pages at different depths.
 */
export function texFences(
  md: string,
  opts: { math: boolean; rendered: Array<{ hash?: string; url: string; mime?: string }>; asset: (url: string) => string | undefined },
): string {
  return md.replace(/^([ \t]*)```tex[^\n]*\n([\s\S]*?)^[ \t]*```[ \t]*$/gm, (_m, indent: string, body: string) => {
    const source = body.trim();
    const hash = createHash("sha256").update(source).digest("hex").slice(0, 12);
    const hit = opts.rendered.find((r) => r.hash === hash && (r.mime ?? "image/svg+xml").startsWith("image/"));
    const src = hit ? opts.asset(hit.url) : undefined;
    const escSrc = source.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
    if (src) return `${indent}<figure class="tex-svg"><img data-src="${src}" alt="${escSrc}" loading="lazy"></figure>`;
    const diagram = /\\begin\{(tikzcd|tikzpicture|tabular)\}/.exec(source);
    if (opts.math && !diagram) {
      const inner = source
        .replace(/\\label\{[^}]*\}/g, "")
        .replace(/\\begin\{equation\*?\}|\\end\{equation\*?\}/g, "")
        .replace(/^\\\[|\\\]$/g, "")
        .trim();
      return `${indent}$$\n${inner}\n$$`;
    }
    const label = diagram?.[1] === "tabular" ? "Table" : "Diagram";
    return `${indent}<div class="tex-ph"><strong>[${label}]</strong><details><summary>LaTeX source</summary><pre>${escSrc}</pre></details></div>`;
  });
}


/** The brace-balanced group starting at `s[i] === "{"`; returns its body and the index after it. */
function group(s: string, i: number): [string, number] | undefined {
  if (s[i] !== "{") return undefined;
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === "\\") { j++; continue; }
    if (s[j] === "{") depth++;
    else if (s[j] === "}" && --depth === 0) return [s.slice(i + 1, j), j + 1];
  }
  return undefined;
}

/**
 * KaTeX macros from a paper's own LaTeX preamble (`folio/<paper>/latex/*.tex`):
 * `\newcommand` / `\renewcommand` / `\providecommand` (with or without an
 * argument count) and `\DeclareMathOperator`. qou defines `\pp` there and
 * deliberately NOT in the manifest's `macros`, so without this 46 equations
 * reached the reader as "undefined control sequence". The manifest wins on a
 * name both define. A definition this cannot parse is skipped, not guessed.
 */
export function preambleMacros(paperDir: string): Record<string, string> {
  const dir = join(paperDir, "latex");
  const out: Record<string, string> = {};
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".tex")).sort()) {
    const src = readFileSync(join(dir, f), "utf-8").replace(/(^|[^\\])%.*$/gm, "$1");
    const re = /\\(newcommand|renewcommand|providecommand|DeclareMathOperator)\*?\s*\{?\s*(\\[A-Za-z]+)\s*\}?/g;
    for (let m = re.exec(src); m; m = re.exec(src)) {
      let i = re.lastIndex;
      while (src[i] === " ") i++;
      if (src[i] === "[") i = src.indexOf("]", i) + 1; // argument count: KaTeX infers #1… from the body
      while (src[i] === " ") i++;
      if (src[i] === "[") break; // an optional-argument default: not representable, skip the rest safely
      const g = group(src, i);
      if (!g) continue;
      out[m[2]!] = m[1] === "DeclareMathOperator" ? `\\operatorname{${g[0]}}` : g[0];
      re.lastIndex = g[1];
    }
  }
  return out;
}

/**
 * The instance's declared repository (`<name>.json` → `repository`,
 * `owner/repo`), for the edit and feedback links. The declaration is the
 * file whose stem equals its own `name`, the rule `findDeclarationFile`
 * applies. Absent when there is none: then the links are not drawn, rather
 * than drawn at a guessed URL.
 */
export function declaredRepository(repoRoot: string): { repository: string; ref: string } | undefined {
  for (const f of readdirSync(repoRoot).filter((n) => n.endsWith(".json") && !n.endsWith(".config.json"))) {
    try {
      const d = JSON.parse(readFileSync(join(repoRoot, f), "utf-8")) as { name?: string; repository?: string };
      if (d.name && `${d.name}.json` === f && typeof d.repository === "string" && /^[\w.-]+\/[\w.-]+$/.test(d.repository)) {
        return { repository: d.repository, ref: "main" };
      }
    } catch {
      /* not a declaration */
    }
  }
  return undefined;
}

export interface FolioSiteResult {
  papers: { slug: string; blocks: number; pages: number; qa: SiteQaReport }[];
  errors: string[];
}

export async function buildFolioSite(
  repoRoot: string,
  outDir: string,
  opts: { route?: string; math?: boolean; repository?: string; ref?: string } = {},
): Promise<FolioSiteResult> {
  // declared-path-literal: this is the published URL ROUTE the owner named
  // (2026-10-05: "<base_url>/cat-harness/folio/<paper>/<chapter>/<section>"),
  // under the OUTPUT directory — not cat-harness's declared `folio/` graph, and
  // nothing is read from that directory. Resolving the declaration here would
  // tie a URL to wherever an instance keeps its sources. `--route` overrides it.
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
  const sourceRepo = opts.repository ? { repository: opts.repository, ref: opts.ref ?? "main" } : declaredRepository(repoRoot);
  for (const d of docs) {
    const paper = (await import(d.path)).default as Paper;
    const docDir = dirname(d.path);
    const paperOut = join(base, d.slug);
    const outline: SiteOutline = {
      $schema: SITE_OUTLINE_SCHEMA,
      slug: d.slug,
      title: paper.title ?? d.slug,
      math,
      macros: math ? { ...preambleMacros(docDir), ...katexMacros(paper.macros) } : {},
      chapters: [],
      labels: {},
      numbers: {},
      ...(sourceRepo ? { source: sourceRepo } : {}),
    };
    let blockCount = 0;
    const qa = emptyReport();
    let pages = 1;
    const writeShell = (path: string, title: string) => {
      const depth = path ? path.split("/").length + 1 : 1;
      const dir = join(paperOut, path);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "index.html"), shellHtml(title, depth, { paper: d.slug, path }));
      pages++;
    };

    let chIndex = 0;
    for (const chRef of paper.chapters) {
      const chDir = join(docDir, chRef.dir);
      const chPath = join(chDir, `${chRef.dir}.ts`);
      if (!existsSync(chPath)) {
        result.errors.push(`${d.slug}: chapter manifest not found: ${relative(repoRoot, chPath)}`);
        continue;
      }
      const chapter = (await import(chPath)).default as Chapter;
      const chNum = String(++chIndex);
      const ch: SiteChapter = { slug: chRef.dir, number: chNum, title: chapter.title, ...(chapter.label ? { label: chapter.label } : {}), sections: [] };
      if (chapter.label) {
        outline.labels[chapter.label] = chRef.dir;
        outline.numbers[chapter.label] = chNum;
      }

      // amsthm numbering: theorem-like blocks share ONE counter per top-level
      // section, so a statement prints as `Proposition <chapter>.<section>.<n>`;
      // a subsection's blocks continue its section's counter.
      const walk = async (
        secs: Array<Section | SectionRef>,
        parentPath: string,
        taken: Set<string>,
        parentNum: string,
        counter: { section: string; n: number } | null,
      ): Promise<SiteSection[]> => {
        const out: SiteSection[] = [];
        let secIndex = 0;
        for (const sec of secs) {
          if (isRef(sec)) continue;
          const slug = sectionSlug(sec, taken);
          const path = `${parentPath}/${slug}`;
          const number = `${parentNum}.${++secIndex}`;
          const count = counter ?? { section: number, n: 0 };
          const s: SiteSection = { slug, number, title: sec.title, ...(sec.label ? { label: sec.label } : {}), blocks: [], sections: [] };
          if (sec.label) {
            outline.labels[sec.label] = path;
            outline.numbers[sec.label] = number;
          }
          for (const root of sec.blocks) {
            const ts = join(chDir, `${root}.ts`);
            if (!existsSync(ts)) {
              result.errors.push(`${d.slug}: block manifest not found: ${relative(repoRoot, ts)}`);
              continue;
            }
            const block = (await import(ts)).default as Block;
            const mdPath = join(chDir, `${root}.md`);
            const mdContent = existsSync(mdPath) ? readFileSync(mdPath, "utf-8") : "";
            const rendered = (block as { rendered?: Array<{ hash?: string; url: string; mime?: string }> }).rendered ?? [];
            const body = texFences(mdContent, {
              math,
              rendered,
              asset: (url) => {
                const from = join(chDir, url);
                if (!existsSync(from)) return undefined;
                const rel = `rendered/${chRef.dir}/${url.replace(/^rendered\//, "")}`;
                mkdirSync(dirname(join(paperOut, rel)), { recursive: true });
                copyFileSync(from, join(paperOut, rel));
                return rel;
              },
            });
            // The heading (kind, number, title) is the loader's to typeset; the payload carries it as data.
            const label = "label" in block && typeof block.label === "string" ? block.label : undefined;
            const anchor = label ? `<a id="${esc(label)}"></a>` : "";
            const html = anchor + (await renderDocumentHtml(resolveLiquidValues(body).trim(), { math })); // witnessed values, as render-markdown.ts resolves them
            const jsonld = join(chDir, `${root}.jsonld`);
            const node: Record<string, unknown> = existsSync(jsonld)
              ? JSON.parse(readFileSync(jsonld, "utf-8"))
              : { kind: block.kind, ...("label" in block && block.label ? { label: block.label } : {}), ...("title" in block && block.title ? { title: block.title } : {}) };
            node.html = html;
            node.kind = block.kind;
            // Repo-relative paths, so the loader can link the edit page and the Lean sibling.
            node.source = relative(repoRoot, mdPath);
            const leanSibling = join(chDir, `${root}.lean`);
            if (existsSync(leanSibling)) node.leanSource = relative(repoRoot, leanSibling);
            node.heading = block.kind === "prose" ? "" : kindHeading(block.kind, "en");
            if ("title" in block && typeof block.title === "string") node.title = block.title;
            if (NUMBERED_KINDS.has(block.kind)) {
              node.number = `${count.section}.${++count.n}`;
              if (label) outline.numbers[label] = node.number as string;
            }
            const q = await qaBlockHtml(`${chRef.dir}/${root}`, html, { math, macros: outline.macros, imageExists: imageExistsUnder(paperOut) });
            addToReport(qa, q.findings, q.katexUnknown);
            const rel = `blocks/${chRef.dir}/${root}.json`;
            mkdirSync(join(paperOut, "blocks", chRef.dir), { recursive: true });
            writeFileSync(join(paperOut, rel), JSON.stringify(node) + "\n");
            s.blocks.push(rel);
            blockCount++;
            if ("label" in block && typeof block.label === "string") outline.labels[block.label] = path;
          }
          if (sec.subsections) s.sections = await walk(sec.subsections, path, new Set(), number, count);
          writeShell(path, sec.title);
          out.push(s);
        }
        return out;
      };
      ch.sections = await walk(chapter.sections, chRef.dir, new Set(), chNum, null);
      writeShell(chRef.dir, chapter.title);
      outline.chapters.push(ch);
    }
    mkdirSync(paperOut, { recursive: true });
    writeFileSync(join(paperOut, "outline.json"), JSON.stringify(outline) + "\n");
    // The rendered-content QA, beside the site it judges (folio-site-qa.ts).
    writeFileSync(join(paperOut, "qa.json"), JSON.stringify(qa, null, 1) + "\n");
    writeFileSync(join(paperOut, "index.html"), shellHtml(outline.title, 1, { paper: d.slug, path: "" }));
    papers.push({ slug: d.slug, title: outline.title });
    result.papers.push({ slug: d.slug, blocks: blockCount, pages, qa });
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
      "usage: bun run folio-assistant-core/scripts/build-folio-site.ts [--repo <folio root>] [--out _site] [--route cat-harness/folio] [--math | --no-math] [--strict] [--source-repo owner/repo] [--source-ref main]",
    );
    process.exit(0);
  }
  const repo = resolve(opt("repo") ?? process.cwd());
  const out = resolve(repo, opt("out") ?? "_site");
  const math = args.includes("--math") ? true : args.includes("--no-math") ? false : undefined;
  const r = await buildFolioSite(repo, out, { route: opt("route"), math, repository: opt("source-repo"), ref: opt("source-ref") });
  let qaTotal = 0;
  for (const p of r.papers) {
    const c = p.qa.counts;
    qaTotal += p.qa.findings.length;
    console.error(
      `  ${p.slug}: ${p.blocks} block(s), ${p.pages} page(s); rendered QA: raw-tex ${c["raw-tex"]}, raw-directive ${c["raw-directive"]}, ` +
        `stray-dollar ${c["stray-dollar"]}, katex ${c.katex}, missing-image ${c["missing-image"]}` +
        (p.qa.unknown.length ? `; UNKNOWN: ${p.qa.unknown.join(", ")}` : ""),
    );
  }
  if (args.includes("--strict") && (qaTotal > 0 || r.papers.some((p) => p.qa.unknown.length))) {
    console.error(`✗ rendered QA: ${qaTotal} finding(s) (--strict); see <route>/<paper>/qa.json`);
    process.exit(1);
  }
  if (r.errors.length > 0) {
    for (const e of r.errors) console.error(`✗ ${e}`);
    process.exit(1);
  }
  console.error(`✓ ${r.papers.length} paper(s) → ${relative(repo, out) || "."}`);
}
