/**
 * The harness data a FOLIO's own site serves, scoped to that folio (#2263).
 *
 * Owner, 2026-10-06, on https://litlfred.github.io/smart-trust/:
 *
 * > the beans and todos badges seems to be countts from folio-assistant and
 * > not litlfred/smart-trust as expected. links to beans and todos dont work.
 * > why not? fix process and skills.
 *
 * ## What went wrong
 *
 * An IG repository's own site (`fhir-harness/templates/ig-repo-site/
 * folio-site.yml`) is built inside the platform's chrome: `compose-docs.ts
 * --shell` copies the platform's `_data/` and `assets/`. Two of those are not
 * chrome at all — they are PROJECTIONS OF THE PLATFORM'S OWN GRAPHS:
 *
 * - `_data/harness.json` — the tiles (with the platform's baked counts: beans
 *   916, todos 3), the navbar icon row, the rail's folders and scopes, the
 *   harness rows, the site's title. Every path in it is ROOT-relative to the
 *   PLATFORM's site (`/beans/`), so on `/smart-trust/` it resolves to
 *   `/smart-trust/beans/`, which does not exist.
 * - `assets/<graph>/count.json` and `index.json` — the platform's bean and
 *   todo indexes, which the icon row's badges fetch from the page's OWN site.
 *   So smart-trust's rail showed folio-assistant's 537 open beans.
 *
 * `_includes/generated/` was already blanked in a shell for the same reason
 * (#2235 F1); these two were the same kind of thing and were not.
 *
 * ## The rule this applies
 *
 * **A page's tiles describe the instance whose site the page is on.**
 *
 * - A tile, icon or folder over a graph the FOLIO declares stays, and resolves
 *   on the folio's own site (`/<instance>/x` → `/x`).
 * - A tile over a **`state`** graph the folio does not declare (beans, todos,
 *   QA, health, uploads …) is NOT borrowed: no link and no count. State is a
 *   fact about one instance's work, and another instance's number is not this
 *   folio's — `zero` would be a lie too, because the folio has not said
 *   (`schemas/tile-count.ts`: absent is a third state). The icon row says why
 *   in words (`harness-tiles` §"An inert row SAYS why").
 * - A tile over the PLATFORM's content, context or derived graphs (skills,
 *   processes, tools, schemas, docs …) is re-based to the platform's
 *   published site, absolute, with its qualifier SHOWN so it reads as the
 *   platform's — and its count dropped, because a count beside another
 *   site's link is still another instance's number on this page.
 * - A kind this module cannot classify is treated as state: the
 *   conservative direction, since a missing link is visible and a wrong
 *   number is not.
 *
 * **No root-relative path survives.** Every href leaves here either
 * absolute on the platform, or as a path inside the folio's own root.
 *
 * @module scripts/lib/foreign-site-scope
 */
import { readDeclaration } from "../../schemas/cat-harness.js";
import { defaultGraphTypologies } from "../../schemas/graph-typology-registry.ts";
import { instanceRootsIn } from "../../schemas/instance-roots.ts";

/** What the scoping needs to know about the site and the declarations. */
export interface ForeignScope {
  /** The folio instance whose site this is, or undefined when the caller cannot say. */
  instance?: string;
  /** The platform's published root, no trailing slash: `https://litlfred.github.io/folio-assistant`. */
  platformBase: string;
  /** The graph kinds the folio ITSELF declares. Empty when it declares none or is unknown. */
  ownKinds: ReadonlySet<string>;
  /** A directory id's declared kinds, across every declaration the platform holds; undefined when unknown. */
  kindsOf: (directoryId: string) => readonly string[] | undefined;
  /** Which layer a kind holds (`content`, `context`, `state`, `derived`); undefined when the kind is unknown. */
  holdsOf: (kind: string) => string | undefined;
  /** The site's own title — what its header and home row say. */
  title?: string;
}

type Json = Record<string, unknown>;

const isAbsoluteUrl = (p: string): boolean => /^[a-z][a-z0-9+.-]*:/i.test(p) || p.startsWith("//");

/**
 * Where a site-absolute path goes on a FOLIO's site: inside the folio's own
 * root when it is under `/<instance>/`, else on the platform's site.
 * Absolute URLs and non-root paths (`#x`, `x.html`) pass through.
 */
export function siteHref(p: string, scope: Pick<ForeignScope, "instance" | "platformBase">): string {
  if (isAbsoluteUrl(p) || !p.startsWith("/")) return p;
  if (scope.instance) {
    const own = `/${scope.instance}/`;
    if (p === own.slice(0, -1) || p === own) return "/";
    if (p.startsWith(own)) return `/${p.slice(own.length)}`;
  }
  return `${scope.platformBase}${p}`;
}

/** Is `p` a path inside the folio's own root (`/<instance>/…`)? */
export function isOwnPath(p: string, scope: Pick<ForeignScope, "instance">): boolean {
  if (!scope.instance) return false;
  const own = `/${scope.instance}/`;
  return p === own.slice(0, -1) || p.startsWith(own);
}

