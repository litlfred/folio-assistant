/**
 * search-split.ts — split the site's one search index into one index per
 * SCOPE, plus a manifest naming them. Issue #1972, step A; bean `m7mn`.
 *
 * ## Why
 *
 * just-the-docs writes ONE `assets/js/search-data.json` for the whole site.
 * Measured 2026-10-03 on a local build: 12,040 entries, 13.7 MB raw, and the
 * lunr index built from it costs ~4.7 s of main-thread script and ~315 MB of
 * heap (bean `2tfy`, which moved that cost from every page load to the first
 * search). A reader searching a smart-trust page still pays for all of it —
 * including 7.9 MB of platform pages and 2.5 MB of translations they are not
 * reading. Split by where a page lives, a smart-trust page's own scope is
 * 1.5 MB.
 *
 * ## What a scope is — derived, never listed
 *
 * From the page's site-relative URL and two DECLARED facts, never a
 * hand-kept list:
 *
 *   - an INSTANCE scope when the first path segment is a declared instance's
 *     name (`/<instance>/…`), or the second is and the first is not (`/<kind>/
 *     <instance>/…`, the kind route `mount-instance-docs.ts` also publishes);
 *   - a LOCALE scope when the first segment is one of the platform's declared
 *     target locales (`translation-index.ts`);
 *   - the PLATFORM scope otherwise — except that a platform SECTION (a page's
 *     first path segment, below the root) whose entries exceed
 *     {@link SECTION_BUDGET_BYTES} becomes a `section-<name>` scope of its own
 *     (bean `mm2n`): `/reference/` alone was half the platform's 7.8 MB.
 *
 * Every entry lands in exactly one scope, so the scopes partition the index:
 * their entry counts sum to the source's, which `publish-verify`'s
 * `search-scopes` verifier checks on every published and staged tree.
 *
 * ## What it does not change
 *
 * `search-data.json` itself stays exactly as the theme writes it — it is the
 * published artefact staging previews borrow (bean `eof6`), and the
 * `search-index` verifier judges it as before. This writes NEXT to it:
 * `assets/js/search/manifest.json` and one `assets/js/search/<scope>.json` per
 * scope, each in the theme's own entry shape so the theme's loader reads any
 * of them unchanged. Entry keys are kept from the source, so an entry's id is
 * the same in its scope as in the whole.
 *
 * ## Prebuilt indexes — bean `lrzn`
 *
 * A scope over {@link PREBUILT_TOKEN_BUDGET} also gets `<scope>.idx.json`:
 * the lunr index the theme would build from it, serialized, and named in the
 * manifest's `index`. The client LOADS it instead of building one. Measured
 * 2026-10-03 in Chromium on a local build, first search: `section-reference`
 * 1,747 → 342 ms of script, smart-trust 484 → 95 ms — paid for with the
 * index's bytes, downloaded on top of the entries (0.4–2.9 MB gzipped).
 *
 * Usage:
 *   bun run cat-harness/scripts/search-split.ts --dir <built site>          # write
 *   bun run cat-harness/scripts/search-split.ts --dir <built site> --check  # verify only
 *
 * @module scripts/search-split
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

// @ts-expect-error -- lunr ships no types; only `lunr()`, `tokenizer` and `Index.load` are used.
import lunr from "lunr";

import { instanceRootsIn, readDeclaration } from "../schemas/cat-harness.js";
import { targetLocales } from "../content/pipeline/translation-index.ts";

/** Where the theme writes the whole index, relative to the site root. */
export const SOURCE_PATH = "assets/js/search-data.json";
/** Where the scoped indices and their manifest go, relative to the site root. */
export const SCOPES_DIR = "assets/js/search";
export const MANIFEST_SCHEMA = "folio-search-manifest/v1";

/** One entry in the theme's index. Only `relUrl` is read; the rest is carried as is. */
export interface SearchEntry {
  relUrl?: string;
  [k: string]: unknown;
}

export type ScopeKind = "instance" | "locale" | "section" | "platform";

export interface Scope {
  id: string;
  kind: ScopeKind;
}

export interface ManifestScope extends Scope {
  /** Site-relative path of this scope's index. */
  path: string;
  entries: number;
  bytes: number;
  /**
   * A lunr index already built from this scope's entries (bean `lrzn`),
   * present only when the scope is over {@link PREBUILT_TOKEN_BUDGET}. The
   * client loads it with `lunr.Index.load` instead of building one.
   */
  index?: { path: string; bytes: number };
}

/**
 * A searchable thing that is NOT a lunr scope: the identifier lookup an
 * instance publishes under `<site>/id-lookup/<id>/` (bean `1br0`, issue
 * #1972 step 3). The search box links to it rather than loading it — the
 * owner's ruling on `4pm8` keeps it a page of its own.
 */
