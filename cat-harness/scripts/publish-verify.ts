#!/usr/bin/env bun
/**
 * Verify what is about to be deployed — the post-processing verifier set.
 *
 * @module scripts/publish-verify
 *
 * Bean `vigi`, owner 2026-09-23: *"a set of post processing tools for
 * verification that a failure triggers an alert to the publisher manager …
 * new sub-process"*, run **before deployment**, blocking. The process is
 * `processes/sdlc/publish-verification.bpmn`; the alert is
 * `processes/sdlc/publish-alert.bpmn`, which every failing step after the publish
 * button shares.
 *
 *   bun run cat-harness/scripts/publish-verify.ts --dir ./_site [--report out.md] [--base <url>]... [--instance <dir>] [--search-index borrowed]
 *
 * Exit 0 every in-scope document passed · 1 a verifier found a failure ·
 * 2 could not tell (nothing to verify, or a verifier could not run). The
 * caller treats 1 and 2 alike: nothing is deployed.
 *
 * ## A SET, not one check
 *
 * Each verifier is an entry in {@link VERIFIERS}: an id, what it asks, and a
 * function from the directory to findings. Adding one is adding an entry; the
 * report, the exit code and the alert need no change. The first is JSON-LD
 * expansion, because the graph was JSON-LD by convention and not by
 * construction — nothing had ever run a processor over it, and the first run
 * found two documents silently dropping a property. The second is unique ids
 * in built HTML (bean `uknu`) — a defect the source cannot show. The third is
 * the site search index (bean `fq5u`), a downstream output Jekyll writes and
 * nothing had checked — `--search-index borrowed` on a staging preview, which
 * serves the published index or a declared-empty one. The fourth and fifth are
 * the mechanical half of the `linked-data` voice (bean `4pla`):
 * `jsonld-object-links` (a value under an object property expands to a link, or
 * is a literal the author declared) and `jsonld-own-base` (no document leans on
 * a remote context's `@base`).
 *
 * ## What is in scope
 *
 * A document is OURS — and so verified — when its `@context` references our
 * content context or binds one of our namespaces (`own-namespaces` code list),
 * OR when its own `@id` is under the site's address (the declaration's
 * `canonicalUrl`, or each `--base`). The second test is bean `7h1c`: the SKOS
 * code-lists document binds only `skos`, `dcterms`, `owl` and `rdf`, so the
 * context test counted it "not ours" although we mint every IRI in it. A
 * document's `@id` says who published it; its context says only whose
 * vocabulary it speaks.
 * Anything else in the tree is ingested third-party data (a WHO IG's artefact
 * index, say): counted and reported, never silently passed, and never able to
 * block our release. The same scoping the owner approved for bean `2j09`.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import jsonld from "jsonld";

import { CONTENT_CONTEXT_URL } from "../schemas/jsonld";
import { readDeclaration } from "../schemas/cat-harness";
import { OWN_NAMESPACE_VALUES } from "../schemas/namespaces";
import { heldProvJsonldContext, PROV_JSONLD_CONTEXT_URL } from "../schemas/prov-jsonld.ts";
import { duplicateIds } from "./check-duplicate-ids";
import { SCOPES_DIR, type SearchManifest } from "./search-split.ts";

export interface Finding {
  verifier: string;
  file: string;
  detail: string;
}

export interface VerifierResult {
  id: string;
  asks: string;
  checked: number;
  outOfScope: number;
  findings: Finding[];
  /** Set when the verifier could not run at all — never read as a pass. */
  couldNotTell?: string;
  /**
   * Something counted that is neither a pass nor a finding — said in the
   * report so a sanctioned exception stays visible instead of vanishing into
   * "pass". `jsonld-object-links`' declared literals are the first.
   */
  note?: string;
}

