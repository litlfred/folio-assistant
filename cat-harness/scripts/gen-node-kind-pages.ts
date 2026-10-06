#!/usr/bin/env bun
/**
 * A page for every node kind, every harness that holds one, and every node —
 * issue #2195, PR 2.
 *
 * @module scripts/gen-node-kind-pages
 * @covers typologies — it renders every node kind the typologies name, and the nodes their directories hold
 * @graphNode none — a generator over the node-kind index, not a schema itself
 *
 * The owner, 2026-10-05: *"generic requirement for a new node kind, should be
 * visualizer available at <base-url>/<declaring-harness>/<kind> that is a
 * dashboard like view of all nodes of that kind, …/<harness> for the nodes in
 * a named harness, …/<harness>/<path/to/node> for a node of that kind"*, and
 * then *"we need to keep track of locales, so lets do it upfront
 * /<locale>/<declaring>/<kind>/…"*. So, under the site being built:
 *
 * | page | shows |
 * |---|---|
 * | `/<locale>/<declaring>/<kind>/` | every node of the kind AND its subclasses, in every harness on the site |
 * | `/<locale>/<declaring>/<kind>/<harness>/` | the nodes one harness holds |
 * | `/<locale>/<declaring>/<kind>/<harness>/<path>/` | one node |
 *
 * ## Generic, from the kind's schema
 *
 * Settled the same day: *"Generic + override"*. Every kind gets these pages,
 * built from its Zod schema — top-level scalar fields become columns, enum
 * fields become status tiles — and a kind may later declare its own renderer
 * (the change-set dashboard is the first, PR 3). The harness navbar is always
 * the platform's (`makeEmit`), whatever renders the content.
 *
 * Only `en` is written today: the chrome strings are English, and a locale
 * segment with nothing translated behind it would claim a translation that
 * does not exist. The segment is in the URL from the start so adding a locale
 * moves no page.
 *
 * Usage:
 *   bun run node-kind:pages          # write
 *   bun run node-kind:pages:check    # fail if a page is stale or orphaned
 */
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

import { defaultGraphTypologies, readDeclaration, repoRootFor, siteDirFor } from "../schemas/cat-harness.ts";
import { nodeKindIndex, type NodeKindEntry, type NodeKindIndex } from "../schemas/node-kind-index.ts";
import { kindDirectories, nodesOfKind, type KindNode } from "../schemas/node-kind-nodes.ts";
import { isNodeKind } from "../schemas/node-kind.ts";
import { darkRules } from "./lib/scheme-css.ts";
import type { VisualiserNavEntry } from "./lib/navbar.ts";
import { makeEmit, subjectSection, type ViewerNav } from "./viewer-page.ts";

/** The locales a page is written for. See the module comment for why only `en`. */
export const LOCALES = ["en"] as const;

/** Marks a page this generator wrote, so pruning never touches anyone else's. */
export const PAGE_MARK = "data-fa-node-kind-page";

export const esc = (s: unknown): string =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** One top-level field of a kind's schema, as a page uses it. */
export interface FieldInfo {
  name: string;
  /** Zod's type after unwrapping optional/default/nullable. */
  type: string;
  /** For an enum: its values, in declared order. */
  options?: string[];
}

/** The top-level fields of a Zod object schema (Zod 4), unwrapped. */
export function fieldsOf(schema: unknown): FieldInfo[] {
  const shape = (schema as { shape?: Record<string, unknown> } | undefined)?.shape;
  if (!shape) return [];
  return Object.entries(shape).map(([name, v]) => {
    let def = (v as { _zod?: { def?: Record<string, unknown> } })._zod?.def;
    while (def && ["optional", "default", "nullable", "prefault", "readonly"].includes(def.type as string)) {
      def = (def.innerType as { _zod?: { def?: Record<string, unknown> } } | undefined)?._zod?.def;
    }
    const type = (def?.type as string | undefined) ?? "unknown";
    const entries = def?.entries as Record<string, string> | undefined;
    return { name, type, ...(type === "enum" && entries ? { options: Object.values(entries) } : {}) };
  });
}

