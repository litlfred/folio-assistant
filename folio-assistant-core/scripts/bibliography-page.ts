/**
 * The bibliography/ pages: every reference in the KG, viewable and exportable
 * whole, per sub-graph, and per reference (bean folio-assistant-63q4).
 *
 * Owner, 2026-10-14: *"there should be a bibliography viewer that allows
 * view/export in multiple formats of bib items in the folio … also be able to
 * export biblio reference for a single asset/paper … also be able to view (and
 * later add) things in biblio not in library assets (like dublin core records,
 * they are own nodes) … biblio viewer should work similar to glossary viewer
 * … use path limit to subgraphs and specific assets"*.
 *
 * ## What it reads
 *
 * Every declared directory of every instance in the checkout, as the glossary
 * page does:
 * - a `references` directory: each `*.json` file is a `folio-reference/v1`
 *   node (`schemas/reference.ts`);
 * - a `catalogue` directory: each `records/<slug>.dc.json` Dublin Core record
 *   becomes a reference node keyed `<slug>` (`dublinCoreToReference`), with
 *   `provenance: catalogue` and `derivedFrom` its record.
 *
 * One node type for both, so an IRIS catalogue item and a qou citation are listed,
 * filtered and exported the same way.
 *
 * ## What it writes, at the declared route
 *
 * The route is the `bibliography` visualiser core declares
 * (`folio-assistant-core.json`), computed by `visualiserRoute`, never spelled
 * here. Its three levels follow the route rule:
 *
 * | route | holds |
 * |---|---|
 * | `<route>/` | every reference |
 * | `<route>/<sub-graph>/` | the references of one declared directory |
 * | `<route>/<sub-graph>/#<key>` | one reference, with its own export |
 *
 * On a site that is its own index (an instance declared at the checkout root,
 * such as smart-ra), that instance is the site's own: the whole page lists its
 * references first, then every other layer's in a closed "From dependencies"
 * section grouped by layer, so a reader sees the site's own bibliography
 * without the layers below it (owner, 2026-11-01). A sub-graph id two layers
 * share (`library`) gets one page per layer: a dependency's is
 * `<instance>-<id>`.
 *
 * Beside each page are its exports: `references.bib`, `references.csl.json`,
 * `references.ris` and `references.jsonld` (Dublin Core / BIBO). One
 * reference's export is on its entry: the page carries each entry's BibTeX,
 * RIS and CSL-JSON, and a download link saves it. There is no per-reference
 * file: qou alone would be 915 × 4 files for text the page already holds.
 *
 * `--check` writes nothing, and fails when a node does not validate, a key
 * is claimed twice in one sub-graph, or the output on disk is stale. The pages
 * are built at publish, never committed (cat-harness `builtAtPublish`, entry
 * `docs/en/folio-assistant-core/bibliography/`), so the gate is `check:bibliography`:
 * `publish-check.ts bibliography:page` builds them and then runs this check.
 *
 * Usage:  bun run folio-assistant-core/scripts/bibliography-page.ts [--check]
 *
 * @module folio-assistant-core/scripts/bibliography-page
 * @covers references, catalogue, docs — it reads every instance's references and catalogue directories
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { libraryEntries } from "./lib/library-entries.ts";

import { instanceDirectoryForGraph, instanceRootsIn, readDeclaration, repoRootFor, resolveDirectories } from "@litlfred/cat-harness-tools/schemas/kg/cat-harness.ts";
import { safeHref } from "@litlfred/cat-harness-tools/schemas/ui/safe-url.ts";
import { declaredPageRoute } from "@litlfred/cat-harness-tools/scripts/viewer-declarations.ts";
import { siteTarget } from "@litlfred/cat-harness-tools/scripts/lib/site-target.ts";
import { DublinCoreRecordSchema } from "../schemas/dublin-core.ts";
import {
  REFERENCE_CONTEXT,
  REFERENCE_SCHEMA_TAG,
  ReferenceNodeSchema,
  buildStandaloneReference,
  dublinCoreToReference,
  jsonLdToReferenceNode,
  libraryItemToReference,
  nameText,
  newReferenceUrl,
  parseBibtexOrCsl,
  referenceAnchor,
  referenceIri,
  toBibtex,
  toCslJson,
  toDublinCoreXml,
  toJsonLdGraph,
  toRis,
  yearOf,
  type ReferenceNode,
  type StandaloneReferenceInput,
} from "../schemas/reference.ts";

export { buildStandaloneReference, newReferenceUrl, parseBibtexOrCsl, type StandaloneReferenceInput };

const CORE = resolve(import.meta.dir, "..");
const REPO = repoRootFor(CORE);
// declared-path-literal: the platform site the page publishes to, which is
// cat-harness's `docs/`; core owns the page, the harness owns the site. The
// glossary page publishes to the same place for the same reason.
// `--site <dir>`: a site being built (a repository's own, `visualiser-writers.ts`)
// gets the same route under it; its harness docs are a pinned mount.
const SITE = siteTarget(join(REPO, "cat-harness", "docs"));
/** The route of the visualiser core declares for its bibliography, from `folio-assistant-core.json`. */
const ROUTE = declaredPageRoute(CORE, "bibliography-page") ?? "en/folio-assistant-core/bibliography";
const ROOT = join(SITE, ...ROUTE.split("/"));

const GENERATED_BY = "folio-assistant-core/scripts/bibliography-page.ts";
const GENERATED = `<!-- Generated by ${GENERATED_BY}. Do not hand-edit: \`check:bibliography\` fails on the difference. -->`;
const GENERATED_FM = `generated: ${GENERATED_BY} — do not hand-edit; run \`bun run cat bibliography:page\``;

/** One reference, and where it was found. */
export interface Entry {
  ref: ReferenceNode;
  /** The instance whose declaration holds the directory. */
  instance: string;
  /** The declared directory's id: the route's `<sub-graph>`. */
  subgraph: string;
  /** Repo-relative path of the file it was read from. */
  file: string;
}