export interface RemoteScope {
  id: string;
  kind: "id-lookup";
  /** Site-relative URL of the lookup page, opened on this index. */
  href: string;
  /** The index's own `entryCount`. */
  entries: number;
}

export interface SearchManifest {
  $schema: typeof MANIFEST_SCHEMA;
  /** The whole index the scopes were cut from — what "search everywhere" loads. */
  source: { path: string; sha256: string; entries: number; bytes: number };
  scopes: ManifestScope[];
  /** Absent when the tree publishes no identifier lookup. */
  remote?: RemoteScope[];
}

/** Where `publish-id-lookup.ts` puts the lookup client and its indexes, under the site root. */
export const ID_LOOKUP_DIR = "id-lookup";

/**
 * Every identifier-lookup index PUBLISHED in a built site: a directory under
 * `id-lookup/` holding a `manifest.json`, beside the client page. Read from
 * the tree rather than from the declarations, so the manifest names exactly
 * what a reader can open — a declared index the build did not publish would
 * be a link to "could not be read".
 */
export function publishedLookups(site: string): RemoteScope[] {
  const root = join(site, ID_LOOKUP_DIR);
  if (!existsSync(join(root, "index.html"))) return [];
  const out: RemoteScope[] = [];
  for (const name of readdirSync(root).sort()) {
    const m = join(root, name, "manifest.json");
    if (!existsSync(m)) continue;
    let entries = 0;
    try {
      entries = Number((JSON.parse(readFileSync(m, "utf-8")) as { entryCount?: unknown }).entryCount) || 0;
    } catch {
      continue; // unreadable: not something to link a reader to
    }
    out.push({ id: name, kind: "id-lookup", href: `${ID_LOOKUP_DIR}/?index=${encodeURIComponent(name)}/`, entries });
  }
  return out;
}

/** The id the platform scope uses. Not a possible instance or locale name, so it cannot collide. */
export const PLATFORM = "_platform";

/**
 * A platform SECTION — the first path segment of a page below the site root —
 * whose entries exceed this many bytes becomes a scope of its own (bean
 * `mm2n`, issue #1972).
 *
 * **Basis: measured.** First-search script cost runs at ~0.33 s per MB of
 * scope (#1988: smart-trust's 1.5 MB, 504 ms), so a section under 512 KiB
 * costs under ~0.17 s — not worth a scope, and not worth the reader having to
 * widen to find it. Measured 2026-10-03, 512 KiB cuts the 7.82 MB platform
 * scope into five section scopes — `reference` 3.85 MB, `glossary` 0.97,
 * `uml` 0.91, `processes` 0.66, `proposals` 0.53 — and a 0.90 MB remainder.
 * (`proposals` crosses only because a section's own index page counts as
 * part of it; a budget this close to a section's size is a reason to read
 * the manifest, never to restate the list.)
 *
 * A BUDGET rather than a list because the site's sections are pages rendered
 * inside the one declared `docs` graph, not graph directories of their own:
 * there is no declaration to read them from, and a hand list of names is a
 * second place to keep the site's layout. Which sections cross it is a fact
 * about the content, so the manifest records them and the client reads them
 * from there.
 */
export const SECTION_BUDGET_BYTES = 512 * 1024;

/**
 * The scope a page belongs to, from its site-relative URL (the theme's
 * `relUrl`: no base URL, leading slash).
 */
export function scopeOf(relUrl: string, instances: ReadonlySet<string>, locales: ReadonlySet<string>): Scope {
  const [first = "", second = ""] = relUrl.split("#")[0]!.split("/").filter(Boolean);
  if (instances.has(first)) return { id: first, kind: "instance" };
  if (locales.has(first)) return { id: `locale-${first}`, kind: "locale" };
  if (instances.has(second)) return { id: second, kind: "instance" };
  return { id: PLATFORM, kind: "platform" };
}

/**
 * The platform section a page path belongs to: its first segment, when the
 * page is BELOW it (`/reference/skills.html`) or is its index (`/reference/`).
 * A page at the root (`/`, `/getting-started.html`) belongs to none. The
 * client's `scopeForPage` applies the same rule to `location.pathname`.
 */
export function sectionOfPath(path: string): string | undefined {
  const seg = path.split("/").filter(Boolean);
  if (seg.length > 1) return seg[0];
  if (seg.length === 1 && path.endsWith("/")) return seg[0];
  return undefined;
}

/**
 * Partition the index by scope. Keys are kept, so an entry's id is the same
 * in its scope as in the whole; every entry lands in exactly one scope.
 */
