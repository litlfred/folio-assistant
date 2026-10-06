#!/usr/bin/env bun
/**
 * The DOCUMENT folio's answer to the rendered-impact contract
 * (`cat-harness/schemas/rendered-impact.ts`, bean `bnjs`, issue #971): from a
 * Change Set, the rendered files of the folio's site it alters.
 *
 * ## Loaded from the graph and the published assets, never from source
 *
 * Owner, 2026-10-06: *"use dynamic loading from the json(ld) KG and existing
 * assets"*. So nothing here imports a manifest, pattern-matches TypeScript or
 * walks the folio tree. It reads two JSON documents the staging build already
 * publishes beside the preview:
 *
 * | asset | written by | gives |
 * |---|---|---|
 * | `changeset.json` (`folio-changeset/v1`) | `changeset.ts`, the ChangeSet Tool | every changed block: its LABEL and its manifest FILE on each side |
 * | `outline.json` (`folio-outline/v1`) | `build-document-site.ts` | the documents, by slug, and their blocks' labels |
 *
 * A block's rendered cone is its own document's page, anchored at its label:
 * a document page assembles its blocks and no block renders inside another
 * document. The editorial `uses[]` relation is a link, not a rendering edge,
 * so it is not followed. The slug is the first segment of the block's file,
 * which is how `build-document-site` names the page.
 *
 * When no published `changeset.json` is given, the ChangeSet is computed by
 * the same Tool that publishes it (`computeChangeSet`), so the answer is the
 * one a reviewer would see, not a second derivation.
 *
 * ## The two renderers of a document site
 *
 * | renderer | writes | reached by |
 * |---|---|---|
 * | `document-site` | `<slug>/index.html`, `<slug>/media/*`, `outline.json`, `index.html` | a changed block, a document/chapter/section manifest, a media file |
 * | `public-comment-site` | `public-comments/index.html` and the comment notes on each `<slug>/index.html` | the public-comment store |
 *
 * Every file is pinned (`hash`) to the blobs of the changed inputs that
 * reach it, at head, so a page verdict counts only for the version reviewed.
 *
 * ## What it cannot place, and says so
 *
 * A changed file that is neither a block the ChangeSet names, a media file,
 * a manifest under a known document, nor the comment store can change any
 * page: `undetermined`, `scope: all`, never "no change".
 *
 * ## …and what it can say reaches nothing
 *
 * Except a file the site's builders cannot read (bean `ehh6`). On the first
 * real run (smart-ra#26) the work-plan bean the branch carried was reported
 * "may change any page", and an undetermined input holds the coverage gate
 * shut, so every PR that touches a bean would wait on a false alarm. A
 * document site is built from the graphs its instance DECLARES, the platform
 * (a submodule), and the build's own definition (`.github/`, the root's
 * declaration, config and lockfiles). A file outside all of those — an
 * undeclared directory such as `beans/`, or a Markdown note at the root — is
 * an input that reaches no page ({@link siteMayRead}). With no declaration to
 * read, nothing is excluded: doubt carries. The claim is checked, not
 * trusted: the staging build's diff counts any page it changed that the list
 * did not name.
 *
 * Usage:
 *   bun run folio-assistant-core/scripts/document-rendered-impact.ts --root <folio repo>
 *     (--changed a,b | --base <ref> [--head <ref>]) [--changeset changeset.json]
 *     [--outline outline.json] [--site <prefix>] [--out impact.json]
 *
 * @module folio-assistant-core/scripts/document-rendered-impact
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  pinImpact,
  RENDERED_IMPACT_TAG,
  RenderedImpactSchema,
  type RenderedFile,
  type RenderedImpact,
} from "../../cat-harness/schemas/rendered-impact.js";
import { declarationPathIn } from "../../cat-harness/schemas/cat-harness.js";
import { gitBlobs } from "../../cat-harness/scripts/git-blobs.js";
import { ChangeSetSchema, computeChangeSet, type ChangeSet } from "../schemas/changeset.js";

export const DOCUMENT_RENDERER = "document-site";
export const PUBLIC_COMMENT_RENDERER = "public-comment-site";

/** Where the public-comment store lives, relative to the repository root. */
const COMMENT_STORE = /^review\/public-comment\//;

/** The part of `outline.json` this reads: the documents, by slug. */
export interface OutlineLike {
  documents: Array<{ slug: string }>;
}

interface Acc {
  files: Map<string, RenderedFile>;
  undetermined: RenderedImpact["undetermined"];
}

function add(acc: Acc, f: RenderedFile): void {
  const had = acc.files.get(f.path);
  if (!had) {
    acc.files.set(f.path, { ...f, ...(f.anchors ? { anchors: [...f.anchors] } : {}) });
    return;
  }
  if (f.anchors?.length) {
    had.anchors = had.anchors ?? [];
    for (const a of f.anchors) if (!had.anchors.includes(a)) had.anchors.push(a);
  }
  if (had.via.length === 0) had.via = f.via;
}