/**
 * Is a graph of these kinds one a folio's site must not borrow from another
 * instance? A STATE graph is a fact about one instance's work; a kind this
 * module cannot classify is treated the same way, the conservative direction.
 * Ownership is decided by WHERE the link points (`isOwnPath`), never by the
 * folio declaring a kind of the same name: smart-trust declares a `qa`
 * directory, and the platform's QA tile is still the platform's QA.
 */
export function isStateLike(kinds: readonly string[] | undefined, scope: Pick<ForeignScope, "holdsOf">): boolean {
  if (!kinds || kinds.length === 0) return true;
  return kinds.some((k) => {
    const layer = scope.holdsOf(k);
    return layer === undefined || layer === "state";
  });
}

/** The words an inert slot says, so absence is stated rather than drawn. */
export function absentNote(kind: string, scope: ForeignScope): string {
  const who = scope.instance ?? "this site";
  return scope.ownKinds.has(kind) ? `${who}'s ${kind} graph is not published on this site` : `${who} declares no ${kind} graph`;
}

/** One link on a folio's site: its own (resolved here), the platform's (absolute), or none, with why. */
export function scopeLink(
  path: string,
  kinds: readonly string[] | undefined,
  scope: ForeignScope,
): { href: string; own: boolean } | { note: string } {
  if (isAbsoluteUrl(path) || !path.startsWith("/")) return { href: path, own: false };
  if (isOwnPath(path, scope)) return { href: siteHref(path, scope), own: true };
  if (isStateLike(kinds, scope)) return { note: absentNote(kinds?.[0] ?? "this", scope) };
  return { href: siteHref(path, scope), own: false };
}

interface Tile extends Json {
  id: string;
  directory: string;
  href?: string;
  count?: number;
  unit?: string;
  qualifier?: string;
  showQualifier?: true;
}

/**
 * The graph tiles, scoped. An own tile keeps its count. A borrowed one loses
 * it, and shows its qualifier so it reads as the platform's. A state tile
 * that is not the folio's loses its link, and the client draws no tile
 * without one (`pb04`).
 */
export function scopeTiles(tiles: readonly Tile[], scope: ForeignScope): Tile[] {
  return tiles.map((t) => {
    const { href, count: _c, unit: _u, showQualifier: _s, ...rest } = t;
    if (!href) return rest as Tile;
    const l = scopeLink(href, scope.kindsOf(t.directory), scope);
    if ("note" in l) return rest as Tile;
    if (l.own) return { ...t, href: l.href };
    return { ...rest, href: l.href, ...(t.qualifier ? { showQualifier: true as const } : {}) } as Tile;
  });
}

interface NavbarRow extends Json {
  icons?: string[];
  hrefs?: Record<string, string>;
  notes?: Record<string, string>;
  folders?: Json[];
}

/**
 * The navbar icon row and its folders, scoped. An icon id names its kind
 * (`todos`, `beans`, `fsh-guts`); a folder carries `kind`. A slot with no
 * link keeps its place and SAYS why (`harness-tiles` §"An inert row SAYS
 * why"), so "where are smart-trust's beans" is answered rather than blank.
 */
export function scopeNavbarRow(row: unknown, scope: ForeignScope): unknown {
  if (!row || typeof row !== "object") return row;
  const r = row as NavbarRow;
  const hrefs: Record<string, string> = {};
  const notes: Record<string, string> = { ...(r.notes ?? {}) };
  for (const [id, href] of Object.entries(r.hrefs ?? {})) {
    const l = scopeLink(href, [id], scope);
    if ("note" in l) notes[id] = l.note;
    else hrefs[id] = l.href;
  }
  const folders = Array.isArray(r.folders)
    ? r.folders.map((f) => {
        const { path, ...rest } = f;
        if (typeof path !== "string") return f;
        const l = scopeLink(path, typeof f.kind === "string" ? [f.kind] : undefined, scope);
        return "note" in l ? { ...rest, note: l.note } : { ...rest, path: l.href };
      })
    : r.folders;
  return { ...r, hrefs, notes, ...(folders ? { folders } : {}) };
}

/**
 * The rail scopes, scoped: only the folio's own, at this site's root. Every
 * other instance's scope names a route that does not exist here, and the
 * platform's root scope would have listed the platform's folders on every
 * folio page ("FOLDERS 29" on smart-trust).
 */
export function scopeRailScopes(scopes: unknown, scope: ForeignScope): unknown[] {
  if (!Array.isArray(scopes) || !scope.instance) return [];
  return scopes
    .filter((s): s is Json => !!s && typeof s === "object" && (s as Json).name === scope.instance)
    .map((s) => ({
      ...s,
      href: "/",
      ...(Array.isArray(s.folders)
        ? {
            folders: (s.folders as Json[]).map((f) => {
              const { path, ...rest } = f;
              return typeof path === "string" ? { ...rest, path: siteHref(path, scope) } : f;
            }),
          }
        : {}),
    }));
}