/** What a verifier knows about the site beyond its files. */
export interface VerifyContext {
  /** The addresses the site publishes under; an `@id` below one is ours. */
  bases: readonly string[];
  /**
   * Where the tree's search index came from. `built` (the default): this
   * build wrote it, so it must cover this build's pages. `borrowed`: a
   * staging preview serves the PUBLISHED index or a declared-empty `{}` with
   * a banner saying so (`feature-staging.yml`), so only presence and parsing
   * are asked of it.
   */
  searchIndex?: "built" | "borrowed";
}

export interface Verifier {
  id: string;
  asks: string;
  /**
   * The downstream Tool whose output this verifier judges, when it judges
   * one. That Tool must declare `downstream` with `verifier` naming this id;
   * `kg:audit`'s `downstream-tool-declared` reports a mismatch.
   */
  tool?: string;
  run(dir: string, ctx: VerifyContext): Promise<Omit<VerifierResult, "id" | "asks">>;
}

/** Every file with this extension under a directory, skipping dot-prefixed segments. */
export function treeFiles(dir: string, ext: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(ext)) out.push(p);
    }
  };
  if (existsSync(dir) && statSync(dir).isDirectory()) walk(dir);
  return out.sort();
}

/** Whether an IRI is the base itself or sits below it — a path boundary, never a bare prefix. */
function underBase(iri: string, base: string): boolean {
  const b = base.replace(/\/+$/, "");
  return iri === b || iri.startsWith(`${b}/`) || iri.startsWith(`${b}#`);
}

/**
 * Ours: the context names our content context or binds a namespace we mint,
 * or the document's own `@id` is under one of the site's bases.
 */
export function isOurs(doc: unknown, bases: readonly string[] = []): boolean {
  if (doc === null || typeof doc !== "object") return false;
  const d = doc as { "@context"?: unknown; "@id"?: unknown };
  if (typeof d["@id"] === "string" && bases.some((b) => underBase(d["@id"] as string, b))) return true;
  if (d["@context"] === undefined) return false;
  const s = JSON.stringify(d["@context"]);
  return s.includes(CONTENT_CONTEXT_URL) || OWN_NAMESPACE_VALUES.some((ns) => s.includes(ns));
}

/**
 * The site's own address, from the instance declaration — `undefined` when the
 * instance declares none, which leaves only the context test.
 */
export function declaredBase(instanceRoot: string): string | undefined {
  return readDeclaration(instanceRoot)?.canonicalUrl;
}

/** A document that is only a context — nothing to expand, and not a failure. */
function contextOnly(doc: Record<string, unknown>): boolean {
  return Object.keys(doc).every((k) => k === "@context");
}

/**
 * A loader that never touches the network: a context URL under our published
 * base resolves to the file at the same path in the tree being verified, and
 * anything else is refused — a document that needs the network to be
 * understood is a finding, not something to fetch at deploy time.
 */
export function localLoader(dir: string) {
  const base = CONTENT_CONTEXT_URL.slice(0, CONTENT_CONTEXT_URL.indexOf("/ns/content/"));
  return async (url: string) => {
    const p = url.startsWith(`${base}/`) ? join(dir, url.slice(base.length + 1)) : undefined;
    // An EXTERNAL context we hold, pinned by sha256 (the `linked-data` voice,
    // `ld-no-context-fetched-at-run-time`): served from the copy, refused on
    // drift, never fetched. PROV-JSONLD's is the first (bean `9y9j`).
    if (url === PROV_JSONLD_CONTEXT_URL) {
      return { contextUrl: null, documentUrl: url, document: heldProvJsonldContext(resolve(import.meta.dir, "..", "..")) };
    }
    const fallback = url === CONTENT_CONTEXT_URL ? resolve(import.meta.dir, "..", "ns", "content", "v1.jsonld") : undefined;
    const file = p && existsSync(p) ? p : fallback;
    if (!file) throw new Error(`refused to fetch ${url}: not in the tree being verified`);
    return { contextUrl: null, documentUrl: url, document: JSON.parse(readFileSync(file, "utf-8")) };
  };
}

