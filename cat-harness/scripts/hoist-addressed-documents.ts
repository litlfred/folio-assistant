#!/usr/bin/env bun
/**
 * Move every JSON-LD document whose `@id` is a SITE-ROOT address out of the
 * docs tree and back to that address.
 *
 * @module scripts/hoist-addressed-documents
 *
 * ## Why this exists
 *
 * The owner's 2026-10-05 ruling (issue #2188, bean `kc7k`) moved the
 * Jekyll-built documentation from the site root to `<base-url>/docs/<built>/`
 * — a clean break, no redirect stubs. That moves EVERY file Jekyll writes,
 * and some of those files are not pages: they are knowledge-graph documents
 * the docs tree happens to carry, each published at the address its own
 * `@id` names (the `kg-viewer` rule of #1881 — an asset's IRI dereferences to
 * it). A site node is `site/<slug>.jsonld` against `@base` = the site root; a
 * library entry is `assets/library/jsonld/<instance>/<id>/manifest.jsonld`;
 * a todo is `todos/<id>.jsonld`; a named subgraph is `subgraph/<…>/`.
 *
 * Moving them with the pages would leave every one of those IRIs naming a
 * file that is no longer there — and the IRIs are referenced from thousands
 * of committed documents, LSI indexes and kg-qa sidecars. The ruling moved
 * PAGES; an identifier is not a page. So the documents go back to the
 * addresses their identifiers already name, and the IRIs stay as they are.
 *
 * ## The rule is read off the document, never a list of directories
 *
 * A file is hoisted when its own top-level `@id` — resolved against the
 * `@base` its context declares, fragment dropped — is the site-root address
 * of that same file:
 *
 * | the file | its `@id` (under the site root) |
 * |---|---|
 * | `x.jsonld` | `x.jsonld` |
 * | `x.json` (the `.json` alias Pages needs for a media type) | `x.jsonld` |
 * | `d/index.jsonld`, `d/index.<variant>.jsonld` | `d/` |
 *
 * A directory list (`site/`, `subgraph/`, …) would be the
 * `check:declared-assets` defect again: `todos/` holds both todo documents,
 * which an IRI names, and todo PAGES, which move with the docs — a directory
 * cannot say which is which, and the document can. A JSON file with a
 * relative `@id` and no `@base` is addressed relative to wherever it sits, so
 * it moves with the pages, which is exactly right for it.
 *
 * ## Refuses rather than overwrites
 *
 * A hoisted document whose root address is already taken by something else
 * the build wrote is a COLLISION, reported and failed, never resolved by
 * whichever step ran last — the same rule `mount-instance-docs.ts` keeps.
 *
 * Usage:
 *   bun run cat-harness/scripts/hoist-addressed-documents.ts --site ./_site --built cat-harness
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

import { ownNamespace } from "../schemas/namespaces.ts";
import { builtDocsRoute } from "./docs-route.ts";

/** The canonical site root every root-addressed `@id` is minted under (`docs-site` in `own-namespaces.json`). */
export const SITE_ROOT_IRI = ownNamespace("docs-site");

/** The `@base` a document's context declares, if any. */
function contextBase(ctx: unknown): string | undefined {
  for (const c of Array.isArray(ctx) ? ctx : [ctx]) {
    if (c !== null && typeof c === "object" && typeof (c as { "@base"?: unknown })["@base"] === "string") {
      return (c as { "@base": string })["@base"];
    }
  }
  return undefined;
}

/**
 * The document's `@id` as a path under the site root, or `undefined` when the
 * `@id` is not a site-root address (relative with no `@base`, another host, or
 * absent).
 */