const SCALAR = new Set(["string", "number", "boolean", "enum", "literal", "int", "bigint"]);
/** Fields a reader looks for first, in this order, when choosing columns. */
const PREFERRED = ["id", "title", "summary", "status", "priority", "kind", "proposedAt", "createdAt", "updatedAt"];

/** At most `n` scalar columns, preferred names first. `$schema` is shown per row as the kind, not as a column. */
export function columnsFor(fields: readonly FieldInfo[], n = 5): FieldInfo[] {
  const scalar = fields.filter((f) => SCALAR.has(f.type) && f.name !== "$schema");
  const rank = (f: FieldInfo) => (PREFERRED.includes(f.name) ? PREFERRED.indexOf(f.name) : PREFERRED.length);
  return [...scalar].sort((a, b) => rank(a) - rank(b)).slice(0, n);
}

/** A value as one table cell's text. */
export function cell(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "object") return Array.isArray(v) ? `${v.length} item(s)` : "{…}";
  const s = String(v);
  return s.length > 140 ? `${s.slice(0, 139)}…` : s;
}

const STYLE = `
  :root { color-scheme: light dark; --fg:#1b1b1b; --bg:#fdfdfb; --muted:#5b5b5b; --line:#d6d6d0; --link:#0b5cad; --panel:#f3f4f2; }
  ${darkRules(":root { --fg:#e8e8e6; --bg:#161616; --muted:#a8a8a4; --line:#3a3a38; --link:#7db4ff; --panel:#1f2124; }")}
  body { margin:0; font:1rem/1.5 system-ui,sans-serif; color:var(--fg); background:var(--bg); }
  main { max-width:80rem; margin:0 auto; padding:1.5rem 1.5rem 4rem; min-width:0; overflow-wrap:anywhere; }
  h1 { font-size:1.35rem; margin:0 0 .25rem; } h2 { font-size:1.05rem; margin:1.5rem 0 .5rem; }
  a { color:var(--link); } a:focus-visible, select:focus-visible { outline:3px solid var(--link); outline-offset:2px; }
  .m { color:var(--muted); font-size:.9rem; }
  .tiles { display:flex; flex-wrap:wrap; gap:.5rem; margin:.5rem 0; padding:0; list-style:none; }
  .tiles li { border:1px solid var(--line); border-radius:.4rem; padding:.35rem .7rem; }
  .tiles b { font-size:1.2rem; margin-right:.3rem; }
  .clip { width:100%; overflow-x:auto; }
  table { width:100%; border-collapse:collapse; font-size:.92rem; }
  th, td { text-align:left; vertical-align:top; padding:.35rem .5rem; border-bottom:1px solid var(--line); }
  th { background:var(--panel); white-space:nowrap; }
  /* Only the node's path and long text may break mid-word; a status or a date
     broken across lines ("in_pr ogres s") is unreadable. */
  td { overflow-wrap:normal; } td.p, td.t { overflow-wrap:anywhere; } td.s { white-space:nowrap; }
  dl { display:grid; grid-template-columns:minmax(8rem,14rem) 1fr; gap:.25rem 1rem; }
  dt { font-weight:600; } dd { margin:0; }
  pre { background:var(--panel); padding:.75rem; overflow-x:auto; font-size:.85rem; }
  label { margin-right:1rem; }
  @media (max-width:40rem) { dl { grid-template-columns:1fr; } }
`;

/** Filters the table by subclass and by harness; a page with JS off still lists every row. */
const FILTER = `
(function(){
  var sels=document.querySelectorAll('select[data-filter]'), rows=document.querySelectorAll('tbody tr[data-kind]');
  var out=document.getElementById('shown');
  function apply(){ var n=0; rows.forEach(function(r){ var ok=true;
    sels.forEach(function(s){ if(s.value && r.getAttribute('data-'+s.getAttribute('data-filter'))!==s.value) ok=false; });
    r.hidden=!ok; if(ok) n++; }); if(out) out.textContent=String(n); }
  sels.forEach(function(s){ s.addEventListener('change',apply); });
})();
`;