/** Expand one document; every warning a processor raises is a finding. */
export async function expandFindings(doc: object, loader: ReturnType<typeof localLoader>): Promise<string[]> {
  const out: string[] = [];
  try {
    await jsonld.expand(doc, {
      documentLoader: loader,
      eventHandler: ({ event }: { event: { code: string; message?: string; details?: Record<string, unknown> } }) => {
        const d = event.details ?? {};
        const what = (d["property"] ?? d["id"] ?? d["term"] ?? "") as string;
        out.push(`${event.code}${what ? ` (${String(what)})` : ""}`);
      },
    } as unknown as jsonld.Options.Expand);
  } catch (e) {
    out.push(`does not expand: ${(e as Error).message}`);
  }
  return out;
}

export const JSONLD_EXPAND: Verifier = {
  id: "jsonld-expand",
  asks:
    "Does every JSON-LD document of ours expand under a real processor with no warning — no " +
    "property dropped, no relative IRI, no context that fails to load?",
  async run(dir, ctx) {
    const loader = localLoader(dir);
    const findings: Finding[] = [];
    let checked = 0;
    let outOfScope = 0;
    for (const f of treeFiles(dir, ".jsonld")) {
      let doc: unknown;
      try {
        doc = JSON.parse(readFileSync(f, "utf-8"));
      } catch (e) {
        findings.push({ verifier: "jsonld-expand", file: relative(dir, f), detail: `not JSON: ${(e as Error).message}` });
        continue;
      }
      if (!isOurs(doc, ctx.bases)) {
        outOfScope += 1;
        continue;
      }
      if (contextOnly(doc as Record<string, unknown>)) continue;
      checked += 1;
      for (const detail of await expandFindings(doc as object, loader)) {
        findings.push({ verifier: "jsonld-expand", file: relative(dir, f), detail });
      }
    }
    return { checked, outOfScope, findings };
  },
};

/** The remote context URLs a document's `@context` names, in order. */
function remoteContexts(doc: Record<string, unknown>): string[] {
  const c = doc["@context"];
  return (Array.isArray(c) ? c : [c]).filter((x): x is string => typeof x === "string");
}

/** Whether a document's own `@context` carries an inline `@base`. */
function inlineBase(doc: Record<string, unknown>): boolean {
  const c = doc["@context"];
  return (Array.isArray(c) ? c : [c]).some((x) => x !== null && typeof x === "object" && "@base" in (x as object));
}

/**
 * The properties a held context makes OBJECT properties — every term it
 * coerces to `"@type": "@id"` or `"@vocab"`, expanded to its full IRI.
 *
 * Read from the contexts themselves, never from a list written here: the
 * `linked-data` voice's `ld-know-which-properties-are-object-properties` says
 * the vocabulary decides, and a held context IS that decision in the form a
 * processor applies. PROV-JSONLD's context coerces exactly PROV-O's object
 * properties (`agent`, `hadRole`, `hadPlan`, `used`, …); ours coerces the
 * terms whose value is a node.
 */
async function objectProperties(
  contextDoc: unknown,
  loader: ReturnType<typeof localLoader>,
): Promise<Set<string>> {
  const ctx = (contextDoc as { "@context"?: Record<string, unknown> })?.["@context"];
  const out = new Set<string>();
  if (!ctx || typeof ctx !== "object" || Array.isArray(ctx)) return out;
  for (const [term, def] of Object.entries(ctx)) {
    if (term.startsWith("@") || def === null || typeof def !== "object") continue;
    const t = (def as { "@type"?: unknown })["@type"];
    if (t !== "@id" && t !== "@vocab") continue;
    const probe = await jsonld.expand({ "@context": ctx, [term]: "urn:probe" } as object, {
      documentLoader: loader,
    } as unknown as jsonld.Options.Expand);
    for (const k of Object.keys((probe[0] ?? {}) as object)) if (!k.startsWith("@")) out.add(k);
  }
  return out;
}

/**
 * A marker no real value carries, prefixed to every EXPLICIT `{"@value": …}`
 * before expansion so that a literal the author declared can be told from one
 * a missing coercion produced. Expansion keeps a string value intact, so the
 * prefix survives into the expanded form and nowhere else.
 */