export function split(
  index: Readonly<Record<string, SearchEntry>>,
  instances: ReadonlySet<string>,
  locales: ReadonlySet<string>,
  sectionBudget: number = SECTION_BUDGET_BYTES,
): Map<string, { scope: Scope; entries: Record<string, SearchEntry> }> {
  const out = new Map<string, { scope: Scope; entries: Record<string, SearchEntry> }>();
  const put = (scope: Scope, key: string, entry: SearchEntry) => {
    let bucket = out.get(scope.id);
    if (!bucket) out.set(scope.id, (bucket = { scope, entries: {} }));
    bucket.entries[key] = entry;
  };
  // The platform's entries wait until every section's size is known.
  const platform: [string, SearchEntry][] = [];
  for (const [key, entry] of Object.entries(index)) {
    const scope = scopeOf(typeof entry.relUrl === "string" ? entry.relUrl : "", instances, locales);
    if (scope.kind === "platform") platform.push([key, entry]);
    else put(scope, key, entry);
  }
  const sectionOf = (entry: SearchEntry): string | undefined =>
    sectionOfPath((typeof entry.relUrl === "string" ? entry.relUrl : "").split("#")[0]!);
  const bytes = new Map<string, number>();
  for (const [, entry] of platform) {
    const sec = sectionOf(entry);
    if (sec !== undefined) bytes.set(sec, (bytes.get(sec) ?? 0) + Buffer.byteLength(JSON.stringify(entry)));
  }
  for (const [key, entry] of platform) {
    const sec = sectionOf(entry);
    if (sec !== undefined && (bytes.get(sec) ?? 0) > sectionBudget) put({ id: `section-${sec}`, kind: "section" }, key, entry);
    else put({ id: PLATFORM, kind: "platform" }, key, entry);
  }
  return out;
}

/**
 * A scope whose entries tokenize to more than this many tokens is published
 * with its lunr index PREBUILT (bean `lrzn`, issue #1972): `<scope>.idx.json`
 * beside `<scope>.json`, named in the manifest.
 *
 * **Basis: measured, 2026-10-03, Node, lunr 2.3.9 on the built site.**
 * Building costs ~3–5 µs per token; loading a serialized index is 5–8×
 * faster (`section-reference` 2,593 ms → 546 ms, `smart-trust` 683 → 82) —
 * but the index is 2–3× the entries' gzipped size and is downloaded ON TOP
 * of them, since results are rendered from the entries. Under ~128 Ki tokens
 * the build is ~0.4–0.6 s, comparable to fetching the extra bytes on a slow
 * link, so a small scope builds as before. On that build the budget prebuilt
 * five scopes — `section-reference`, `smart-immunizations`, `_platform`,
 * `smart-trust`, `section-glossary` — and the owner chose "big scopes only".
 *
 * TOKENS rather than milliseconds because the output must be the same bytes
 * for the same index (`--check`, and the hash `search-scopes` verifies); a
 * timing is not. Which scopes cross it is a fact about the content: read the
 * manifest, never this list.
 */
export const PREBUILT_TOKEN_BUDGET = 128 * 1024;

/**
 * The theme's tokenizer separator — just-the-docs' default, which this site
 * does not override (`_config.yml` sets no `search.tokenizer_separator`). The
 * prebuilt index must tokenize exactly as the browser would, or a term the
 * reader types is not the term the index holds.
 */
export const TOKENIZER_SEPARATOR = /[\s\-/]+/;

interface Lunr {
  (config: (this: LunrBuilder) => void): { toJSON(): unknown };
  tokenizer: ((s: unknown) => unknown[]) & { separator: RegExp };
}
interface LunrBuilder {
  ref(f: string): void;
  field(f: string, attrs?: { boost: number }): void;
  metadataWhitelist: string[];
  add(doc: Record<string, unknown>): void;
}
const L = lunr as Lunr;

/** How many tokens the theme's index would hold for these entries. */
export function tokenCount(entries: Readonly<Record<string, SearchEntry>>): number {
  L.tokenizer.separator = TOKENIZER_SEPARATOR;
  let n = 0;
  for (const e of Object.values(entries)) {
    for (const f of ["title", "content", "relUrl"] as const) n += L.tokenizer(e[f]).length;
  }
  return n;
}

/**
 * The lunr index the theme's `buildSearchIndex` would build from these
 * entries — same ref, fields, boosts, separator and metadata whitelist, docs
 * added in the same order (`for (var i in docs)`) — serialized. Keep the two
 * in step: the theme's copy is in `docs/assets/js/just-the-docs.js`.
 */