function page(title: string, body: string, script = ""): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${STYLE}</style>
</head>
<body ${PAGE_MARK}>
<main>
${body}
</main>${script ? `\n<script>${script}</script>` : ""}
</body>
</html>
`;
}

/** A section a kind's own renderer adds to a page: a heading with an id, so the rail can index it. */
export interface PageSection {
  id: string;
  label: string;
  /** Already escaped; `esc` is exported for the renderer's use. */
  html: string;
}

/** What a renderer is given besides its nodes: a way to reach other kinds' nodes, and to link them. */
export interface KindPagesContext {
  locale: string;
  /** Every node of `kindId` and its subclasses on this site. */
  nodesOf(kindId: string): readonly KindNode[];
  /** A relative link from the page being written to `n`'s page under kind `kindId`; undefined when that kind has no pages. */
  linkTo(kindId: string, n: Pick<KindNode, "harness" | "path">): string | undefined;
}

/**
 * A kind's own renderer — the "override" of *"Generic + override"* (issue
 * #2195). Named by its validator node's `pages` reference, so the harness that
 * knows the kind says how to show it. It ADDS sections; the heading, the
 * tiles, the table, the fields and the navbar stay the platform's, so every
 * kind's pages read alike and a renderer cannot drop the generic view.
 */
export interface KindPages {
  /** Sections on the kind page and each harness page, after the tiles and before the table. */
  dashboard?(nodes: readonly KindNode[], ctx: KindPagesContext): PageSection[];
  /** Sections on a node's page, after its heading and before its fields. */
  node?(n: KindNode, ctx: KindPagesContext): PageSection[];
}

export const isKindPages = (v: unknown): v is KindPages =>
  !!v && typeof v === "object" && (typeof (v as KindPages).dashboard === "function" || typeof (v as KindPages).node === "function");

const sectionsHtml = (extra: readonly PageSection[]): string =>
  extra.map((x) => `<h2 id="${esc(x.id)}">${esc(x.label)}</h2>\n${x.html}`).join("\n");

/** Where a kind's pages live, relative to the site root. */
export const kindDir = (locale: string, k: Pick<NodeKindEntry, "id" | "declaredBy">): string => `${locale}/${k.declaredBy}/${k.id}`;

/** A relative href from page directory `from` to page directory `to`, both site-relative. */
function href(from: string, to: string): string {
  const r = relative(from, to).split(sep).join("/");
  return r === "" ? "./" : `${r}/`;
}

/** The kind's place in the tree: parents and subclasses, each linked where it has pages. */
function lineage(here: string, k: NodeKindEntry, byId: Map<string, NodeKindEntry>, locale: string): string {
  const link = (id: string) => {
    const t = byId.get(id);
    return t?.declaredBy ? `<a href="${href(here, kindDir(locale, t))}">${esc(id)}</a>` : `<span>${esc(id)}</span>`;
  };
  const parts: string[] = [];
  if (k.parents.length) parts.push(`extends ${k.parents.map(link).join(", ")}`);
  if (k.subclasses.length) parts.push(`subclasses ${k.subclasses.map(link).join(", ")}`);
  return parts.length ? `<p class="m">${parts.join(" · ")}</p>` : "";
}

/** The dashboard: every node, or one harness's. */
export function dashboardHtml(
  k: NodeKindEntry,
  nodes: readonly KindNode[],
  fields: readonly FieldInfo[],
  byId: Map<string, NodeKindEntry>,
  locale: string,
  harness?: string,
  extra: readonly PageSection[] = [],
): string {
  const base = kindDir(locale, k);
  const here = harness ? `${base}/${harness}` : base;
  const cols = columnsFor(fields);
  const enums = fields.filter((f) => f.type === "enum" && f.options);
  const harnesses = [...new Set(nodes.map((n) => n.harness))].sort();
  const kinds = [...new Set(nodes.map((n) => n.kind))].sort();
  const title = harness ? `${k.id} — ${harness}` : k.id;

  const tiles = enums
    .map((f) => {
      const counts = f.options!.map((o) => [o, nodes.filter((n) => n.node[f.name] === o).length] as const).filter(([, c]) => c > 0);
      return counts.length
        ? `<h2 id="by-${esc(f.name)}">By ${esc(f.name)}</h2><ul class="tiles">${counts.map(([o, c]) => `<li><b>${c}</b>${esc(o)}</li>`).join("")}</ul>`
        : "";
    })
    .join("");

  const where = harness
    ? `<p class="m">Held by <b>${esc(harness)}</b>. <a href="${href(here, base)}">Every harness</a></p>`
    : harnesses.length
      ? `<h2 id="by-harness">By harness</h2><ul class="tiles">${harnesses
          .map((h) => `<li><b>${nodes.filter((n) => n.harness === h).length}</b><a href="${href(here, `${base}/${h}`)}">${esc(h)}</a></li>`)
          .join("")}</ul>`
      : "";

  const select = (name: string, label: string, values: string[]) =>
    values.length > 1
      ? `<label>${label} <select data-filter="${name}"><option value="">all</option>${values.map((v) => `<option>${esc(v)}</option>`).join("")}</select></label>`
      : "";

  // One kind in every row says nothing per row; the heading already names it.
  const oneKind = kinds.length <= 1;
  const cls = (c: FieldInfo) => (c.type === "string" && !["id", "status", "priority"].includes(c.name) ? "t" : "s");
  const rows = nodes
    .map((n) => {
      // A node's page is under the kind it IS — one address per node — so a
      // subclass's row links into its own kind's pages.
      const to = href(here, `${kindDir(locale, byId.get(n.kind) ?? k)}/${n.harness}/${n.path}`);
      return `<tr data-kind="${esc(n.kind)}" data-harness="${esc(n.harness)}"><td class="p"><a href="${to}">${esc(n.path)}</a></td>${
        harness ? "" : `<td class="s">${esc(n.harness)}</td>`
      }${oneKind ? "" : `<td class="s">${esc(n.kind)}</td>`}${cols.map((c) => `<td class="${cls(c)}">${esc(cell(n.node[c.name]))}</td>`).join("")}</tr>`;
    })
    .join("\n");

  const table = nodes.length
    ? `<h2 id="nodes">Nodes</h2>