const DECLARED = "\u0000declared-literal\u0000";

/** A copy of `node` with every explicit `{"@value": string}` marked {@link DECLARED}. */
function markDeclared(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(markDeclared);
  if (node === null || typeof node !== "object") return node;
  const o = node as Record<string, unknown>;
  if (typeof o["@value"] === "string" && Object.keys(o).every((k) => k === "@value" || k === "@language" || k === "@type")) {
    return { ...o, "@value": DECLARED + o["@value"] };
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) out[k] = k === "@context" ? v : markDeclared(v);
  return out;
}

/**
 * The `linked-data` voice, mechanical half: a value under an OBJECT property
 * must expand to a link (`ld-object-property-is-a-link`), and a compact-IRI key
 * that misses its term's coercion (`ld-coercion-belongs-to-the-term`) is the
 * same defect seen from the source — both expand to `{"@value": …}` where a
 * node was meant, so one walk over the expanded graph catches both, and the
 * finding names the source key when it was a compact IRI.
 *
 * **Three states, as the voice requires.** A link passes. A literal the author
 * DECLARED — an explicit `{"@value": …}`, which is how `prov-jsonld.ts` writes
 * a value with no release address while its report carries the reason
 * (`ld-link-is-the-node-release-address`) — is counted, never a finding. A
 * literal nobody declared is a finding: that is the PROV-O report defect bean
 * `9y9j` measured in all 100 activities.
 *
 * Which properties are object properties is read from the held contexts each
 * document names (see {@link objectProperties}); a document naming no held
 * context has nothing to check against and is counted, not passed silently.
 */
export const JSONLD_OBJECT_LINKS: Verifier = {
  id: "jsonld-object-links",
  asks:
    "Does every value under an object property of ours expand to a link — or is it a literal the " +
    "author declared explicitly, because the node has no release address?",
  async run(dir, ctx) {
    const loader = localLoader(dir);
    const byContext = new Map<string, Set<string>>();
    const findings: Finding[] = [];
    let checked = 0;
    let outOfScope = 0;
    let declared = 0;
    for (const f of treeFiles(dir, ".jsonld")) {
      let doc: Record<string, unknown>;
      try {
        doc = JSON.parse(readFileSync(f, "utf-8")) as Record<string, unknown>;
      } catch {
        continue; // `jsonld-expand` reports it; one defect, one finding
      }
      if (!isOurs(doc, ctx.bases)) {
        outOfScope += 1;
        continue;
      }
      if (contextOnly(doc)) continue;
      const objProps = new Set<string>();
      for (const url of remoteContexts(doc)) {
        if (!byContext.has(url)) {
          let props = new Set<string>();
          try {
            props = await objectProperties((await loader(url)).document, loader);
          } catch {
            // an unheld context is `jsonld-expand`'s finding, not this one's
          }
          byContext.set(url, props);
        }
        for (const p of byContext.get(url)!) objProps.add(p);
      }
      checked += 1;
      if (objProps.size === 0) continue;
      let expanded: unknown;
      try {
        expanded = await jsonld.expand(markDeclared(doc) as object, {
          documentLoader: loader,
        } as unknown as jsonld.Options.Expand);
      } catch {
        continue; // does not expand: `jsonld-expand` says so
      }
      const compactKeys = new Set(JSON.stringify(doc).match(/"[A-Za-z][\w-]*:[A-Za-z][\w-]*"(?=\s*:)/g) ?? []);
      const walk = (node: unknown): void => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (node === null || typeof node !== "object") return;
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
          if (k.startsWith("@")) {
            if (k === "@graph" || k === "@list" || k === "@set" || k === "@reverse") walk(v);
            continue;
          }
          for (const x of Array.isArray(v) ? v : [v]) {
            const lit = x !== null && typeof x === "object" ? (x as Record<string, unknown>)["@value"] : undefined;
            if (objProps.has(k) && lit !== undefined) {
              if (typeof lit === "string" && lit.startsWith(DECLARED)) declared += 1;
              else {
                const local = k.replace(/^.*[#/]/, "");
                const viaCompact = [...compactKeys].some((c) => c.endsWith(`:${local}"`));
                findings.push({
                  verifier: "jsonld-object-links",
                  file: relative(dir, f),
                  detail:
                    `${k} is an object property but its value ${JSON.stringify(lit).slice(0, 60)} expands to a ` +
                    `literal` +
                    (viaCompact
                      ? " — the source key is a compact IRI, which does not inherit the term's coercion (ld-coercion-belongs-to-the-term)"
                      : " (ld-object-property-is-a-link); write the node's address, or an explicit {\"@value\"} with its reason recorded"),
                });
              }
            }
            walk(x);
          }
        }
      };
      walk(expanded);
    }
    return {
      checked,
      outOfScope,
      findings,
      ...(declared > 0 ? { note: `${declared} declared literal(s) under object properties — nodes with no release address, reasons carried by their reports` } : {}),
    };
  },
};