export function rootAddressOf(doc: unknown, siteRoot = SITE_ROOT_IRI): string | undefined {
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) return undefined;
  const d = doc as { "@id"?: unknown; "@context"?: unknown };
  if (typeof d["@id"] !== "string") return undefined;
  const id = d["@id"];
  const base = contextBase(d["@context"]);
  let abs: string;
  if (/^[a-z][a-z0-9+.-]*:/i.test(id)) abs = id;
  else if (base !== undefined) {
    try {
      abs = new URL(id, base).href;
    } catch {
      return undefined;
    }
  } else return undefined;
  abs = abs.split("#")[0]!;
  return abs.startsWith(siteRoot) ? abs.slice(siteRoot.length) : undefined;
}

/** Whether a file at `rel` (site-root-relative, `/`-separated) IS the address `idPath`. */
export function isSelfAddressed(rel: string, idPath: string): boolean {
  if (idPath === rel) return true;
  if (rel.endsWith(".json") && idPath === `${rel.slice(0, -".json".length)}.jsonld`) return true;
  const slash = rel.lastIndexOf("/");
  const base = slash === -1 ? rel : rel.slice(slash + 1);
  const dir = slash === -1 ? "" : `${rel.slice(0, slash)}/`;
  return /^index(\.[\w-]+)?\.json(ld)?$/.test(base) && idPath === dir;
}

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...filesUnder(p));
    else if (/\.json(ld)?$/.test(e.name)) out.push(p);
  }
  return out;
}

export interface HoistReport {
  hoisted: string[];
  collisions: string[];
}

/** Hoist every self-addressed document from `<site>/<route>/` to `<site>/`. */
export function hoist(site: string, route: string, siteRoot = SITE_ROOT_IRI): HoistReport {
  const docs = join(site, route);
  const report: HoistReport = { hoisted: [], collisions: [] };
  if (!existsSync(docs) || !statSync(docs).isDirectory()) {
    throw new Error(`hoist-addressed-documents: ${docs} is not a built docs tree`);
  }
  for (const file of filesUnder(docs)) {
    const rel = relative(docs, file).split(sep).join("/");
    let doc: unknown;
    try {
      doc = JSON.parse(readFileSync(file, "utf-8"));
    } catch {
      continue; // not JSON — not an identified document, so it moves with the pages
    }
    const idPath = rootAddressOf(doc, siteRoot);
    if (idPath === undefined || !isSelfAddressed(rel, idPath)) continue;
    const dest = join(site, rel);
    if (existsSync(dest)) {
      report.collisions.push(rel);
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    renameSync(file, dest);
    report.hoisted.push(rel);
    // A directory this emptied (`site/<slug>/nodes/`) is pruned, so the docs
    // tree does not publish a skeleton of the documents that left it. Only up
    // to the docs root, and only while empty: a page beside them stays.
    for (let d = dirname(file); d !== docs && d.startsWith(docs) && readdirSync(d).length === 0; d = dirname(d)) {
      rmdirSync(d);
    }
  }
  return report;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const at = (f: string) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : undefined);
  const site = at("--site");
  const built = at("--built");
  if (!site || !built) {
    console.error("usage: hoist-addressed-documents.ts --site <built site> --built <instance directory>");
    process.exit(2);
  }
  let r: HoistReport;
  try {
    r = hoist(site, builtDocsRoute(built));
  } catch (e) {
    console.error((e as Error).message);
    process.exit(2);
  }
  const top = new Map<string, number>();
  for (const h of r.hoisted) {
    const k = h.includes("/") ? `${h.slice(0, h.indexOf("/"))}/` : h;
    top.set(k, (top.get(k) ?? 0) + 1);
  }
  console.log(`hoist-addressed-documents: ${r.hoisted.length} document(s) back at the root address their @id names`);
  for (const [k, n] of [...top].sort()) console.log(`  ${String(n).padStart(5)}  ${k}`);
  if (r.collisions.length > 0) {
    console.error(`hoist-addressed-documents: ${r.collisions.length} root address(es) already taken — refused, not overwritten:`);
    for (const c of r.collisions.slice(0, 40)) console.error(`  ${c}`);
    process.exit(1);
  }
}