<p>${select("kind", "Kind", kinds)}${harness ? "" : select("harness", "Harness", harnesses)}<span class="m"><span id="shown">${nodes.length}</span> of ${nodes.length} shown</span></p>
<div class="clip"><table>
<thead><tr><th>Node</th>${harness ? "" : "<th>Harness</th>"}${oneKind ? "" : "<th>Kind</th>"}${cols.map((c) => `<th>${esc(c.name)}</th>`).join("")}</tr></thead>
<tbody>
${rows}
</tbody></table></div>`
    : `<p>No node of this kind${harness ? " in this harness" : " on this site"} yet.</p>`;

  return page(
    title,
    `<h1>${esc(title)}</h1>
<p class="m">Node kind <code>${esc(k.tag ?? k.id)}</code>, declared by <b>${esc(k.declaredBy)}</b>. ${nodes.length} node(s)${
      k.subclasses.length ? ", subclasses included" : ""
    }.</p>
${lineage(here, k, byId, locale)}
${where}
${tiles}
${sectionsHtml(extra)}
${table}`,
    nodes.length ? FILTER : "",
  );
}

/** One node's page: every field, then the source. */
export function nodeHtml(k: NodeKindEntry, n: KindNode, locale: string, extra: readonly PageSection[] = []): string {
  const base = kindDir(locale, k);
  const here = `${base}/${n.harness}/${n.path}`;
  const name = n.node.title ?? n.node.summary ?? n.node.id ?? n.path;
  const dd = (v: unknown) => (v !== null && typeof v === "object" ? `<pre>${esc(JSON.stringify(v, null, 2))}</pre>` : esc(v));
  const fields = Object.entries(n.node)
    .map(([key, v]) => `<dt>${esc(key)}</dt><dd>${dd(v)}</dd>`)
    .join("\n");
  return page(
    `${cell(name)} — ${k.id}`,
    `<h1>${esc(cell(name))}</h1>