export function buildIndex(entries: Readonly<Record<string, SearchEntry>>): unknown {
  L.tokenizer.separator = TOKENIZER_SEPARATOR;
  return L(function () {
    this.ref("id");
    this.field("title", { boost: 200 });
    this.field("content", { boost: 2 });
    this.field("relUrl");
    this.metadataWhitelist = ["position"];
    for (const [id, e] of Object.entries(entries)) {
      this.add({ id, title: e.title, content: e.content, relUrl: e.relUrl });
    }
  }).toJSON();
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/**
 * Every file the split writes, keyed by site-relative path, manifest last.
 * Deterministic: scopes are ordered by id and each body is the source's own
 * entries in the source's order, so the same index always yields the same bytes.
 */
export function render(
  sourceText: string,
  instances: ReadonlySet<string>,
  locales: ReadonlySet<string>,
  sectionBudget: number = SECTION_BUDGET_BYTES,
  remote: readonly RemoteScope[] = [],
  prebuiltBudget: number = PREBUILT_TOKEN_BUDGET,
): Map<string, string> {
  const index = JSON.parse(sourceText) as Record<string, SearchEntry>;
  const files = new Map<string, string>();
  const scopes: ManifestScope[] = [];
  const parts = [...split(index, instances, locales, sectionBudget).values()].sort((a, b) => a.scope.id.localeCompare(b.scope.id));
  for (const { scope, entries } of parts) {
    const path = `${SCOPES_DIR}/${scope.id}.json`;
    const body = JSON.stringify(entries);
    files.set(path, body);
    const m: ManifestScope = { ...scope, path, entries: Object.keys(entries).length, bytes: Buffer.byteLength(body) };
    if (tokenCount(entries) > prebuiltBudget) {
      const idxPath = `${SCOPES_DIR}/${scope.id}.idx.json`;
      const idxBody = JSON.stringify(buildIndex(entries));
      files.set(idxPath, idxBody);
      m.index = { path: idxPath, bytes: Buffer.byteLength(idxBody) };
    }
    scopes.push(m);
  }
  const manifest: SearchManifest = {
    $schema: MANIFEST_SCHEMA,
    source: {
      path: SOURCE_PATH,
      sha256: sha256(sourceText),
      entries: Object.keys(index).length,
      bytes: Buffer.byteLength(sourceText),
    },
    scopes,
    ...(remote.length > 0 ? { remote: [...remote] } : {}),
  };
  files.set(`${SCOPES_DIR}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
  return files;
}

/** The declared instance names in this checkout: each declaration's `name`, else its directory's. */
export function declaredInstanceNames(repo: string): Set<string> {
  const names = new Set<string>();
  for (const root of instanceRootsIn(repo)) {
    let name: string | undefined;
    try {
      name = readDeclaration(root)?.name;
    } catch {
      name = undefined;
    }
    const n = name ?? basename(root);
    // The checkout-root instance has no route of its own under the site.
    if (resolve(root) !== resolve(repo)) names.add(n);
  }
  return names;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const at = args.indexOf("--dir");
  if (at < 0 || !args[at + 1]) {
    console.error("usage: search-split.ts --dir <built site> [--check]");
    process.exit(2);
  }
  const dir = resolve(args[at + 1]!);
  const check = args.includes("--check");
  const source = join(dir, SOURCE_PATH);
  if (!existsSync(source)) {
    console.error(`search-split: ${SOURCE_PATH} is not in ${dir} — nothing to split`);
    process.exit(1);
  }
  const instanceRoot = resolve(import.meta.dir, "..");
  const repo = resolve(instanceRoot, "..");
  const files = render(
    readFileSync(source, "utf-8"),
    declaredInstanceNames(repo),
    new Set(targetLocales(instanceRoot)),
    SECTION_BUDGET_BYTES,
    publishedLookups(dir),
  );
  let stale = 0;
  for (const [rel, body] of files) {
    const p = join(dir, rel);
    if (check) {
      if (!existsSync(p) || readFileSync(p, "utf-8") !== body) {
        console.error(`  ✗ ${rel} is missing or stale`);
        stale++;
      }
      continue;
    }
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, body);
  }
  const manifest = JSON.parse(files.get(`${SCOPES_DIR}/manifest.json`)!) as SearchManifest;
  for (const s of manifest.scopes) {
    const idx = s.index ? `  + prebuilt index ${(s.index.bytes / 1e6).toFixed(2)} MB` : "";
    console.log(`  ${s.kind.padEnd(8)} ${s.id.padEnd(24)} ${String(s.entries).padStart(6)} entries  ${(s.bytes / 1e6).toFixed(2)} MB${idx}`);
  }
  for (const r of manifest.remote ?? []) {
    console.log(`  remote   ${r.id.padEnd(24)} ${String(r.entries).padStart(6)} entries  → ${r.href}`);
  }
  console.log(
    `${manifest.scopes.length} scope(s) from ${manifest.source.entries} entries (${(manifest.source.bytes / 1e6).toFixed(2)} MB)` +
      (check ? (stale ? ` — ${stale} file(s) stale` : " — current") : ` → ${SCOPES_DIR}/`),
  );
  process.exit(check && stale > 0 ? 1 : 0);
}