export interface AssetView {
  /** The sub-graph id. */
  subgraph: string;
  /** The sub-graph's route segment (`<route>/<slug>/<asset>/`): see {@link SubgraphView.slug}. */
  slug: string;
  /** The asset slug within the sub-graph. */
  asset: string;
  /** Instance name. */
  instance: string;
  /** Repo-relative path of the asset directory or file. */
  path: string;
  /** The asset's own reference (when any) plus references derived from or extracted from it. */
  entries: Entry[];
}

/** One scanned sub-graph. */
export interface SubgraphView {
  id: string;
  instance: string;
  kind: "references" | "catalogue" | "library";
  path: string;
  /**
   * Its route segment (`<route>/<slug>/`). The id itself, unless another
   * instance declares the same id: then a dependency's is `<instance>-<id>`,
   * so each layer's `library` gets its own page instead of sharing one.
   */
  slug: string;
}

export interface Collected {
  entries: Entry[];
  /** Every sub-graph that was scanned, with its instance, so an empty one is still listed. */
  subgraphs: SubgraphView[];
  /**
   * The instance the site belongs to: the one declared at the checkout root
   * (a repository that is its own index, such as smart-ra). Every other
   * instance in the checkout is one of its dependencies. `undefined` when no
   * instance is declared at the root (the platform monorepo): then no
   * instance is singled out and the page is one list.
   */
  own?: string;
  /** Per-asset bibliography views (`<route>/<sub-graph>/<asset>/`). */
  assets: AssetView[];
  invalid: string[];
}

const rel = (repo: string, p: string) => relative(repo, p).split("\\").join("/");

/**
 * The library copy each catalogue record describes, when one is held: an item
 * node (`nodes/*.json`, `folio-catalogue-node/v1`) names its record by
 * `metadataRef` and its library asset by `libraryId`, and the copy is held
 * when the instance's declared `library` directory has that asset. Keyed by
 * the record's path relative to the catalogue directory.
 */
