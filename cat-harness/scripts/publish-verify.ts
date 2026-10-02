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
 * serves the published index or a declared-empty one.
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
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import jsonld from "jsonld";

import { CONTENT_CONTEXT_URL } from "../schemas/jsonld";
import { readDeclaration } from "../schemas/cat-harness";
import { OWN_NAMESPACE_VALUES } from "../schemas/namespaces";
import { heldProvJsonldContext, PROV_JSONLD_CONTEXT_URL } from "../schemas/prov-jsonld.ts";
import { duplicateIds } from "./check-duplicate-ids";

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

/** The set. Add a verifier here; nothing else changes. */
export const VERIFIERS: readonly Verifier[] = [JSONLD_EXPAND, HTML_UNIQUE_IDS, SEARCH_INDEX];

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