<p class="m">A <a href="${href(here, base)}">${esc(n.kind)}</a> node held by <a href="${href(here, `${base}/${n.harness}`)}">${esc(n.harness)}</a>, at <code>${esc(n.file)}</code>.</p>
${sectionsHtml(extra)}
<h2 id="fields">Fields</h2>
<dl>
${fields}
</dl>`,
  );
}

/**
 * The page's own rail section (#1757): every page carries one, with its own
 * row OPEN and its regions under it, or `check:viewer-nav` flags it
 * (`visualiser-nav`, `single-open`). The kind page and its harness pages are
 * one level apart, the shape `subjectSection` draws; a node page sits deeper,
 * so its section links up to its kind and its harness and opens on itself.
 */
export function dashboardSection(
  k: NodeKindEntry,
  nodes: readonly KindNode[],
  fields: readonly FieldInfo[],
  harness?: string,
  extra: readonly Pick<PageSection, "id" | "label">[] = [],
): VisualiserNavEntry[] {
  const scoped = harness ? nodes.filter((n) => n.harness === harness) : nodes;
  const regions = [
    ...(harness || !scoped.length ? [] : [{ label: "By harness", id: "by-harness" }]),
    ...fields
      .filter((f) => f.type === "enum" && f.options?.some((o) => scoped.some((n) => n.node[f.name] === o)))
      .map((f) => ({ label: `By ${f.name}`, id: `by-${f.name}` })),
    ...extra.map((x) => ({ label: x.label, id: x.id })),
    ...(scoped.length ? [{ label: "Nodes", id: "nodes" }] : []),
  ];
  const harnesses = [...new Set(nodes.map((n) => n.harness))].sort();
  return subjectSection(harnesses, harness, regions, (s) => ({ label: s ?? k.id }));
}

export function nodeSection(k: NodeKindEntry, n: KindNode, extra: readonly Pick<PageSection, "id" | "label">[] = []): VisualiserNavEntry[] {
  const depth = n.path.split("/").length;
  const up = (levels: number) => "../".repeat(levels);
  return [
    { label: k.id, href: up(depth + 1) },
    { label: n.harness, href: up(depth) },
    { label: n.path.split("/").pop()!, items: [...extra.map((x) => ({ label: x.label, href: `#${x.id}` })), { label: "Fields", href: "#fields" }] },
  ];
}

/** Every page path (site-relative, no `index.html`) the index and nodes call for. */
export function plannedPages(index: NodeKindIndex, nodesOf: (id: string) => KindNode[], locales: readonly string[] = LOCALES): string[] {
  const out: string[] = [];
  for (const locale of locales) {
    for (const k of index.kinds) {
      if (!k.declaredBy || !k.version) continue;
      const base = kindDir(locale, k);
      out.push(base);
      const nodes = nodesOf(k.id);
      for (const h of new Set(nodes.map((n) => n.harness))) out.push(`${base}/${h}`);
      for (const n of nodes) if (n.kind === k.id) out.push(`${base}/${n.harness}/${n.path}`);
    }
  }
  return out;
}

/** Every `index.html` under `dir` that this generator wrote. */
function ownPages(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    let es: string[];
    try {
      es = readdirSync(d);
    } catch {
      return;
    }
    for (const e of es) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (e === "index.html" && readFileSync(p, "utf-8").includes(PAGE_MARK)) out.push(p);
    }
  };
  walk(dir);
  return out;
}