/**
 * `ld-no-base-in-a-remote-context`: JSON-LD 1.1 ignores `@base` in a context
 * referenced by URL, and jsonld.js applies it anyway — so a document of ours
 * that names a HELD remote context carrying `@base` and states none of its own
 * resolves its relative `@id`s only under that one processor. Bean `bh4q` gave
 * our documents a two-part context (the URL, then an inline `@base`); this is
 * what keeps a new emitter from dropping the second part.
 */
export const JSONLD_OWN_BASE: Verifier = {
  id: "jsonld-own-base",
  asks:
    "Does every document of ours that names a remote context carrying @base state its own @base " +
    "inline, rather than lean on one a conforming processor ignores?",
  async run(dir, ctx) {
    const loader = localLoader(dir);
    const carriesBase = new Map<string, boolean>();
    const findings: Finding[] = [];
    let checked = 0;
    let outOfScope = 0;
    for (const f of treeFiles(dir, ".jsonld")) {
      let doc: Record<string, unknown>;
      try {
        doc = JSON.parse(readFileSync(f, "utf-8")) as Record<string, unknown>;
      } catch {
        continue;
      }
      if (!isOurs(doc, ctx.bases)) {
        outOfScope += 1;
        continue;
      }
      if (contextOnly(doc)) continue;
      checked += 1;
      if (inlineBase(doc)) continue;
      for (const url of remoteContexts(doc)) {
        if (!carriesBase.has(url)) {
          let has = false;
          try {
            const c = ((await loader(url)).document as { "@context"?: unknown })["@context"];
            has = c !== null && typeof c === "object" && !Array.isArray(c) && "@base" in (c as object);
          } catch {
            // unheld: `jsonld-expand`'s finding
          }
          carriesBase.set(url, has);
        }
        if (carriesBase.get(url)) {
          findings.push({
            verifier: "jsonld-own-base",
            file: relative(dir, f),
            detail: `names ${url}, whose @base JSON-LD 1.1 ignores in a remote context, and states no @base of its own`,
          });
        }
      }
    }
    return { checked, outOfScope, findings };
  },
};

/**
 * Bean `uknu`: the theme renders `nav_footer_custom.html` twice, so 1,222
 * published pages carried `id="fa-nav-open"` twice while the source was
 * correct and every gate was green. #1213 fixed it and added
 * `check:duplicate-ids`, which runs on a PR's STAGING build — this runs the
 * same scanner on the build that DEPLOYS, so a duplicate that reaches `main`
 * blocks the release and raises the publication-manager alert instead of
 * going live. One scanner, two call sites.
 *
 * Every page in the tree is in scope. Unlike a JSON-LD document, which may be
 * someone else's data we carry, an HTML page here is one our site build wrote
 * and publishes under our URL.
 */