/** Every `path` string in a nested value, made to resolve on this site. */
function deepPaths(v: unknown, scope: ForeignScope): unknown {
  if (Array.isArray(v)) return v.map((x) => deepPaths(x, scope));
  if (!v || typeof v !== "object") return v;
  return Object.fromEntries(
    Object.entries(v as Json).map(([k, x]) => [k, (k === "path" || k === "href") && typeof x === "string" ? siteHref(x, scope) : deepPaths(x, scope)]),
  );
}

/**
 * `_data/harness.json` as a folio's site must serve it. Pure: the caller
 * reads and writes the file.
 */
export function scopeHarnessData(data: Json, scope: ForeignScope): Json {
  const tiles = Array.isArray(data.tiles) ? scopeTiles(data.tiles as Tile[], scope) : data.tiles;
  const linked = new Set(Array.isArray(tiles) ? (tiles as Tile[]).filter((t) => t.href).map((t) => t.id) : []);
  const glass = data.glassStrip as { pinned?: string[] } | undefined;
  const links = Array.isArray(data.links)
    ? (data.links as Json[]).map((l) => {
        const { path, ...rest } = l;
        // The site links (`kg`, `jsonld`) are the PLATFORM's graph; an absolute
        // `url` is printed as-is by head_custom.html.
        return typeof path === "string" ? { ...rest, url: siteHref(path, { platformBase: scope.platformBase }) } : l;
      })
    : data.links;
  return {
    ...data,
    ...(scope.title ? { title: scope.title } : {}),
    tiles,
    ...(glass && Array.isArray(glass.pinned)
      ? { glassStrip: { ...glass, pinned: glass.pinned.filter((id) => id.startsWith("glass-") || linked.has(id)) } }
      : {}),
    links,
    navbar: scopeNavbarRow(data.navbar, scope),
    railScopes: scopeRailScopes(data.railScopes, scope),
    ...(Array.isArray(data.harnesses) ? { harnesses: deepPaths(data.harnesses, scope) } : {}),
    ...(data.config ? { config: deepPaths(data.config, { ...scope, instance: undefined }) } : {}),
    foreignSite: {
      ...(scope.instance ? { instance: scope.instance } : {}),
      platformBase: scope.platformBase,
    },
  };
}

/**
 * Is this asset a projection of the HOST's graph rather than chrome? A JSON
 * file declaring a headline `tile` count (`schemas/tile-count.ts`) is one: the
 * bean and todo indexes and their `count.json`, the library, QA and schema
 * indexes. On a folio's site it would be fetched as the folio's own.
 */
export function isHostProjection(rel: string, text: string): boolean {
  if (!/^assets[\\/].+\.json$/.test(rel)) return false;
  if (/^---\s*$/m.test(text.split("\n", 1)[0] ?? "")) return false; // Liquid-rendered from _data, scoped there
  try {
    const doc = JSON.parse(text) as unknown;
    return !!doc && typeof doc === "object" && !Array.isArray(doc) && "tile" in (doc as Json);
  } catch {
    return false;
  }
}

/** Every root-relative href or path left in scoped data — for the gate. Empty is the contract. */
export function rootRelativeLeft(data: unknown, at = ""): string[] {
  if (Array.isArray(data)) return data.flatMap((x, i) => rootRelativeLeft(x, `${at}[${i}]`));
  if (!data || typeof data !== "object") return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(data as Json)) {
    const here = at ? `${at}.${k}` : k;
    if (typeof v === "string" && (k === "href" || k === "path") && v.startsWith("/") && !v.startsWith("//") && v !== "/") {
      out.push(`${here}=${v}`);
    } else if (k === "hrefs" && v && typeof v === "object") {
      for (const [id, h] of Object.entries(v as Json)) if (typeof h === "string" && h.startsWith("/") && !h.startsWith("//")) out.push(`${here}.${id}=${h}`);
    } else out.push(...rootRelativeLeft(v, here));
  }
  return out;
}

/**
 * Build a {@link ForeignScope} from the declarations a checkout holds: the
 * folio's OWN directories and kinds, and every declared directory's kinds.
 * An instance this checkout does not declare yields empty own sets — every
 * state tile is then unlinked, which is the conservative direction.
 */
export function foreignScopeFor(
  repo: string,
  opts: { instance?: string; platformBase: string; title?: string },
): ForeignScope {
  const decls = instanceRootsIn(repo).flatMap((root) => {
    const d = readDeclaration(root);
    return d ? [d] : [];
  });
  const kinds = new Map<string, string[]>();
  for (const d of decls) {
    for (const dir of d.directories ?? []) {
      const ks = [...(dir.graphTypologies ?? [])];
      kinds.set(dir.id, [...new Set([...(kinds.get(dir.id) ?? []), ...ks])]);
    }
  }
  const own = opts.instance ? decls.find((d) => d.name === opts.instance) : undefined;
  return {
    ...(opts.instance ? { instance: opts.instance } : {}),
    platformBase: opts.platformBase.replace(/\/$/, ""),
    ownKinds: new Set((own?.directories ?? []).flatMap((d) => d.graphTypologies ?? [])),
    kindsOf: (id) => kinds.get(id),
    holdsOf: (k) => defaultGraphTypologies.get(k)?.holds,
    ...(opts.title ? { title: opts.title } : {}),
  };
}