export interface BuildOptions {
  /** The instance whose registry the index is built from: cat-harness's root, wherever the platform is checked out. */
  instanceRoot: string;
  /** The checkout whose harnesses hold the nodes: the platform's own, or a folio's. */
  siteRepo: string;
  /** The site directory pages are written under. */
  site: string;
  /** The instance the site is built for, as the navbar names it. */
  built: string;
  check: boolean;
  /** Fail when a page is stale or orphaned only if the site is committed; a folio's `_site` is not. */
  prune: boolean;
}

/**
 * Write (or check) every node-kind page for one site. Returns the pages it
 * planned, so a caller can verify each one RESOLVES — exists and carries the
 * mark — rather than trust that writing it worked.
 */
export async function buildNodeKindPages(o: BuildOptions): Promise<{ pages: string[]; stale: number }> {
  const platformRepo = repoRootFor(o.instanceRoot);
  let stale = 0;
  const nav: ViewerNav = { built: o.built, docsRoot: o.site };

  const index = await nodeKindIndex(defaultGraphTypologies, o.instanceRoot, platformRepo);
  const byId = new Map(index.kinds.map((k) => [k.id, k]));
  const cache = new Map<string, KindNode[]>();
  const nodesOf = (id: string) => cache.get(id) ?? cache.set(id, nodesOfKind(index, id, o.siteRepo)).get(id)!;
  const imported = new Map<string, Record<string, unknown>>();
  const load = async (module: string) =>
    imported.get(module) ?? imported.set(module, (await import(join(platformRepo, module))) as Record<string, unknown>).get(module)!;
  const fieldsOfKind = async (k: NodeKindEntry): Promise<FieldInfo[]> => {
    const kind = k.module && k.exportName ? (await load(k.module))[k.exportName] : undefined;
    return isNodeKind(kind) ? fieldsOf(kind.schema) : [];
  };
  // A named renderer that does not load is an error, not a quiet fall back to
  // the generic pages: the declaration says this kind has its own view.
  const pagesOf = async (k: NodeKindEntry): Promise<KindPages> => {
    if (!k.pages) return {};
    const r = (await load(k.pages.module))[k.pages.exportName];
    if (!isKindPages(r)) throw new Error(`${k.id}: ${k.pages.module}#${k.pages.exportName} is not a KindPages`);
    return r;
  };

  const written = new Set<string>();
  const pages: string[] = [];
  const write = (rel: string, html: string, section: VisualiserNavEntry[]) => {
    const file = join(o.site, rel, "index.html");
    written.add(file);
    pages.push(rel);
    makeEmit({ check: o.check, onStale: () => { stale++; }, nav: { ...nav, section }, quiet: true })(file, html);
  };
  for (const locale of LOCALES) {
    const ctxFor = (here: string): KindPagesContext => ({
      locale,
      nodesOf,
      linkTo: (kindId, n) => {
        const t = byId.get(kindId);
        return t?.declaredBy && t.version ? href(here, `${kindDir(locale, t)}/${n.harness}/${n.path}`) : undefined;
      },
    });
    for (const k of index.kinds) {
      if (!k.declaredBy || !k.version) continue;
      const nodes = nodesOf(k.id);
      const fields = await fieldsOfKind(k);
      const own = await pagesOf(k);
      const base = kindDir(locale, k);
      const dash = (scoped: readonly KindNode[], here: string) => own.dashboard?.(scoped, ctxFor(here)) ?? [];
      const top = dash(nodes, base);
      write(base, dashboardHtml(k, nodes, fields, byId, locale, undefined, top), dashboardSection(k, nodes, fields, undefined, top));
      for (const h of new Set(nodes.map((n) => n.harness))) {
        const scoped = nodes.filter((n) => n.harness === h);
        const extra = dash(scoped, `${base}/${h}`);
        write(`${base}/${h}`, dashboardHtml(k, scoped, fields, byId, locale, h, extra), dashboardSection(k, nodes, fields, h, extra));
      }
      for (const n of nodes) {
        if (n.kind !== k.id) continue; // written under its own kind
        const here = `${base}/${n.harness}/${n.path}`;
        const extra = own.node?.(n, ctxFor(here)) ?? [];
        write(here, nodeHtml(k, n, locale, extra), nodeSection(k, n, extra));
      }
    }
  }

  // An orphan is a page this generator wrote for a node or kind that is gone.
  // Only pages carrying the mark are candidates, so a hand-written page that
  // happens to sit under a locale is never touched.
  if (o.prune) {
    for (const locale of LOCALES) {
      for (const file of ownPages(join(o.site, locale))) {
        if (written.has(file)) continue;
        if (o.check) {
          console.error(`  ✗ ${relative(o.siteRepo, file)} is an orphan — its node or kind is gone`);
          stale++;
        } else {
          rmSync(file);
          console.log(`  ✗ pruned ${relative(o.siteRepo, file)}`);
        }
      }
    }
  }
  return { pages, stale };
}