function finish(renderer: string, inputs: string[], acc: Acc, opts: { base?: string; head?: string; site?: string }): RenderedImpact {
  const files = [...acc.files.values()]
    .map((f) => (f.anchors?.length ? { ...f, anchors: [...f.anchors].sort() } : { path: f.path, change: f.change, role: f.role, via: f.via }))
    .sort((a, b) => a.path.localeCompare(b.path));
  return RenderedImpactSchema.parse({
    $schema: RENDERED_IMPACT_TAG,
    renderer,
    method: "cone",
    ...(opts.site ? { site: opts.site } : {}),
    ...(opts.base ? { base: opts.base } : {}),
    ...(opts.head ? { head: opts.head } : {}),
    inputs: [...inputs].sort(),
    files,
    undetermined: acc.undetermined,
  });
}

/** What the document site's builders can read, from the instance's own declarations. */
export interface SiteReads {
  /** Directories the instance declares (`<instance>.json` `directories[].path`), repo-relative. */
  declared: string[];
  /** Submodule paths (`.gitmodules`): the platform, whose code builds every page. */
  submodules: string[];
}

const under = (f: string, dir: string) => {
  const d = dir.replace(/\/+$/, "");
  return d === "" || d === "." || f === d || f.startsWith(`${d}/`);
};

/**
 * Whether a document site's builders can read `f`: under a declared
 * directory, a submodule, or `.github/`, or a root file that is not Markdown
 * (the declaration, config, lockfiles). `undefined` reads (no declaration)
 * means every file may be read.
 */
export function siteMayRead(f: string, reads: SiteReads | undefined): boolean {
  if (!reads) return true;
  if (reads.declared.some((d) => under(f, d)) || reads.submodules.some((d) => under(f, d))) return true;
  if (under(f, ".github")) return true;
  return !f.includes("/") && !/\.md$/i.test(f);
}

export interface DocImpactOptions {
  /** Changed files, relative to the repository root. */
  changed: string[];
  /** The ChangeSet between the same two refs (published `changeset.json`, or computed). */
  changeset: ChangeSet;
  /** The published `outline.json`; when absent, documents are read off the ChangeSet. */
  outline?: OutlineLike;
  base?: string;
  head?: string;
  /** Where the site's pages sit in the built output ("" for its root). */
  site?: string;
  /** What the site's builders can read; absent, every file may be read. */
  reads?: SiteReads;
}

/** The first path segment under the folio root: the document's slug. */
const slugOf = (fileInFolio: string) => fileInFolio.split("/")[0];

/**
 * Both renderers' impacts, from the ChangeSet and the outline. The document
 * renderer owns the site, so an input neither renderer maps is reported
 * undetermined by it.
 */
export function documentRenderedImpact(opts: DocImpactOptions): RenderedImpact[] {
  const pre = opts.site ? `${opts.site.replace(/\/+$/, "")}/` : "";
  const folio = opts.changeset.folio.replace(/\/+$/, "");
  const inFolio = (f: string) => (folio === "." || folio === "" ? f : f.startsWith(`${folio}/`) ? f.slice(folio.length + 1) : undefined);
  const slugs = new Set(opts.outline?.documents.map((d) => d.slug) ?? []);
  // Every block file the ChangeSet names, either side, to the change it is part of.
  const byFile = new Map<string, { label: string; slug: string }>();
  for (const c of opts.changeset.changes) {
    for (const at of [c.change === "added" ? undefined : c.base, c.change === "removed" ? undefined : c.head]) {
      if (!at) continue;
      const slug = slugOf(at.file);
      if (!opts.outline) slugs.add(slug);
      byFile.set(at.file, { label: c.label, slug });
    }
  }

  const doc: Acc = { files: new Map(), undetermined: [] };
  const pc: Acc = { files: new Map(), undetermined: [] };
  const docInputs: string[] = [];
  const pcInputs: string[] = [];

  for (const f of opts.changed) {
    if (COMMENT_STORE.test(f)) {
      pcInputs.push(f);
      add(pc, { path: `${pre}public-comments/index.html`, change: "changed", role: "content", via: [f] });
      // A comment's note sits beside its block on its document's page; which
      // document a comment targets is in the comment, not the path, so every
      // document page is listed: safe, and with one document, exact.
      for (const slug of [...slugs].sort()) add(pc, { path: `${pre}${slug}/index.html`, change: "changed", role: "content", via: [f] });
      continue;
    }
    docInputs.push(f);
    const rel = inFolio(f);
    // A block's `.md` is named in the ChangeSet by its manifest, `<stem>.ts`.
    const block = rel ? byFile.get(rel) ?? byFile.get(rel.replace(/\.md$/, ".ts")) : undefined;
    if (block) {
      add(doc, { path: `${pre}${block.slug}/index.html`, change: "changed", role: "content", via: [f, block.label], anchors: [block.label] });
      continue;
    }
    const slug = rel ? slugOf(rel) : undefined;
    if (rel && slug && slugs.has(slug)) {
      const page = `${pre}${slug}/index.html`;
      const sub = rel.slice(slug.length + 1);
      if (sub.startsWith("media/")) {
        add(doc, { path: `${pre}${rel}`, change: "changed", role: "data", via: [f] });
        add(doc, { path: page, change: "changed", role: "content", via: [f] });
        continue;
      }
      if (sub.endsWith(".ts")) {
        // Not a block the ChangeSet names: a document, chapter or section
        // manifest. Titles and order live there, so the outline and the
        // document list move with the page.
        add(doc, { path: page, change: "changed", role: "content", via: [f] });
        add(doc, { path: `${pre}outline.json`, change: "changed", role: "index", via: [f] });
        if (sub === `${slug}.ts`) add(doc, { path: `${pre}index.html`, change: "changed", role: "index", via: [f] });
        continue;
      }
    }
    // Read by no builder of the site: an input, and no page (see the module doc).
    if (!siteMayRead(f, opts.reads)) continue;
    doc.undetermined.push({ input: f, reason: "not a block the ChangeSet names, a media file, a manifest of a known document, or the comment store: may change any page", scope: "all" });
  }

  const out = [finish(DOCUMENT_RENDERER, docInputs, doc, opts)];
  if (pcInputs.length) out.push(finish(PUBLIC_COMMENT_RENDERER, pcInputs, pc, opts));
  return out;
}

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf-8"));

