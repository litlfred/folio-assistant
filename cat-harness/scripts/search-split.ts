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
 * Usage:
 *   bun run cat-harness/scripts/search-split.ts --dir <built site>          # write
 *   bun run cat-harness/scripts/search-split.ts --dir <built site> --check  # verify only
 *
 * @module scripts/search-split
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

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
}

export interface SearchManifest {
  $schema: typeof MANIFEST_SCHEMA;
  /** The whole index the scopes were cut from — what "search everywhere" loads. */
  source: { path: string; sha256: string; entries: number; bytes: number };
  scopes: ManifestScope[];
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
): Map<string, string> {
  const index = JSON.parse(sourceText) as Record<string, SearchEntry>;
  const files = new Map<string, string>();
  const scopes: ManifestScope[] = [];
  const parts = [...split(index, instances, locales, sectionBudget).values()].sort((a, b) => a.scope.id.localeCompare(b.scope.id));
  for (const { scope, entries } of parts) {
    const path = `${SCOPES_DIR}/${scope.id}.json`;
    const body = JSON.stringify(entries);
    files.set(path, body);
    scopes.push({ ...scope, path, entries: Object.keys(entries).length, bytes: Buffer.byteLength(body) });
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
  const files = render(readFileSync(source, "utf-8"), declaredInstanceNames(repo), new Set(targetLocales(instanceRoot)));
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
    console.log(`  ${s.kind.padEnd(8)} ${s.id.padEnd(24)} ${String(s.entries).padStart(6)} entries  ${(s.bytes / 1e6).toFixed(2)} MB`);
  }
  console.log(
    `${manifest.scopes.length} scope(s) from ${manifest.source.entries} entries (${(manifest.source.bytes / 1e6).toFixed(2)} MB)` +
      (check ? (stale ? ` — ${stale} file(s) stale` : " — current") : ` → ${SCOPES_DIR}/`),
  );
  process.exit(check && stale > 0 ? 1 : 0);
}