export function heldCopies(instanceRoot: string, catalogueDir: string): Map<string, string> {
  const out = new Map<string, string>();
  const nodes = join(catalogueDir, "nodes");
  const library = instanceDirectoryForGraph(instanceRoot, "library");
  if (!existsSync(nodes) || library === undefined) return out;
  for (const f of readdirSync(nodes).filter((f) => f.endsWith(".json"))) {
    const n = JSON.parse(readFileSync(join(nodes, f), "utf-8")) as { metadataRef?: string; libraryId?: string };
    if (!n.metadataRef || !n.libraryId) continue;
    const asset = join(library, n.libraryId);
    if (existsSync(asset)) out.set(n.metadataRef.replace(/^catalogue\//, ""), asset);
  }
  return out;
}

/** Every reference in the checkout. */
export function collect(repo: string = REPO): Collected {
  const out: Collected = { entries: [], subgraphs: [], assets: [], invalid: [] };
  const scanned: Omit<SubgraphView, "slug">[] = [];
  const rawLibraryAssets: { subgraph: string; asset: string; instance: string; path: string; ownEntry: Entry }[] = [];
  for (const root of instanceRootsIn(repo)) {
    const decl = readDeclaration(root);
    if (!decl) continue;
    if (resolve(root) === resolve(repo)) out.own = decl.name;
    const dirs = resolveDirectories([{ name: decl.name, root, own: true }]).filter((d) => d.own);
    const heldByCatalogue = new Set<string>();
    for (const d of dirs) {
      if (existsSync(d.absPath) && (d.graphTypologies ?? []).includes("catalogue")) {
        for (const heldPath of heldCopies(root, d.absPath).values()) {
          heldByCatalogue.add(heldPath);
        }
      }
    }
    for (const d of dirs) {
      if (!existsSync(d.absPath)) continue;
      const kinds = d.graphTypologies ?? [];
      const push = (ref: ReferenceNode, file: string): Entry => {
        const entry: Entry = { ref, instance: decl.name, subgraph: d.id, file };
        out.entries.push(entry);
        return entry;
      };
      if (kinds.includes("references")) {
        scanned.push({ id: d.id, instance: decl.name, kind: "references", path: rel(repo, d.absPath) });
        const jsonFiles = readdirSync(d.absPath).filter((f) => f.endsWith(".json")).sort();
        const jsonBases = new Set(jsonFiles.map((f) => f.slice(0, -5)));
        for (const f of jsonFiles) {
          const p = join(d.absPath, f);
          let raw: unknown;
          try {
            raw = JSON.parse(readFileSync(p, "utf-8"));
          } catch (e) {
            out.invalid.push(`${rel(repo, p)}: not valid JSON (${e instanceof Error ? e.message : String(e)})`);
            continue;
          }
          const r = ReferenceNodeSchema.safeParse(raw);
          if (!r.success) {
            out.invalid.push(`${rel(repo, p)}: ${r.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
            continue;
          }
          if (`${r.data.id}.json` !== f) {
            out.invalid.push(`${rel(repo, p)}: the file is named for "${f.slice(0, -5)}" but its key is "${r.data.id}"`);
            continue;
          }
          push(r.data, rel(repo, p));
        }
        const jsonldFiles = readdirSync(d.absPath)
          .filter((f) => f.endsWith(".jsonld") && !jsonBases.has(f.slice(0, -7)))
          .sort();
        for (const f of jsonldFiles) {
          const p = join(d.absPath, f);
          let raw: unknown;
          try {
            raw = JSON.parse(readFileSync(p, "utf-8"));
          } catch (e) {
            out.invalid.push(`${rel(repo, p)}: not valid JSON (${e instanceof Error ? e.message : String(e)})`);
            continue;
          }
          if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
            out.invalid.push(`${rel(repo, p)}: expected a JSON-LD object`);
            continue;
          }
          let node: ReferenceNode;
          try {
            node = jsonLdToReferenceNode(raw as Record<string, unknown>);
          } catch (e) {
            out.invalid.push(`${rel(repo, p)}: ${e instanceof Error ? e.message : String(e)}`);
            continue;
          }
          if (`${node.id}.jsonld` !== f) {
            out.invalid.push(`${rel(repo, p)}: the file is named for "${f.slice(0, -7)}" but its key is "${node.id}"`);
            continue;
          }
          push(node, rel(repo, p));
        }
      }
      if (kinds.includes("catalogue")) {
        const records = join(d.absPath, "records");
        if (!existsSync(records)) continue;
        scanned.push({ id: d.id, instance: decl.name, kind: "catalogue", path: rel(repo, d.absPath) });
        const held = heldCopies(root, d.absPath);
        for (const f of readdirSync(records).filter((f) => f.endsWith(".dc.json")).sort()) {
          const p = join(records, f);
          const raw = JSON.parse(readFileSync(p, "utf-8")) as Record<string, unknown>;
          // Top-level `_` keys are notes for a person reading the file, not
          // metadata; check-catalogue.ts and dc-render.ts strip them the same way.
          for (const k of Object.keys(raw)) if (k.startsWith("_")) delete raw[k];
          const r = DublinCoreRecordSchema.safeParse(raw);
          if (!r.success) {
            out.invalid.push(`${rel(repo, p)}: not a folio-dublin-core/v1 record: ${r.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
            continue;
          }
          const key = basename(f, ".dc.json");
          const heldAt = held.get(`records/${f}`);
          try {
            push(dublinCoreToReference(r.data, { key, derivedFrom: rel(repo, p), ...(heldAt ? { heldAt: rel(repo, heldAt) } : {}) }), rel(repo, p));
          } catch (e) {
            out.invalid.push(`${rel(repo, p)}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
      }
      if (kinds.includes("library")) {
        // Flat or filed in a concern group (bean `6fez`): the slug is the key either way.
        const standaloneAssets = libraryEntries(d.absPath).filter(
          ({ dir }) => existsSync(join(dir, "manifest.jsonld")) && !heldByCatalogue.has(dir),
        );
        if (standaloneAssets.length > 0) {
          scanned.push({ id: d.id, instance: decl.name, kind: "library", path: rel(repo, d.absPath) });
          for (const { slug, dir: assetDir } of standaloneAssets) {
            const manifestRel = rel(repo, join(assetDir, "manifest.jsonld"));
            const assetRel = rel(repo, assetDir);
            try {
              const ref = libraryItemToReference(assetDir, { key: slug, derivedFrom: manifestRel, heldAt: assetRel });
              const ownEntry = push(ref, manifestRel);
              rawLibraryAssets.push({ subgraph: d.id, asset: slug, instance: decl.name, path: assetRel, ownEntry });
            } catch (e) {
              out.invalid.push(`${manifestRel}: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
        }
      }
    }
  }
  // A key is the citation's whole identity within its sub-graph.
  const seen = new Map<string, string>();
  for (const e of out.entries) {
    const k = `${e.subgraph}\0${e.ref.id}`;
    const prior = seen.get(k);
    if (prior) out.invalid.push(`${e.file}: key "${e.ref.id}" is already ${prior}'s in sub-graph ${e.subgraph}`);
    else seen.set(k, e.file);
  }
  out.entries.sort(byCitation);
  const instancesOf = new Map<string, Set<string>>();
  for (const s of scanned) instancesOf.set(s.id, (instancesOf.get(s.id) ?? new Set()).add(s.instance));
  const slugOf = (id: string, instance: string) => ((instancesOf.get(id)?.size ?? 0) > 1 && instance !== out.own ? `${instance}-${id}` : id);
  out.subgraphs = scanned.map((s) => ({ ...s, slug: slugOf(s.id, s.instance) }));
  out.subgraphs.sort((a, b) => a.slug.localeCompare(b.slug, "en"));

  // Build per-asset bibliography views (`<route>/<sub-graph>/<asset>/`):
  // each standalone library asset holds its own reference plus any references
  // extracted or derived from that asset.
  for (const la of rawLibraryAssets) {
    const extracted = out.entries.filter(
      (e) =>
        e !== la.ownEntry &&
        ((e.ref.derivedFrom !== undefined && (e.ref.derivedFrom === la.path || e.ref.derivedFrom.startsWith(`${la.path}/`))) ||
          (e.ref.heldAt !== undefined && (e.ref.heldAt === la.path || e.ref.heldAt.startsWith(`${la.path}/`)))),
    );
    const assetEntries = [la.ownEntry, ...extracted].sort(byCitation);
    out.assets.push({
      subgraph: la.subgraph,
      slug: slugOf(la.subgraph, la.instance),
      asset: la.asset,
      instance: la.instance,
      path: la.path,
      entries: assetEntries,
    });
  }
  out.assets.sort((a, b) => a.slug.localeCompare(b.slug, "en") || a.asset.localeCompare(b.asset, "en"));
  return out;
}

/** First author's name, then year, then title, then key: how a reference list is read. */
export function byCitation(a: Entry, b: Entry): number {
  const k = (e: Entry) => [e.ref.author?.[0] ? nameText(e.ref.author[0]) : e.ref.title ?? e.ref.id, yearOf(e.ref) ?? "", e.ref.title ?? "", e.ref.id];
  const [x, y] = [k(a), k(b)];
  for (let i = 0; i < x.length; i++) {
    const c = x[i]!.localeCompare(y[i]!, "en", { sensitivity: "base" });
    if (c) return c;
  }
  return 0;
}

// ── Rendering ────────────────────────────────────────────────────────────────

const esc = (s: string) =>
  s
    .replace(/\s*\r?\n\s*/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** The anchor of one reference on its page (`referenceAnchor`, shared with the links to it). */
export const anchorOf = referenceAnchor;

/** One reference as a readable citation: authors (year). Title. Container, vol(issue), pages. Publisher. */
export function citationHtml(r: ReferenceNode): string {
  const parts: string[] = [];
  const authors = (r.author ?? []).map(nameText);
  if (authors.length) parts.push(esc(authors.length > 3 ? `${authors.slice(0, 3).join("; ")}; et al.` : authors.join("; ")));
  const y = yearOf(r);
  if (y) parts.push(`(${esc(y)})`);
  let s = parts.join(" ");
  if (r.title) s += `${s ? ". " : ""}<cite>${esc(r.title)}</cite>`;
  const where = [
    r["container-title"] ? `<i>${esc(r["container-title"])}</i>` : "",
    r.volume !== undefined ? `${esc(String(r.volume))}${r.issue !== undefined ? `(${esc(String(r.issue))})` : ""}` : "",
    r.page ? esc(r.page) : "",
  ].filter(Boolean);
  if (where.length) s += `. ${where.join(", ")}`;
  if (r.publisher) s += `. ${esc(r.publisher)}`;
  return `${s}.`;
}

/** The links an entry carries: DOI, URL (checked via `safeHref`), its source, the library copy. */
export function linksHtml(e: Entry): string {
  const r = e.ref;
  const l: string[] = [];
  if (r.DOI) {
    const doiHref = safeHref(`https://doi.org/${r.DOI}`);
    if (doiHref) l.push(`<a href="${esc(doiHref)}">doi:${esc(r.DOI)}</a>`);
    else l.push(`doi:${esc(r.DOI)}`);
  }
  if (r.URL && !(r.DOI && r.URL.includes(r.DOI))) {
    const urlHref = safeHref(r.URL);
    if (urlHref) l.push(`<a href="${esc(urlHref)}">link</a>`);
    else l.push(`<code>${esc(r.URL)}</code>`);
  }
  if (r.ISBN) l.push(`ISBN ${esc(r.ISBN)}`);
  l.push(`source: <code>${esc(e.file)}</code>`);
  if (r.heldAt) l.push(`held: <code>${esc(r.heldAt)}</code>`);
  return l.join(" · ");
}

/** One entry: the citation, its key and provenance, its links, and its own export. */
/**
 * The anchors of one page, handed out in the order its entries are shown. The
 * first entry for a key gets `ref-<key>`, which is what an in-text citation
 * links; a later entry for the same key on the same page (the same work in two
 * instances' catalogues, bean djj5) gets `ref-<instance>-<key>`, so no id
 * repeats (`check:duplicate-ids`).
 */
export function pageAnchors(): (e: Entry) => string {
  const used = new Set<string>();
  return (e) => {
    let id = anchorOf(e.ref.id);
    if (used.has(id)) id = anchorOf(`${e.instance}-${e.ref.id}`);
    for (let n = 2; used.has(id); n++) id = anchorOf(`${e.instance}-${e.ref.id}-${n}`);
    used.add(id);
    return id;
  };
}

export function entryHtml(e: Entry, anchor: (e: Entry) => string = (x) => anchorOf(x.ref.id)): string {
  const r = e.ref;
  const id = anchor(e);
  const dl = (fmt: string, text: string, mime: string, ext: string) =>
    `<a download="${esc(r.id)}.${ext}" href="data:${mime};charset=utf-8,${encodeURIComponent(text)}">${fmt}</a>`;
  return `<li id="${id}" data-fa-bib="${esc([r.id, r.title ?? "", ...(r.author ?? []).map(nameText), yearOf(r) ?? ""].join(" "))}">
  ${citationHtml(r)}<br>
  <small><a href="#${id}"><code>${esc(r.id)}</code></a> · ${esc(r.provenance ?? "authored")} · ${linksHtml(e)}<br>
  export: ${dl("BibTeX", toBibtex([r]), "application/x-bibtex", "bib")} · ${dl("RIS", toRis([r]), "application/x-research-info-systems", "ris")} · ${dl("CSL-JSON", toCslJson([r]), "application/vnd.citationstyles.csl+json", "csl.json")} · ${dl("DC XML", toDublinCoreXml([r]), "application/xml", "dc.xml")}</small>
</li>`;
}

/**
 * The `✍ + Add reference` panel on a bibliography page: lets a reader or author
 * enter reference fields (`id`/`key`, `title`, `type`, `authors`, `issued`,
 * `containerTitle`, `DOI`, `URL`, `arXiv`, `abstract`) or paste BibTeX/CSL-JSON,
 * builds a standalone `folio-reference/v1` JSON-LD node (`references/<key>.jsonld`)
 * and CSL-JSON entry, and offers both download/copy and `safeHref`-checked
 * creation at `<targetDir>/<key>.jsonld` (bean folio-assistant-63q4).
 */
export function addReferenceHtml(opts: { targetDir?: string; repoUrl?: string; branch?: string } = {}): string {
  const targetDir = (opts.targetDir ?? "references").replace(/^\/+|\/+$/g, "") || "references";
  const repoUrl = (opts.repoUrl ?? "https://github.com/litlfred/folio-assistant").replace(/\/+$/, "");
  const branch = opts.branch ?? "main";
  const ghHref = safeHref(newReferenceUrl({ repoUrl, branch, dir: targetDir, key: "reference" }));
  const ghLink = ghHref
    ? `<a id="fa-bib-add-gh" href="${esc(ghHref)}" target="_blank" rel="noopener">✍ Create standalone node on GitHub</a>`
    : `<span id="fa-bib-add-gh-disabled">✍ Create standalone node on GitHub (unavailable)</span>`;
  return `<details id="fa-bib-add" class="fa-bib-add">
<summary class="fa-bib-add-toggle">✍ + Add reference (standalone node)</summary>
<form id="fa-bib-add-form" class="fa-bib-add-form" data-target-dir="${esc(targetDir)}" data-repo-url="${esc(safeHref(repoUrl) ?? "")}" data-branch="${esc(branch)}" autocomplete="off">
<p>Build a standalone <code>${esc(REFERENCE_SCHEMA_TAG)}</code> node at <code id="fa-bib-add-path">${esc(targetDir)}/reference.jsonld</code> from fields or pasted BibTeX / CSL-JSON.</p>
<div class="fa-bib-add-paste">
  <label for="fa-bib-add-raw">Paste BibTeX or CSL-JSON (optional)</label><br>
  <textarea id="fa-bib-add-raw" name="raw" rows="3" style="width:100%;max-width:40rem" placeholder="@article{smith2024, title={...}, author={Smith, Jane}, year={2024}, doi={10.1000/xyz}}"></textarea><br>
  <button type="button" id="fa-bib-add-parse">Parse BibTeX / CSL-JSON</button>
</div>
<div class="fa-bib-add-grid">
  <label for="fa-bib-add-key">Key (<code>id</code>)</label>
  <input id="fa-bib-add-key" name="id" type="text" required pattern="[A-Za-z0-9][A-Za-z0-9._:+-]*" placeholder="smith2024">
  <label for="fa-bib-add-type">Type</label>
  <select id="fa-bib-add-type" name="type"><option value="article-journal">article-journal</option><option value="book">book</option><option value="report">report</option><option value="webpage">webpage</option><option value="paper-conference">paper-conference</option><option value="chapter">chapter</option><option value="thesis">thesis</option><option value="manuscript">manuscript</option><option value="standard">standard</option><option value="document">document</option></select>
  <label for="fa-bib-add-title">Title</label>
  <input id="fa-bib-add-title" name="title" type="text" placeholder="Title of the work">
  <label for="fa-bib-add-authors">Authors</label>
  <input id="fa-bib-add-authors" name="authors" type="text" placeholder="Family, Given; Second, Author">
  <label for="fa-bib-add-issued">Issued (year or YYYY-MM-DD)</label>
  <input id="fa-bib-add-issued" name="issued" type="text" placeholder="2024">
  <label for="fa-bib-add-container">Container title</label>
  <input id="fa-bib-add-container" name="containerTitle" type="text" placeholder="Journal, book or proceedings">
  <label for="fa-bib-add-doi">DOI</label>
  <input id="fa-bib-add-doi" name="DOI" type="text" placeholder="10.1000/xyz">
  <label for="fa-bib-add-url">URL</label>
  <input id="fa-bib-add-url" name="URL" type="url" placeholder="https://example.org/paper">
  <label for="fa-bib-add-arxiv">arXiv</label>
  <input id="fa-bib-add-arxiv" name="arXiv" type="text" placeholder="2401.00001">
  <label for="fa-bib-add-abstract">Abstract</label>
  <textarea id="fa-bib-add-abstract" name="abstract" rows="2" style="width:100%;max-width:40rem" placeholder="Abstract or summary"></textarea>
</div>
<p class="fa-bib-add-actions">
  <button type="submit" id="fa-bib-add-submit">✍ Add reference</button> ·
  ${ghLink} ·
  <a id="fa-bib-add-dl-jsonld" download="reference.jsonld" href="data:application/ld+json;charset=utf-8,%7B%7D">Download .jsonld</a> ·
  <a id="fa-bib-add-dl-csl" download="reference.csl.json" href="data:application/vnd.citationstyles.csl+json;charset=utf-8,%5B%5D">Download .csl.json</a> ·
  <button type="button" id="fa-bib-add-copy">Copy .jsonld</button>
  <span id="fa-bib-add-status" aria-live="polite"></span>
</p>
<pre id="fa-bib-add-preview"><code id="fa-bib-add-code"></code></pre>
</form>
</details>`;
}

const FILTER_SCRIPT = `<script>
(function(){var q=document.getElementById("fa-bib-q"),n=document.getElementById("fa-bib-n");if(q){
function run(){var v=q.value.trim().toLowerCase(),k=0;
document.querySelectorAll("li[data-fa-bib]").forEach(function(li){var ok=!v||(li.textContent+" "+li.getAttribute("data-fa-bib")).toLowerCase().indexOf(v)>=0;li.hidden=!ok;if(ok)k++;});n.textContent=k;}
q.addEventListener("input",run);}
document.querySelectorAll("details.fa-bib-deps").forEach(function(d){if(q)q.addEventListener("input",function(){if(q.value.trim())d.open=true;});});
function openFor(){var h=location.hash&&document.getElementById(decodeURIComponent(location.hash.slice(1)));var d=h&&h.closest&&h.closest("details.fa-bib-deps");if(d&&!d.open){d.open=true;h.scrollIntoView();}}
openFor();window.addEventListener("hashchange",openFor);
var ALLOWED_URL_SCHEMES=["http:","https:","mailto:","tel:"];
function safeHref(u){if(!u)return undefined;var s=String(u).replace(/[\\u0009\\u000A\\u000D]/g,"").trim();if(!s||s.indexOf("//")===0)return undefined;if(/^[#?./]/.test(s)||!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s))return s;var sc=s.slice(0,s.indexOf(":")+1).toLowerCase();return ALLOWED_URL_SCHEMES.indexOf(sc)>=0?s:undefined;}
var form=document.getElementById("fa-bib-add-form");if(!form)return;
var val=function(id){var el=document.getElementById(id);return el?el.value.trim():"";};
var setVal=function(id,v){var el=document.getElementById(id);if(el&&v!==undefined)el.value=v;};
function parseAuthors(s){if(!s)return undefined;return s.split(/;|\\s+and\\s+/i).map(function(p){p=p.trim();if(!p)return null;var i=p.indexOf(",");if(i>=0)return{family:p.slice(0,i).trim(),given:p.slice(i+1).trim()};var t=p.split(/\\s+/);return t.length>1?{family:t[t.length-1],given:t.slice(0,-1).join(" ")}:{literal:p};}).filter(Boolean);}
function parseRaw(){var raw=val("fa-bib-add-raw");if(!raw)return;if(raw[0]==="{"||raw[0]==="["){try{var j=JSON.parse(raw);var it=Array.isArray(j)?j[0]:j;if(!it)return;setVal("fa-bib-add-key",it.id||(it["@id"]||"").replace(/^references\\//,""));setVal("fa-bib-add-type",it.type||"article-journal");setVal("fa-bib-add-title",it.title||it["dcterms:title"]||"");if(Array.isArray(it.author))setVal("fa-bib-add-authors",it.author.map(function(a){return a.literal||[a.family,a.given].filter(Boolean).join(", ");}).join("; "));if(it.issued&&it.issued["date-parts"]&&it.issued["date-parts"][0])setVal("fa-bib-add-issued",it.issued["date-parts"][0].join("-"));setVal("fa-bib-add-container",it["container-title"]||it.containerTitle||"");setVal("fa-bib-add-doi",it.DOI||"");setVal("fa-bib-add-url",it.URL||"");setVal("fa-bib-add-abstract",it.abstract||"");}catch(_e){}return;}
var m=/^@([A-Za-z]+)\\s*\\{\\s*([^,\\s]+)\\s*,([\\s\\S]*)\\}\\s*$/.exec(raw);if(!m)return;setVal("fa-bib-add-key",m[2]);var tm={article:"article-journal",book:"book",techreport:"report",report:"report",inproceedings:"paper-conference",phdthesis:"thesis",mastersthesis:"thesis",online:"webpage",webpage:"webpage"};setVal("fa-bib-add-type",tm[m[1].toLowerCase()]||"document");var re=/([A-Za-z_][A-Za-z0-9_-]*)\\s*=\\s*(\\{(?:[^{}]|\\{[^{}]*\\})*\\}|"[^"]*"|[^,\\n}]+)/g,fm;while((fm=re.exec(m[3]))!==null){var fk=fm[1].toLowerCase(),fv=fm[2].trim().replace(/^\\{([\\s\\S]*)\\}$|^"([\\s\\S]*)"$/,"$1$2").replace(/[{}]/g,"").trim();if(fk==="title")setVal("fa-bib-add-title",fv);else if(fk==="author")setVal("fa-bib-add-authors",fv);else if(fk==="year"||fk==="date")setVal("fa-bib-add-issued",fv);else if(fk==="journal"||fk==="booktitle")setVal("fa-bib-add-container",fv);else if(fk==="doi")setVal("fa-bib-add-doi",fv);else if(fk==="url")setVal("fa-bib-add-url",fv);else if(fk==="eprint"||fk==="arxiv")setVal("fa-bib-add-arxiv",fv);else if(fk==="abstract")setVal("fa-bib-add-abstract",fv);}}
function build(){var rawKey=val("fa-bib-add-key").replace(/[^A-Za-z0-9._:+-]+/g,"-").replace(/^[^A-Za-z0-9]+/,"")||"reference";var tp=val("fa-bib-add-type")||"article-journal";var ti=val("fa-bib-add-title");var au=parseAuthors(val("fa-bib-add-authors"));var is=val("fa-bib-add-issued");var ct=val("fa-bib-add-container");var doi=val("fa-bib-add-doi").replace(/^https?:\\/\\/(?:dx\\.)?doi\\.org\\//i,"");var arx=val("fa-bib-add-arxiv").replace(/^arxiv:/i,"");var u=safeHref(val("fa-bib-add-url")||(arx?"https://arxiv.org/abs/"+arx:doi?"https://doi.org/"+doi:undefined));var ab=val("fa-bib-add-abstract");
var bibo={book:"bibo:Book",report:"bibo:Report",webpage:"bibo:Webpage",thesis:"bibo:Thesis",chapter:"bibo:Chapter",manuscript:"bibo:Manuscript",standard:"bibo:Standard"}[tp]||"bibo:AcademicArticle";
var node={"@context":${JSON.stringify(REFERENCE_CONTEXT)},"@id":${JSON.stringify(referenceIri(""))}+rawKey,"@type":["fabio:Work",bibo],$schema:"folio-reference/v1",id:rawKey,type:tp,provenance:"authored"};
if(ti){node["dcterms:title"]=ti;node.title=ti;}if(au&&au.length){node["dcterms:creator"]=au.map(function(a){return a.literal||[a.family,a.given].filter(Boolean).join(", ");});node.author=au;}if(is){var ym=/^(\\d{4})(?:-(\\d{2})(?:-(\\d{2}))?)?/.exec(is);node.issued=ym?{"date-parts":[[ym[1],ym[2],ym[3]].filter(Boolean).map(Number)]}:{raw:is};node["dcterms:issued"]=is;}if(ct){node["dcterms:isPartOf"]=ct;node["container-title"]=ct;}if(doi){node["bibo:doi"]=doi;node.DOI=doi;}if(u){node["dcterms:identifier"]=u;node.URL=u;}if(ab){node["dcterms:abstract"]=ab;node.abstract=ab;}if(arx)node.note="arXiv:"+arx;
var csl={id:rawKey,type:tp};if(ti)csl.title=ti;if(au&&au.length)csl.author=au;if(node.issued)csl.issued=node.issued;if(ct)csl["container-title"]=ct;if(doi)csl.DOI=doi;if(u)csl.URL=u;if(ab)csl.abstract=ab;if(arx)csl.note="arXiv:"+arx;
var dir=form.getAttribute("data-target-dir")||"references";var pathEl=document.getElementById("fa-bib-add-path");if(pathEl)pathEl.textContent=dir+"/"+rawKey+".jsonld";
var jsonldText=JSON.stringify(node,null,2)+"\\n",cslText=JSON.stringify([csl],null,2)+"\\n";
var codeEl=document.getElementById("fa-bib-add-code");if(codeEl)codeEl.textContent=jsonldText;
var dlLd=document.getElementById("fa-bib-add-dl-jsonld");if(dlLd){dlLd.setAttribute("download",rawKey+".jsonld");dlLd.setAttribute("href","data:application/ld+json;charset=utf-8,"+encodeURIComponent(jsonldText));}
var dlCsl=document.getElementById("fa-bib-add-dl-csl");if(dlCsl){dlCsl.setAttribute("download",rawKey+".csl.json");dlCsl.setAttribute("href","data:application/vnd.citationstyles.csl+json;charset=utf-8,"+encodeURIComponent(cslText));}
var repoUrl=safeHref(form.getAttribute("data-repo-url")||"https://github.com/litlfred/folio-assistant");var branch=form.getAttribute("data-branch")||"main";
var ghUrl=repoUrl?safeHref(repoUrl+"/new/"+encodeURIComponent(branch)+"/"+dir.split("/").map(encodeURIComponent).join("/")+"?filename="+encodeURIComponent(rawKey+".jsonld")+"&value="+encodeURIComponent(jsonldText)):undefined;
var ghEl=document.getElementById("fa-bib-add-gh");if(ghEl&&ghUrl)ghEl.setAttribute("href",ghUrl);
return{key:rawKey,dir:dir,node:node,jsonldText:jsonldText,ghUrl:ghUrl};}
var pb=document.getElementById("fa-bib-add-parse");if(pb)pb.addEventListener("click",function(){parseRaw();build();});
form.addEventListener("input",build);
var cb=document.getElementById("fa-bib-add-copy");if(cb)cb.addEventListener("click",function(){var b=build();if(navigator.clipboard)navigator.clipboard.writeText(b.jsonldText);var st=document.getElementById("fa-bib-add-status");if(st)st.textContent="Copied "+b.dir+"/"+b.key+".jsonld";});
form.addEventListener("submit",function(ev){ev.preventDefault();var b=build();var st=document.getElementById("fa-bib-add-status");if(b.ghUrl)window.open(b.ghUrl,"_blank","noopener");if(st)st.textContent="Ready at "+b.dir+"/"+b.key+".jsonld";});
build();})();
</script>`;

/** The export files beside a page, by name. */
export const EXPORTS = [
  ["references.bib", "BibTeX", toBibtex],
  ["references.csl.json", "CSL-JSON", toCslJson],
  ["references.ris", "RIS", toRis],
  ["references.dc.xml", "Dublin Core XML", toDublinCoreXml],
  ["references.jsonld", "Dublin Core / BIBO JSON-LD", toJsonLdGraph],
] as const;

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

/**
 * The list when a site has an own instance: its references first, then every
 * dependency's, grouped by layer, in a closed `From dependencies` section so
 * the page opens on the site's own bibliography. The filter and a link to an
 * entry's anchor open the section.
 */
export function ownAndDependenciesHtml(own: string, entries: Entry[], anchor: (e: Entry) => string = pageAnchors()): string {
  const mine = entries.filter((e) => e.instance === own);
  const layers = [...new Set(entries.filter((e) => e.instance !== own).map((e) => e.instance))].sort((a, b) => a.localeCompare(b, "en"));
  const ownList = mine.length ? `<ol class="fa-bib">\n${mine.map((e) => entryHtml(e, anchor)).join("\n")}\n</ol>` : `<p>${esc(own)} has no references of its own yet.</p>`;
  const deps = layers.length
    ? `<details class="fa-bib-deps" id="fa-bib-deps">
<summary><strong>From dependencies</strong>: ${plural(entries.length - mine.length, "reference")} from ${plural(layers.length, "layer")} that ${esc(own)} builds on. They are not part of ${esc(own)}.</summary>
${layers
  .map((l) => {
    const ls = entries.filter((e) => e.instance === l);
    return `<h3 id="fa-bib-dep-${esc(anchorOf(l).replace(/^ref-/, ""))}">${esc(l)} <small>(dependency, ${plural(ls.length, "reference")})</small></h3>
<ol class="fa-bib fa-bib-dep" data-fa-bib-layer="${esc(l)}">
${ls.map((e) => entryHtml(e, anchor)).join("\n")}
</ol>`;
  })
  .join("\n")}
</details>`
    : "";
  return `<h2 id="fa-bib-own">${esc(own)} <small>(this site, ${plural(mine.length, "reference")})</small></h2>
${ownList}
${deps}`;
}

/** A page: front matter, what it holds, its exports, the `+ Add reference` panel, the filter and the list. */
export function renderPage(opts: { title: string; permalink: string; intro: string; entries: Entry[]; nav?: string; targetDir?: string; own?: string }): string {
  const { title, permalink, intro, entries, nav, targetDir, own } = opts;
  const exports = EXPORTS.map(([f, label]) => `<a href="${f}">${label}</a>`).join(" · ");
  const addPanel = addReferenceHtml({ targetDir });
  const grouped = own !== undefined && entries.some((e) => e.instance !== own);
  const anchor = pageAnchors();
  const list = entries.length
    ? `<label for="fa-bib-q">Filter references</label>
<input id="fa-bib-q" type="search" autocomplete="off" style="min-height:44px;width:100%;max-width:32rem">
<p aria-live="polite"><span id="fa-bib-n">${entries.length}</span> shown</p>

${grouped && own !== undefined ? ownAndDependenciesHtml(own, entries, anchor) : `<ol class="fa-bib">\n${entries.map((e) => entryHtml(e, anchor)).join("\n")}\n</ol>`}`
    : "<p>No references here yet.</p>";
  const ownCount = grouped ? entries.filter((e) => e.instance === own).length : entries.length;
  const exportLead = grouped
    ? `**Export all ${plural(entries.length, "reference")}** (${ownCount} of ${own}'s own and ${entries.length - ownCount} from dependencies):`
    : `**Export these ${plural(entries.length, "reference")}:**`;
  return `---
title: "${title.replace(/"/g, '\\"')}"
permalink: ${permalink}
${GENERATED_FM}
---
${GENERATED}

# ${title}

${intro}

${exportLead} ${exports}
${nav ? `\n${nav}\n` : ""}
${addPanel}

${list}

${FILTER_SCRIPT}
`;
}

/** Every file this generator owns, path → content. */
/**
 * One instance's bibliography, as its own site lists it (owner, 2026-11-03:
 * a page per IG, bean djj5): its own references and those of the layers it
 * `needs`, transitively, with `own` set to it. Everything else in the
 * checkout belongs to other sites.
 */
export function forInstance(c: Collected, instance: string, needsOf: (name: string) => readonly string[]): Collected {
  const keep = new Set<string>();
  const visit = (n: string) => {
    if (keep.has(n)) return;
    keep.add(n);
    for (const d of needsOf(n)) visit(d);
  };
  visit(instance);
  return {
    ...c,
    own: instance,
    entries: c.entries.filter((e) => keep.has(e.instance)),
    subgraphs: c.subgraphs.filter((s) => keep.has(s.instance)),
    assets: (c.assets ?? []).filter((a) => keep.has(a.instance)),
  };
}

/**
 * The pages and exports. `prefix` is the site path an instance's own site is
 * served under inside a composed site (`/<instance>` for `--instance
 * <instance>`), so each page's permalink lands where its links point.
 */
export function outputs(c: Collected, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  const write = (dir: string, page: string, entries: Entry[]) => {
    out.set(join(dir, "index.md"), page);
    const refs = entries.map((e) => e.ref);
    for (const [f, , fn] of EXPORTS) out.set(join(dir, f), fn(refs));
  };
  const inSub = (s: { id: string; instance: string }) => c.entries.filter((e) => e.subgraph === s.id && e.instance === s.instance);
  // A directory declaring two kinds (references and catalogue) is scanned twice: one link, one page.
  const pages = [...new Map(c.subgraphs.map((s) => [s.slug, s])).values()];
  const link = (s: SubgraphView, layer: boolean) => `<a href="${s.slug}/">${s.id}</a> (${inSub(s).length}${layer ? `, ${s.instance}` : ""})`;
  const own = c.own !== undefined && c.subgraphs.some((s) => s.instance !== c.own) ? c.own : undefined;
  const nav = !pages.length
    ? undefined
    : own === undefined
      ? `**By sub-graph:** ${pages.map((s) => link(s, false)).join(" · ")}`
      : [
          `**${own} (this site), by sub-graph:** ${pages.filter((s) => s.instance === own).map((s) => link(s, false)).join(" · ") || "none"}`,
          `**Dependencies, by sub-graph:** ${pages.filter((s) => s.instance !== own).map((s) => link(s, true)).join(" · ")}`,
        ].join("<br>\n");
  const defaultTargetDir =
    c.subgraphs.find((s) => s.kind === "references" && s.instance === c.own)?.path ?? c.subgraphs.find((s) => s.kind === "references")?.path ?? "references";
  write(
    ROOT,
    renderPage({
      title: "Bibliography",
      permalink: `${prefix}/${ROUTE}/`,
      intro:
        (own === undefined
          ? "Every reference in the knowledge graph: the bibliographies folios declare (`references` directories, one `folio-reference/v1` node each), the Dublin Core records of catalogues (`catalogue` directories), and the ingested items of libraries (`library` directories), as one list."
          : `The references of ${own}, this site, come first: its bibliography (\`references\` directories, one \`folio-reference/v1\` node each), its catalogue records and its library items. The references of the layers ${own} depends on follow, under **From dependencies**, grouped by layer; they are not part of ${own}.`) +
        " Each reference sits at `references/<key>`, the IRI a `\\cite{key}` resolves to.",
      entries: c.entries,
      nav,
      targetDir: defaultTargetDir,
      own,
    }),
    c.entries,
  );
  for (const s of pages) {
    const entries = inSub(s);
    const subAssets = (c.assets ?? []).filter((a) => a.slug === s.slug);
    const assetNav = subAssets.length
      ? `**By asset:** ${subAssets.map((a) => `<a href="${a.asset}/">${a.asset}</a> (${a.entries.length})`).join(" · ")}`
      : undefined;
    write(
      join(ROOT, s.slug),
      renderPage({
        title: `Bibliography: ${s.slug}`,
        permalink: `${prefix}/${ROUTE}/${s.slug}/`,
        intro: `The references of \`${s.path}/\` (${s.instance}${own !== undefined && s.instance !== own ? `, a dependency of ${own}` : ""}, a \`${s.kind}\` directory). [All references](../).`,
        entries,
        nav: assetNav,
        targetDir: s.kind === "references" ? s.path : defaultTargetDir,
      }),
      entries,
    );
  }
  for (const a of c.assets ?? []) {
    write(
      join(ROOT, a.slug, a.asset),
      renderPage({
        title: `Bibliography: ${a.slug}/${a.asset}`,
        permalink: `${prefix}/${ROUTE}/${a.slug}/${a.asset}/`,
        intro: `The reference for \`${a.path}\` (${a.instance}${own !== undefined && a.instance !== own ? `, a dependency of ${own}` : ""}) and any references extracted from it. [${a.slug}](../) · [All references](../../).`,
        entries: a.entries,
      }),
      a.entries,
    );
  }
  return out;
}

function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? filesUnder(join(dir, e.name)) : [join(dir, e.name)]));
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  // `--instance <name>`: that instance's own bibliography, written under
  // `--site` with permalinks under `/<name>/`, for a site that composes the
  // instance's pages inside its own (an index staging an IG at `/<name>/`).
  const ii = process.argv.indexOf("--instance");
  const instance = ii >= 0 ? process.argv[ii + 1] : undefined;
  if (ii >= 0 && !instance) {
    console.error("✗ --instance needs an instance name");
    process.exit(2);
  }
  const all = collect();
  let c = all;
  if (instance !== undefined) {
    const needs = new Map<string, readonly string[]>();
    for (const root of instanceRootsIn(REPO)) {
      const d = readDeclaration(root) as { name?: string; needs?: string[] } | undefined;
      if (d?.name) needs.set(d.name, d.needs ?? []);
    }
    if (!needs.has(instance)) {
      console.error(`✗ --instance ${instance}: no instance of that name in this checkout`);
      process.exit(2);
    }
    c = forInstance(all, instance, (n) => needs.get(n) ?? []);
  }
  if (c.invalid.length) {
    console.error(`✗ ${c.invalid.length} reference(s) do not validate:`);
    for (const f of c.invalid) console.error(`  ${f}`);
    process.exit(1);
  }
  const files = outputs(c, instance !== undefined ? `/${instance}` : "");
  const orphans = filesUnder(ROOT).filter((p) => !files.has(p));
  const stale = [...files].filter(([p, s]) => !existsSync(p) || readFileSync(p, "utf-8") !== s).map(([p]) => p);
  const summary = `${c.entries.length} reference(s) in ${c.subgraphs.length} sub-graph(s)`;
  if (check) {
    if (stale.length || orphans.length) {
      for (const p of stale) console.error(`✗ stale: ${relative(REPO, p)}`);
      for (const p of orphans) console.error(`✗ orphan: ${relative(REPO, p)}`);
      console.error("Run `bun run cat bibliography:page`. The pages are built at publish and never committed.");
      process.exit(1);
    }
    console.log(`✓ bibliography current: ${summary}`);
    process.exit(0);
  }
  for (const [p, s] of files) {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, s);
  }
  for (const p of orphans) rmSync(p);
  console.log(`Wrote ${files.size} file(s) under ${relative(REPO, ROOT)}: ${summary}.`);
}