export const HTML_UNIQUE_IDS: Verifier = {
  id: "html-unique-ids",
  asks:
    "Does every built HTML page declare each id once — so every `<label for>`, `#fragment` link and " +
    "`aria-labelledby` reaches the one element it names?",
  async run(dir) {
    const findings: Finding[] = [];
    let checked = 0;
    for (const f of treeFiles(dir, ".html")) {
      checked += 1;
      for (const [id, n] of duplicateIds(readFileSync(f, "utf-8"))) {
        findings.push({ verifier: "html-unique-ids", file: relative(dir, f), detail: `duplicate id ${id} ×${n}` });
      }
    }
    return { checked, outOfScope: 0, findings };
  },
};

/** Where the just-the-docs theme writes the site's search index. */
export const SEARCH_INDEX_PATH = "assets/js/search-data.json";

/**
 * The page-coverage floor: indexed pages must be at least this share of the
 * pages that carry the theme's search box.
 *
 * **Basis: measured, then halved.** A local Jekyll build of this site on
 * 2026-09-23 indexed 1,347 distinct pages and 1,347 pages carried the box —
 * exactly one. The deployed tree adds pages mounted after Jekyll that may
 * carry the box without being in this index, so the floor is set to catch
 * what the bean asks for — an empty or truncated index — and not to fail a
 * release on that difference.
 */
export const SEARCH_COVERAGE_FLOOR = 0.5;

/**
 * The site search index is a DOWNSTREAM output (bean `fq5u`): Jekyll writes
 * it implicitly, nothing checked it, and an empty one would have shipped
 * green. The Tool node is `site-search-index`; this is the verifier its
 * declaration names.
 *
 * Asks, in order: present, parses as the theme's object of entries,
 * non-empty, every indexed page resolves to a file in the tree, and the
 * indexed pages are at least {@link SEARCH_COVERAGE_FLOOR} of the pages
 * showing a search box. A tree with no search box anywhere is `could not
 * tell` — nothing here says the site uses search at all.
 */
export const SEARCH_INDEX: Verifier = {
  id: "search-index",
  tool: "site-search-index",
  asks:
    "Is the site's search index present, parseable and non-empty, does every page it indexes exist, and does it " +
    "cover the pages that offer a search box?",
  async run(dir, ctx) {
    const id = "search-index";
    const boxPages = treeFiles(dir, ".html").filter((f) => readFileSync(f, "utf-8").includes('id="search-input"'));
    if (boxPages.length === 0) throw new Error("no page in the tree carries the theme's search box");
    const file = join(dir, SEARCH_INDEX_PATH);
    const at = SEARCH_INDEX_PATH;
    if (!existsSync(file)) return { checked: 1, outOfScope: 0, findings: [{ verifier: id, file: at, detail: `missing — ${boxPages.length} page(s) offer a search box that would search nothing` }] };
    let data: unknown;
    try {
      data = JSON.parse(readFileSync(file, "utf-8"));
    } catch (e) {
      return { checked: 1, outOfScope: 0, findings: [{ verifier: id, file: at, detail: `not JSON: ${(e as Error).message}` }] };
    }
    if (data === null || typeof data !== "object" || Array.isArray(data))
      return { checked: 1, outOfScope: 0, findings: [{ verifier: id, file: at, detail: "not an object of entries" }] };
    const entries = Object.values(data as Record<string, unknown>);
    // A borrowed index is the published one or a declared-empty `{}`; its
    // coverage is the published site's, not this tree's.
    if (ctx.searchIndex === "borrowed") return { checked: 1, outOfScope: 0, findings: [] };
    if (entries.length === 0) return { checked: 1, outOfScope: 0, findings: [{ verifier: id, file: at, detail: `empty — ${boxPages.length} page(s) offer a search box that finds nothing` }] };
    const pages = new Set<string>();
    for (const e of entries) {
      const rel = (e as { relUrl?: unknown })?.relUrl;
      if (typeof rel === "string") pages.add(rel.split("#")[0]!);
    }
    const findings: Finding[] = [];
    const resolves = (u: string) => {
      let rel: string;
      try {
        rel = decodeURIComponent(u.replace(/^\/+/, ""));
      } catch {
        return false;
      }
      const p = join(dir, rel);
      return [p, `${p}.html`, join(p, "index.html")].some((c) => existsSync(c) && statSync(c).isFile());
    };
    const dangling = [...pages].filter((u) => !resolves(u));
    for (const u of dangling.slice(0, 20)) findings.push({ verifier: id, file: at, detail: `indexes ${u}, which is not in the tree` });
    if (dangling.length > 20) findings.push({ verifier: id, file: at, detail: `…and ${dangling.length - 20} more indexed page(s) not in the tree` });
    if (pages.size < SEARCH_COVERAGE_FLOOR * boxPages.length)
      findings.push({ verifier: id, file: at, detail: `indexes ${pages.size} page(s) while ${boxPages.length} offer a search box — below the ${SEARCH_COVERAGE_FLOOR} floor, so the index is truncated or stale` });
    return { checked: 1, outOfScope: 0, findings };
  },
};