/** The planned pages that do not resolve: no `index.html`, or one this generator did not write. */
export function unresolvedPages(site: string, pages: readonly string[]): string[] {
  return pages.filter((rel) => {
    const file = join(site, rel, "index.html");
    return !existsSync(file) || !readFileSync(file, "utf-8").includes(PAGE_MARK);
  });
}

/**
 * What this generator READS when it builds a folio's site (bean `ehh6`): the
 * directories {@link kindDirectories} names under `--root`, repo-relative.
 * The document predictor asks it so a changed file outside them (a folio's
 * `beans/`) is not "may change any page"; `todos/` is read, since todo pages
 * are rendered. `args` are the ones the build command passes.
 */
export async function siteReads(repoRoot: string, args: string[] = []): Promise<string[]> {
  const i = args.indexOf("--root");
  const siteRepo = i >= 0 && args[i + 1] ? resolve(repoRoot, args[i + 1]!) : repoRoot;
  const instanceRoot = join(import.meta.dir, "..");
  const index = await nodeKindIndex(defaultGraphTypologies, instanceRoot, repoRootFor(instanceRoot));
  return kindDirectories(index, siteRepo).map((d) => relative(repoRoot, d).split(sep).join("/"));
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const opt = (name: string) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const check = argv.includes("--check");
  const INSTANCE_ROOT = join(import.meta.dir, "..");
  // A folio builds its own site: `--root <folio checkout> --out <site dir>`.
  // Its nodes are its harnesses', the kinds are the platform's, and its
  // `_site` is built at deploy rather than committed, so there is nothing to
  // prune or to call stale.
  const folio = opt("--root");
  const siteRepo = folio ? resolve(folio) : repoRootFor(INSTANCE_ROOT);
  const site = folio ? resolve(opt("--out") ?? "_site") : join(INSTANCE_ROOT, siteDirFor(INSTANCE_ROOT));
  const built = readDeclaration(folio ? siteRepo : INSTANCE_ROOT)?.name;
  if (!built) {
    console.log("  · this instance declares no name — nothing to publish under");
    process.exit(0);
  }
  const { pages, stale } = await buildNodeKindPages({ instanceRoot: INSTANCE_ROOT, siteRepo, site, built, check, prune: !folio });
  if (!check) console.log(`  ${pages.length} node-kind page(s) under ${LOCALES.join(", ")} in ${relative(process.cwd(), site) || "."}`);
  if (stale > 0) {
    console.error(`\n${stale} page(s) stale — run \`bun run node-kind:pages\``);
    process.exit(1);
  }
  // Every planned page must resolve, written or checked: the QA half of PR 3.
  const missing = unresolvedPages(site, pages);
  if (missing.length) {
    for (const m of missing) console.error(`  ✗ ${m}/ does not resolve`);
    process.exit(1);
  }
  if (check) console.log(`✓ ${pages.length} node-kind page(s) current, and every one resolves`);
}