/**
 * The repository's {@link SiteReads}, or `undefined` when it declares nothing
 * readable: then no file is excluded.
 */
export function siteReadsOf(root: string): SiteReads | undefined {
  const decl = declarationPathIn(root);
  if (!decl) return undefined;
  let declared: string[];
  try {
    const dirs = (readJson(decl) as { directories?: Array<{ path?: unknown }> }).directories;
    if (!Array.isArray(dirs)) return undefined;
    declared = dirs.map((d) => d.path).filter((p): p is string => typeof p === "string");
  } catch {
    return undefined;
  }
  let submodules: string[] = [];
  if (existsSync(join(root, ".gitmodules"))) {
    try {
      submodules = execFileSync("git", ["-C", root, "config", "-f", ".gitmodules", "--get-regexp", "^submodule\\..*\\.path$"], { encoding: "utf-8" })
        .split("\n").map((l) => l.split(" ").slice(1).join(" ")).filter(Boolean);
    } catch {
      // A .gitmodules git cannot read: every submodule is unknown, so nothing is excluded.
      return undefined;
    }
  }
  return { declared, submodules };
}


if (import.meta.main) {
  const argv = process.argv.slice(2);
  const arg = (k: string) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const root = resolve(arg("--root") ?? ".");
  const base = arg("--base");
  const head = arg("--head") ?? (base ? "HEAD" : undefined);
  const changed = arg("--changed")?.split(",").filter(Boolean)
    ?? (base ? execFileSync("git", ["-C", root, "diff", "--name-only", `${base}...${head}`], { encoding: "utf-8" }).split("\n").filter(Boolean) : undefined);
  if (!changed) {
    console.error("usage: document-rendered-impact.ts --root <folio repo> (--changed a,b | --base <ref> [--head <ref>]) [--changeset f] [--outline f] [--site p] [--out f]");
    process.exit(2);
  }
  const csPath = arg("--changeset");
  const changeset = csPath
    ? ChangeSetSchema.parse(readJson(csPath))
    : computeChangeSet({ repoRoot: root, folio: arg("--folio") ?? "folio", base: base ?? "origin/main", head: head ?? "HEAD" });
  const olPath = arg("--outline");
  const outline = olPath && existsSync(olPath) ? (readJson(olPath) as OutlineLike) : undefined;
  // Pinned to the inputs' blobs at head, so a page verdict is about this version (see rendered-impact.ts, "A PIN").
  let impacts = documentRenderedImpact({ changed, changeset, outline, base, head, site: arg("--site"), reads: siteReadsOf(root) });
  try {
    const blobs = gitBlobs(root, head ?? "HEAD", changed);
    impacts = impacts.map((i) => pinImpact(i, (p) => blobs.get(p)));
  } catch (e) {
    console.error(`not pinned: ${(e as Error).message.split("\n")[0]}`);
  }
  const json = JSON.stringify(impacts, null, 2) + "\n";
  const out = arg("--out");
  if (out) writeFileSync(out, json);
  else process.stdout.write(json);
}