/**
 * The per-scope search indices `search-split.ts` cuts from the site index
 * (bean `m7mn`, issue #1972). A reader's search loads ONE scope instead of
 * the whole, so a scope that is missing, stale or overlapping is a search
 * that silently finds less — or finds pages twice — and nothing else would
 * notice.
 *
 * Asks, in order: when the site index is present, the manifest is too; its
 * `source.sha256` is the hash of the index actually in this tree (a stale
 * split of an older index is the failure this exists for — staging borrows
 * the published index, and must split THAT one); every scope file it names
 * parses to the stated number of entries; and the scopes PARTITION the index
 * — their counts sum to the source's and no entry key appears in two.
 *
 * A tree with no site index is out of scope here: `search-index` reports it.
 */
export const SEARCH_SCOPES: Verifier = {
  id: "search-scopes",
  tool: "site-search-scopes",
  asks:
    "Does the per-scope search manifest match the site index in this tree, and do its scope indices parse and " +
    "partition that index exactly?",
  async run(dir) {
    const id = "search-scopes";
    const source = join(dir, SEARCH_INDEX_PATH);
    if (!existsSync(source)) return { checked: 0, outOfScope: 1, findings: [] };
    const manifestAt = `${SCOPES_DIR}/manifest.json`;
    const mp = join(dir, manifestAt);
    if (!existsSync(mp)) {
      return { checked: 1, outOfScope: 0, findings: [{ verifier: id, file: manifestAt, detail: "missing — the site index was never split, so scoped search loads nothing" }] };
    }
    let manifest: SearchManifest;
    try {
      manifest = JSON.parse(readFileSync(mp, "utf-8")) as SearchManifest;
    } catch (e) {
      return { checked: 1, outOfScope: 0, findings: [{ verifier: id, file: manifestAt, detail: `not JSON: ${(e as Error).message}` }] };
    }
    const findings: Finding[] = [];
    const text = readFileSync(source, "utf-8");
    const hash = createHash("sha256").update(text).digest("hex");
    if (manifest.source?.sha256 !== hash) {
      findings.push({ verifier: id, file: manifestAt, detail: `split from a different index (manifest ${String(manifest.source?.sha256).slice(0, 12)}, tree ${hash.slice(0, 12)}) — re-run search-split on this tree` });
    }
    const sourceKeys = Object.keys(JSON.parse(text) as Record<string, unknown>);
    const seen = new Map<string, string>();
    let total = 0;
    for (const s of manifest.scopes ?? []) {
      let keys: string[];
      try {
        keys = Object.keys(JSON.parse(readFileSync(join(dir, s.path), "utf-8")) as Record<string, unknown>);
      } catch (e) {
        findings.push({ verifier: id, file: s.path, detail: `scope ${s.id} unreadable: ${(e as Error).message.slice(0, 120)}` });
        continue;
      }
      if (keys.length !== s.entries) findings.push({ verifier: id, file: s.path, detail: `scope ${s.id} holds ${keys.length} entries, the manifest says ${s.entries}` });
      total += keys.length;
      for (const k of keys) {
        const other = seen.get(k);
        if (other !== undefined) findings.push({ verifier: id, file: s.path, detail: `entry ${k} is in both ${other} and ${s.id}` });
        else seen.set(k, s.id);
      }
    }
    if (total !== sourceKeys.length) {
      findings.push({ verifier: id, file: manifestAt, detail: `scopes hold ${total} entries, the site index ${sourceKeys.length} — they do not partition it` });
    }
    return { checked: (manifest.scopes ?? []).length + 1, outOfScope: 0, findings: findings.slice(0, 40) };
  },
};

/** The set. Add a verifier here; nothing else changes. */
export const VERIFIERS: readonly Verifier[] = [JSONLD_EXPAND, JSONLD_OBJECT_LINKS, JSONLD_OWN_BASE, HTML_UNIQUE_IDS, SEARCH_INDEX, SEARCH_SCOPES];

export async function verify(
  dir: string,
  verifiers: readonly Verifier[] = VERIFIERS,
  ctx: VerifyContext = { bases: [] },
): Promise<{
  results: VerifierResult[];
  exit: 0 | 1 | 2;
}> {
  const results: VerifierResult[] = [];
  for (const v of verifiers) {
    try {
      const r = await v.run(dir, ctx);
      results.push({ id: v.id, asks: v.asks, ...r, ...(r.checked === 0 ? { couldNotTell: "no in-scope document found" } : {}) });
    } catch (e) {
      results.push({ id: v.id, asks: v.asks, checked: 0, outOfScope: 0, findings: [], couldNotTell: (e as Error).message });
    }
  }
  const exit = results.some((r) => r.couldNotTell) ? 2 : results.some((r) => r.findings.length > 0) ? 1 : 0;
  return { results, exit };
}

/** The markdown the alert carries — what failed, where, and how to reproduce. */
export function reportMarkdown(dir: string, results: readonly VerifierResult[], bases: readonly string[] = []): string {
  const scope = bases.length ? `; a document whose \`@id\` is under ${bases.map((b) => `\`${b}\``).join(", ")} is ours` : "";
  const lines = [`Verified \`${dir}\` before deployment${scope}:`, ""];
  for (const r of results) {
    const state = r.couldNotTell ? `could not tell — ${r.couldNotTell}` : r.findings.length ? `${r.findings.length} finding(s)` : "pass";
    lines.push(`- **${r.id}**: ${state} — ${r.checked} document(s) checked, ${r.outOfScope} out of scope (not ours)`);
    if (r.note) lines.push(`  - note: ${r.note}`);
    for (const f of r.findings.slice(0, 20)) lines.push(`  - \`${f.file}\`: ${f.detail}`);
    if (r.findings.length > 20) lines.push(`  - …and ${r.findings.length - 20} more`);
  }
  lines.push("", "Reproduce: `bun run publish:verify -- --dir <built site>`.");
  return lines.join("\n");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const arg = (f: string) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : undefined);
  const dir = resolve(arg("--dir") ?? "_site");
  // `--base` may repeat (a staging build mints under its preview address as
  // well); with none given, the instance's declared `canonicalUrl` is the base.
  const given = argv.flatMap((a, i) => (a === "--base" && argv[i + 1] ? [argv[i + 1]!] : []));
  const declared = declaredBase(resolve(arg("--instance") ?? resolve(import.meta.dir, "..")));
  const bases = given.length > 0 ? given : declared ? [declared] : [];
  const searchIndex = arg("--search-index") === "borrowed" ? "borrowed" : "built";
  const { results, exit } = await verify(dir, VERIFIERS, { bases, searchIndex });
  const md = reportMarkdown(relative(process.cwd(), dir) || ".", results, bases);
  console.log(md);
  const report = arg("--report");
  if (report) writeFileSync(report, `${md}\n`);
  process.exit(exit);
}
