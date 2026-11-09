#!/usr/bin/env bun
/**
 * An IG repository's OWN site, from its checkout and its cached AST alone:
 * the three steps the platform's site build runs for a repository that holds
 * an implementation guide and no layer declaration of its own.
 *
 * @module fhir-harness/scripts/ig-repo-site
 * @covers none — a build step: it composes an IG into a site and judges no declared graph
 *
 * ```sh
 * bun run fhir-harness/scripts/ig-repo-site.ts ast [--ig <checkout>] [--work <dir>]
 * bun run fhir-harness/scripts/ig-repo-site.ts compose <site source> [--ig <checkout>] [--baseurl <base>] [--plantuml-jar <jar>] [--work <dir>]
 * bun run fhir-harness/scripts/ig-repo-site.ts publisher-pages <built site> [--ig <checkout>] [--work <dir>]
 * ```
 *
 * The checkout scripts `ig-site:ast`, `ig-site:compose` and
 * `ig-site:publisher-pages` (`package.json` `checkoutScripts`) are these
 * three, and that is how the platform finds them: it asks the mounted layers'
 * script table for those names and never names this layer. `--work` is the
 * site build's work directory, `SITE_WORK` when the build runs the step.
 *
 * ## The site is built from the cached AST (`ig-build-pipeline` rule 1)
 *
 * Owner, 2026-10-14: *"i want AST to be used. it should be in cache
 * branch"*, and, on this route, *"Yes, fix in platform"*. Nothing here runs
 * the IG Publisher or reads its `output/`. `ast` restores the AST from the
 * IG's cache branch (`ig-cache.sh restore`) and judges it
 * (`ig-ast.ts` `astValidity`); a stale, cannot-tell or absent AST is refused
 * (rule 2), and `SITE_ACCEPT_STALE_AST=1` accepts a stale one for a preview
 * only, never for the root. `compose` derives the artefact index from that
 * AST (`ast-to-artifact-index.ts`) and `publisher-pages` serves the AST's
 * resources as the data the thin pages draw.
 *
 * ## What a layer above leaves for this one: the IG API sidecars
 *
 * An IG's per-artefact JSON sidecars (JSON Schema, JSON-LD, displays) are
 * written by post-processing this layer does not know (`ig-build-pipeline`
 * §"What this layer refuses to know about"). A layer above that produces them
 * runs before `compose` and leaves them in the work directory:
 * `<work>/ig-api/sidecars/` the files, `<work>/ig-api/ig-api.json` what the
 * IG calls them (`{ "label": "..." }`). This layer binds whatever is there to
 * the artefacts by the Publisher's file names, labels them as the descriptor
 * says (`gen-ig-pages --sidecar-label`) and serves them at
 * `fhir-artifact-index/sidecars/`. Nothing there, nothing is bound, and the
 * pages say "IG API". Files it leaves in `<work>/ig-api/site/` (its own pages
 * over the sidecars, such as an OpenAPI page) are served verbatim at the site
 * root, never over a path the site already holds, and the Publisher-chrome
 * guard judges them like every other page. The one exception: a page of the
 * IG's own that holds the marker the descriptor names (`"placeholder"`) is a
 * shell around the layer's content, and the layer's page at that path
 * replaces it.
 *
 * ## Why there is no layer here
 *
 * Owner, 2026-10-14: an IG repository "doesn't need its own harness. It can
 * just define index.config.json and reference [its base harness] as a
 * dependency." So nothing here reads a declaration of the IG. What the earlier
 * route (`stage-ig-sites --only <instance> --source .`) read from one, it now
 * reads from the IG itself:
 *
 * - the **menu** from `sushi-config.yaml` `menu:`, at build time
 *   (`buildMenu`, the same reader `ingest-ig-menu` commits with). Never
 *   committed: a committed copy is one more file to drift from the config it
 *   was read from;
 * - the **palette** from the webpage theme of the layer the repository mounts
 *   at the top of its `index.config.json` closure ({@link topMounts}): the
 *   layers it lists that no other listed layer `needs`. That is the
 *   `needs` the repository would have declared;
 * - the **edit links** from the checkout's own `origin`.
 *
 * ## `compose`: the IG's pages, at the site root
 *
 * The IG's `input/` and `sushi-config.yaml` are staged as one just-the-docs
 * source (`stageIgSite`) and composed at the ROOT of the host source the
 * platform's chrome step wrote (`composeIgSite --at-root`): the IG IS the site.
 * A path both write is refused, never overwritten.
 *
 * The IG's ARTEFACT pages are thin pages built from the AST
 * ({@link astArtefactPages}: the artefact index derived from the AST, the
 * grouping kept from the IG's committed `fhir-artifact-index/index.json`
 * when it holds one, then `gen-ig-pages.ts --ig-site`), so `artifacts.html`,
 * `toc.html` and `artifact/<Type>-<id>.html` are the site's own pages over
 * JSON-LD nodes, and the narrative's links to `<Type>-<id>.html` are pointed
 * at them (`relinkArtifacts`). `ig-render-jekyll` §"Thin pages, the default".
 *
 * Each artefact's TAB VIEWS are thin pages too (owner, 2026-10-14, answering
 * whether the Publisher's per-artefact tabs are rendered: "3. Render them
 * too"): `artifact/<Type>-<id>-definitions.html`, `-mappings.html`, the JSON
 * view (`.json.html`, a profile's `.profile.json.html`) and `-examples.html`
 * where an artefact claims the profile, at the Publisher's file names beside
 * the artefact's page, drawn from the AST's copy of the resource the site
 * serves at its root as `<Type>-<id>.json`. The narrative's links to those names are pointed at them
 * as its links to the artefact pages are. The Publisher's `comparison-v*`
 * directories are not rendered and not published.
 *
 * ## `publisher-pages`: the AST's data, never the Publisher's HTML
 *
 * Each resource is served ONCE, at the root under the Publisher's name,
 * `<Type>-<id>.json`, unless the site already holds the path: the thin
 * artefact pages draw it from there (`gen-ig-pages --compiled-data .`) and
 * the narrative links it by that name. No `ast-data/` mirror of the AST tree
 * is published (owner, 2026-11-08). The artefact index is served at
 * `fhir-artifact-index/index.json`, and the IG API sidecars a layer above
 * left at `fhir-artifact-index/sidecars/`. The Publisher's finished HTML is
 * never published (owner, 2026-10-14: "I DO NOT WANT THE IG PUBLISHER
 * HTML"): no step here copies it, and the guard below refuses a site that
 * carries its chrome, whoever put it there. Then the repeated element ids the
 * composition produces are repaired (`dedupeSiteIds`), and the site's
 * `folio-build.json` is written at its root ({@link igSiteStamp}), as every
 * folio site carries one.
 *
 * ## The IG's search and the language picker (owner, 2026-10-15)
 *
 * Layout "C": the folio rail stands in for the theme's side menu, and the
 * IG's top bar carries a search box over the IG's pages and artefacts. So
 * `compose` writes the search index and its client under the docs root
 * (`ig-search.ts`), and both the composed pages' top bar and the thin pages'
 * header carry the box. And the language picker the live pages had (*"what
 * happened to search/language select at top of display window?"*): docs-ui
 * draws it from a page's `fa-translation-meta` block, which only a page the
 * theme laid out carried. `publisher-pages` writes the block the platform
 * writes on a page Jekyll never laid out (cat-harness-tools
 * `lib/translation-meta.ts`, as `mount-instance-docs.ts` does) into every
 * built page that lacks one, from the IG checkout's own translation
 * declaration; the site build's `set-html-lang.ts` then reads it. The
 * same step gives every other built page the IG's slim bar ({@link stampIgBar}),
 * whose box is followed by the slot docs-ui puts the language picker in, so
 * the picker sits in the bar beside it.
 *
 * ## One layout (owner, 2026-10-15)
 *
 * The owner asked for the full width of the overlay's hub page *"on the other
 * pages as well... also can you make it match how folio-assistnat does with
 * the scrollnig and such. please consolidate behaviours/appearance"*.
 * Every page of the site links the shared page layout (cat-harness-tools
 * `page-layout.ts`: full width beside the rail, the window the one scroller,
 * the bar sticky above it on a wide screen and scrolling away on a phone,
 * anchors landing below it) and then the IG's one
 * stylesheet, `ig-artifact.css`. The composed pages carry the IG's full bar,
 * and every other page carries its slim bar (`stampIgBar`; owner, "keep slim").
 *
 * ## Whose dead links
 *
 * Both steps list the built pages they put in the site in the file the site
 * build names in `FOLIO_SITE_UPSTREAM_PAGES`. Those pages carry the IG's OWN
 * links: a dead one is the IG's to fix (the Publisher's output alone holds
 * thousands, measured on one IG), so the site build reports it and does not
 * refuse the publish over it, while a dead link in the chrome still refuses.
 */
import { IG_API_HUB_CONFIG_ID, IG_API_HUB_DEFAULT_PAGE, hasIgApi, hubEntries, igApiHubPageOf, writeIgApiHubSite } from "./ig-api-hub.ts";
import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

import { parse as parseYaml } from "yaml";

import { conceptOf, profilesOf } from "./ast-to-artifact-index.ts";
import { astValidity, type AstValidity, buildKind, readAst } from "./ig-ast.ts";
import { composeIgSite, dedupeSiteIds, describeStage, IG_THIN_CSS_FILE, stageIgSite, type SitePalette } from "./build-ig-site";
import { artifactSearchEntries, IG_SEARCH_INDEX_FILE, IG_SEARCH_SCRIPT_FILE, IG_SEARCH_SCRIPT_SOURCE, igSearchIndex, pageSearchEntries, withIgBar } from "./ig-search.ts";
import { translationMetaBlock, withTranslationMeta } from "../../cat-harness-tools/scripts/lib/translation-meta.ts";
import { igOpenapiGraph, OPENAPI_DIR } from "../../cat-harness-tools/openapi/scripts/ig-site-openapi.ts";
import type { FhirArtifactIndex } from "../schemas/fhir-artifact-index.js";
import { buildMenu } from "./ingest-ig-menu.ts";
import { THIN_INDEX_CONFIG_ID, THIN_PAGE_CONFIG_ID } from "./ig-thin-pages.ts";
import { COMPILED_BY_NAME } from "./ig-artifact-jsonld.ts";
import { copyDeclared, igReadScope, type IgReadScope } from "./ig-read-scope.ts";
import { siteBuild, type SiteBuild, STAMP_FILE } from "./site-build-stamp.ts";
import { buildQaPage, publishQaAssets } from "./ig-qa-page.ts";
import { annexesFor, artifactsFor, copyDocsInto, footerFor, githubEditBase, instanceNeeds, webpagePalette } from "./stage-ig-sites.ts";
// The preview directories (cat-harness-tools `schemas/sdlc/preview-prefix.ts`):
// `branches/` since 2026-11-05, and the legacy `STAGING/` still read. Named
// here, not imported, so this layer does not wait on that module's release.
const PREVIEW_PREFIX_ALT = "(?:branches|STAGING)";

/**
 * The file, named by the site build in this variable, in which a step lists
 * the built pages whose links are the IG's own: their dead links are the IG's
 * to fix, and the site build reports them rather than refusing the publish.
 * Unset (the script run by hand), nothing is listed.
 */
export const UPSTREAM_PAGES_ENV = "FOLIO_SITE_UPSTREAM_PAGES";

function listUpstream(pages: readonly string[]): void {
  const f = process.env[UPSTREAM_PAGES_ENV];
  if (f && pages.length) appendFileSync(f, `${pages.join("\n")}\n`);
}

/** The page a Jekyll source file builds to, by Jekyll's default permalink; undefined for a file that is not a page. */
export function builtPage(sourcePath: string): string | undefined {
  if (/(^|\/)_/.test(sourcePath)) return undefined;
  const m = /^(.*)\.(md|markdown|html)$/.exec(sourcePath);
  return m ? `${m[1]}.html` : undefined;
}

/** The thin pages' stylesheet, beside the generator that writes it for a layer's artefact pages. */
const THIN_CSS_SOURCE = join(import.meta.dir, "templates", "ig-pages", "ig-artifact.css");

/** The checkout scripts this module provides, by the names the platform asks for. */
export const IG_SITE_SCRIPTS = { ast: "ig-site:ast", compose: "ig-site:compose", publisherPages: "ig-site:publisher-pages", bar: "ig-site:bar" } as const;

/**
 * The layers a repository mounts that nothing else it mounts needs: the
 * top of its `index.config.json` closure. Pure over the listed names and each
 * one's `needs`.
 */
export function topMounts(listed: readonly string[], needs: (name: string) => readonly string[]): string[] {
  const needed = new Set(listed.flatMap((n) => needs(n)));
  return listed.filter((n) => !needed.has(n));
}

/** The layer names `index.config.json` lists, in its order; empty without one. */
export function listedInstances(root: string): string[] {
  const f = join(root, "index.config.json");
  if (!existsSync(f)) return [];
  const c = JSON.parse(readFileSync(f, "utf-8")) as { instances?: { name?: unknown }[] };
  return (c.instances ?? []).map((i) => i.name).filter((n): n is string => typeof n === "string");
}

/**
 * The palette the IG's site wears: the one webpage theme the top mounts
 * declare, each inheriting along its own `needs`. Two tops with a theme each
 * is refused, as two themes in one layer are: nothing says which.
 */
export function topMountPalette(root: string): { palette?: SitePalette; note: string } {
  const tops = topMounts(listedInstances(root), (n) => instanceNeeds(root, n));
  if (tops.length === 0) return { note: "index.config.json lists no instance: no webpage theme" };
  const found = tops.map((t) => ({ t, ...webpagePalette(root, t) }));
  const hits = found.filter((f) => f.palette !== undefined);
  if (hits.length > 1) throw new Error(`the mounted layers ${hits.map((h) => h.t).join(" and ")} each give a webpage theme — nothing says which dresses this IG's site`);
  return hits[0] ? { palette: hits[0].palette!, note: hits[0].note } : { note: found.map((f) => f.note).join("; ") };
}

/** The name the composition files the IG's includes and data under: the repository's own. */
export function siteName(ig: string): string {
  const r = spawnSync("git", ["-C", ig, "config", "--get", "remote.origin.url"], { encoding: "utf-8" });
  const m = r.status === 0 ? /([^/:]+?)(?:\.git)?\/?$/.exec(r.stdout.trim()) : null;
  return m?.[1] ?? basename(resolve(ig));
}

/** The IG's title, from `sushi-config.yaml`; undefined when it states none. */
export function igTitle(ig: string): string | undefined {
  const f = join(ig, "sushi-config.yaml");
  if (!igReadScope(ig).declares("sushi-config.yaml") || !existsSync(f)) return undefined;
  const y = (parseYaml(readFileSync(f, "utf-8")) ?? {}) as { title?: unknown; name?: unknown };
  const t = typeof y.title === "string" ? y.title : typeof y.name === "string" ? y.name : undefined;
  return t?.trim() || undefined;
}

/** `https://github.com/<o>/<r>` from the checkout's origin, or undefined. */
function githubRepo(ig: string): string | undefined {
  const r = spawnSync("git", ["-C", ig, "config", "--get", "remote.origin.url"], { encoding: "utf-8" });
  const m = r.status === 0 ? /github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(r.stdout.trim()) : null;
  return m ? `https://github.com/${m[1]}/${m[2]}` : undefined;
}

/**
 * Top-level paths of the checkout that are not the IG's source: the mounts
 * `index.lock.json` lays down, git's own directory, the Publisher's build
 * products (its `.gitignore` names them too) and the restored AST. Copying them would stage the
 * platform as if it were the IG.
 */
export function notSource(root: string): Set<string> {
  const out = new Set([".git", "node_modules", "output", "output-ast", "temp", "template", "input-cache", "fsh-generated"]);
  const lock = join(root, "index.lock.json");
  if (existsSync(lock)) {
    for (const i of (JSON.parse(readFileSync(lock, "utf-8")) as { instances?: { path?: unknown }[] }).instances ?? []) {
      if (typeof i.path === "string" && i.path !== "" && i.path !== ".") out.add(i.path.split("/")[0]!);
    }
  }
  return out;
}

/** Where `ig-cache.sh restore` lays the AST down, in the IG checkout. */
export const AST_DIR = "output-ast";
/**
 * How the thin pages find the AST's resources (`gen-ig-pages --compiled-data`):
 * each is served once at the site root under the Publisher's name,
 * `<Type>-<id>.json`. No `ast-data/` mirror of the AST tree is published
 * (owner, 2026-11-08: "we dont need ast-data/resources published").
 */
export const AST_DATA = COMPILED_BY_NAME;
/** Where the site serves the artefact index: the graph's own name. */
export const INDEX_SERVED = "fhir-artifact-index";
/** Where the site serves the IG API sidecars, the `localPath` each is bound at. */
export const SIDECARS_SERVED = `${INDEX_SERVED}/sidecars`;
/**
 * Under the site build's work directory: what a layer above leaves for this
 * one (module doc, §"What a layer above leaves"). `sidecars/` the files,
 * {@link IG_API_DESCRIPTOR} what the IG calls them.
 */
export const IG_API_WORK = "ig-api";
export const IG_API_DESCRIPTOR = "ig-api.json";
/** Under `ig-api/`: files the layer above wrote for the site root, served verbatim (its own pages over the sidecars). */
export const IG_API_SITE = "site";
/** Under the work directory: the artefact index `compose` derived, for `publisher-pages` to serve. */
export const INDEX_WORK = "ig-site-index";
/**
 * A preview accepts a stale AST by default (`ig-build-pipeline` rule 2; owner,
 * 2026-11-05: "preview/staging (non release) builds can be on stale cache").
 * Set to `0` to make a preview refuse one too. The root never accepts one.
 */
export const ACCEPT_STALE_ENV = "SITE_ACCEPT_STALE_AST";

/** Whether a preview may use a stale AST: yes unless {@link ACCEPT_STALE_ENV} is `0`. Pure. */
export function acceptStaleFromEnv(v: string | undefined): boolean {
  return v !== "0";
}
/** The validity verdict `ast` writes under the work directory. */
export const VALIDITY_FILE = "ig-ast-validity.json";

/** The IG API sidecars a layer above left, and what it calls them. */
export interface IgApi {
  sidecars: string;
  files: number;
  label?: string;
  /** Files to serve at the site root, at the paths they hold under this directory. */
  site?: string;
  /**
   * The marker a page of the IG's own holds where the layer above's page goes
   * (the IG's hub page is a shell around it). A site page holding it is
   * replaced by the layer's file at the same path; no other page ever is.
   */
  placeholder?: string;
}

/**
 * The IG API sidecars under `work`, or undefined when no layer left any. A
 * descriptor that is there and says nothing usable is refused, not ignored:
 * the pages would otherwise carry a label nobody chose.
 */
export function readIgApi(work: string | undefined): IgApi | undefined {
  if (!work) return undefined;
  const dir = join(work, IG_API_WORK);
  const sidecars = join(dir, "sidecars");
  if (!existsSync(sidecars) || !statSync(sidecars).isDirectory()) return undefined;
  const files = readdirSync(sidecars).filter((f) => statSync(join(sidecars, f)).isFile()).length;
  if (files === 0) return undefined;
  const siteDir = join(dir, IG_API_SITE);
  const site = existsSync(siteDir) && statSync(siteDir).isDirectory() ? { site: siteDir } : {};
  const desc = join(dir, IG_API_DESCRIPTOR);
  if (!existsSync(desc)) return { sidecars, files, ...site };
  const d = JSON.parse(readFileSync(desc, "utf-8")) as { label?: unknown; placeholder?: unknown };
  if (d.label !== undefined && (typeof d.label !== "string" || d.label.trim() === "")) throw new Error(`${desc}: "label" must be a non-empty string`);
  if (d.placeholder !== undefined && (typeof d.placeholder !== "string" || d.placeholder.trim().length < 8)) throw new Error(`${desc}: "placeholder" must be a marker string of at least 8 characters`);
  return {
    sidecars,
    files,
    ...(typeof d.label === "string" ? { label: d.label.trim() } : {}),
    ...(typeof d.placeholder === "string" ? { placeholder: d.placeholder } : {}),
    ...site,
  };
}

/**
 * Whether the build may go on with an AST of this verdict (`ig-build-pipeline`
 * rule 2). Valid goes on. Anything else is refused, except that a stale or
 * cannot-tell AST is accepted for a PREVIEW unless the caller refuses it; the
 * root never is. Pure.
 */
export function astGate(verdict: string, o: { acceptStale: boolean; preview: boolean }): { ok: boolean; said: string } {
  if (verdict === "valid") return { ok: true, said: "the AST is valid for this checkout" };
  if (o.acceptStale && o.preview) return { ok: true, said: `the AST is ${verdict}; accepted for this preview (a preview may use a stale AST; ${ACCEPT_STALE_ENV}=0 refuses it)` };
  const why = o.preview ? `${ACCEPT_STALE_ENV}=0 makes this preview refuse a stale AST` : `a stale AST is accepted for a preview only, and this build is the root: refresh the cache (the IG's Site publish, or fhir-harness/scripts/ig-ast-build.sh then ig-cache.sh seed --push)`;
  return { ok: false, said: `the AST is ${verdict}: the site is not built from it (${why}). It does not fall back to a Publisher run or the Publisher's HTML` };
}

/** Whether the site build is building a preview: its base path is `/<repo>/branches/<branch>` (or the old `/<repo>/branches/<branch>`). */
export function isPreviewBase(baseurl: string | undefined): boolean {
  return baseurl !== undefined && new RegExp(`/${PREVIEW_PREFIX_ALT}/`).test(`${baseurl}/`);
}

/**
 * `ast`: restore the IG's AST from its cache branch into the checkout, and
 * judge it. Throws, saying why, when there is no cache or the gate refuses.
 */
export function restoreAst(o: { ig: string; work?: string; acceptStale: boolean; preview: boolean; log?: (s: string) => void }): AstValidity {
  const log = o.log ?? ((s: string) => console.error(s));
  const ig = resolve(o.ig);
  if (!existsSync(igReadScope(ig, { warn: log }).path("sushi-config.yaml"))) throw new Error(`${ig} holds no sushi-config.yaml: not an IG checkout`);
  const restore = (): AstValidity => {
    const r = spawnSync("bash", [join(import.meta.dir, "ig-cache.sh"), "restore", "--ig-root", ig], { cwd: ig, stdio: ["ignore", "inherit", "inherit"] });
    if (r.status !== 0) {
      throw new Error(`no AST to build from: ig-cache.sh restore exited ${r.status}${r.status === 1 ? " (no cache branch for this IG; run its Site publish, whose `ast` job seeds it)" : ""}. The site is never built from the Publisher's HTML`);
    }
    return astValidity(readAst(join(ig, AST_DIR)), ig);
  };
  const had = existsSync(join(ig, AST_DIR));
  let v = restore();
  // `restore` keeps an AST already in the checkout. One that is not valid may be
  // an older restore or a local build, not the cache branch: judge the branch's.
  if (had && v.verdict !== "valid") {
    log(`ast: the AST already in the checkout is ${v.verdict}; restoring the cache branch's in its place`);
    rmSync(join(ig, AST_DIR), { recursive: true, force: true });
    v = restore();
  }
  if (o.work) {
    mkdirSync(o.work, { recursive: true });
    writeFileSync(join(o.work, VALIDITY_FILE), `${JSON.stringify(v, null, 2)}\n`);
  }
  const g = astGate(v.verdict, o);
  if (!g.ok) throw new Error(g.said);
  log(`ast: ${g.said} (built from ${v.recorded?.sourceRevision?.slice(0, 7) ?? "an unrecorded revision"} by ${v.recorded?.toolchain ?? "an unrecorded toolchain"})`);
  return v;
}

/**
 * What each artefact's own JSON states about itself — its `meta.profile` and
 * its `code` concept — copied into the index from the Publisher's
 * `<Type>-<id>.json` in `output/`, as `ast-to-artifact-index` copies them
 * from the AST. Nothing is looked up. The index node carries them
 * (`statedFacts`), so the artifacts page can show an instance's profile and
 * code, and a profile's examples view (owner, 2026-10-14: "3. Render them
 * too") can list what claims it. Returns how many artefacts state either.
 */
export function stateFromOutput(indexFile: string, output: string): number {
  const ix = JSON.parse(readFileSync(indexFile, "utf-8")) as { artifacts: { resourceType: string; id: string; canonical?: string; profiles?: string[]; code?: unknown }[] };
  let stated = 0;
  for (const a of ix.artifacts) {
    const f = join(output, `${a.resourceType}-${a.id}.json`);
    if (!existsSync(f)) continue;
    let r: Parameters<typeof profilesOf>[0];
    try {
      r = JSON.parse(readFileSync(f, "utf-8")) as Parameters<typeof profilesOf>[0];
    } catch {
      continue;
    }
    const profiles = a.profiles ?? profilesOf(r);
    const code = a.code ?? conceptOf(r);
    if (profiles) a.profiles = profiles;
    if (code) a.code = code;
    if (profiles || code) stated += 1;
  }
  writeFileSync(indexFile, `${JSON.stringify(ix, null, 2)}\n`);
  return stated;
}

/**
 * The IG's artefact pages, THIN (`ig-render-jekyll` §"Thin pages, the
 * default"), from the AST — never the Publisher's output or its finished HTML
 * (owner, 2026-10-14: "I DO NOT WANT THE IG PUBLISHER HTML"). The artefact
 * index is derived from the AST (`ast-to-artifact-index.ts`), keeping the
 * grouping of the IG's committed `fhir-artifact-index/index.json` when it holds
 * one (the AST stops before the Publisher assigns categories), with the IG API
 * sidecars bound when a layer above left any. Then `gen-ig-pages.ts` writes one
 * thin page and one JSON-LD node per artefact plus the index node the site's
 * thin `artifacts.html` and `toc.html` draw. Returns the layer directory the
 * pages and the index are in.
 */
export function astArtefactPages(o: { ig: string; ast: string; work: string; name: string; label: string; igApi?: IgApi; log: (s: string) => void }): string {
  if (!existsSync(join(o.ast, "manifest.json"))) {
    throw new Error(`${o.ast}: no AST — run ${IG_SITE_SCRIPTS.ast} first. The site is never built from the Publisher's output`);
  }
  const inst = join(o.work, "artefacts", o.name);
  const index = join(inst, INDEX_SERVED, "index.json");
  mkdirSync(dirname(index), { recursive: true });
  const bun = (script: string, args: string[]): void => {
    const r = spawnSync("bun", ["run", join(import.meta.dir, script), ...args], { cwd: o.ig, encoding: "utf-8" });
    if (r.status !== 0) throw new Error(`${script} failed (exit ${r.status}):\n${`${r.stderr}\n${r.stdout}`.trim().split("\n").slice(-15).join("\n")}`);
    for (const l of `${r.stdout}`.trim().split("\n").filter(Boolean).slice(0, 12)) o.log(`  ${l}`);
  };
  // Relative to the IG: each artefact's `localPath` is then `output-ast/resources/...`;
  // the pages point at the resource's root name instead (`AST_DATA`).
  const args = ["--ast", relative(o.ig, o.ast) || ".", "--instance-id", o.name, "--out", index];
  const published = join(o.ig, INDEX_SERVED, "index.json");
  if (existsSync(published)) args.push("--compare", published, "--keep-published-grouping", "--report", join(o.work, "ast-parity.json"));
  if (o.igApi) args.push("--sidecars", o.igApi.sidecars, "--sidecars-local", SIDECARS_SERVED);
  bun("ast-to-artifact-index.ts", args);
  bun("gen-ig-pages.ts", [
    "--instance", inst, "--index", index, "--label", o.label, "--ig-site", "--compiled-data", AST_DATA, "--search",
    ...(o.igApi ? ["--ig-api-served", ...(o.igApi.label ? ["--sidecar-label", o.igApi.label] : [])] : []),
  ]);
  return inst;
}

/**
 * The PlantUML jar `compose` renders `input/images-source/*.plantuml` with:
 * the one given, else `PLANTUML_JAR`, else the cached copy of the pinned
 * release, when it is there. Undefined: the diagrams carry a visible "not
 * rendered" marker, as `stageIgSite` reports.
 */
export const PLANTUML_VERSION = "1.2026.9";
export function plantumlJarFor(given: string | undefined, env: Record<string, string | undefined>, home: string): string | undefined {
  for (const j of [given, env.PLANTUML_JAR, join(home, ".cache", "plantuml", `plantuml-${PLANTUML_VERSION}.jar`)]) {
    if (j && existsSync(j) && statSync(j).size > 0) return j;
  }
  return undefined;
}

/** Fetch the pinned PlantUML release into the cache, as the IG repository recipe did; undefined when it cannot. */
function fetchPlantuml(home: string, log: (s: string) => void): string | undefined {
  const jar = join(home, ".cache", "plantuml", `plantuml-${PLANTUML_VERSION}.jar`);
  mkdirSync(dirname(jar), { recursive: true });
  const url = `https://repo1.maven.org/maven2/net/sourceforge/plantuml/plantuml/${PLANTUML_VERSION}/plantuml-${PLANTUML_VERSION}.jar`;
  const r = spawnSync("curl", ["-sSfL", "--retry", "3", "-o", jar, url], { stdio: ["ignore", "ignore", "pipe"] });
  if (r.status === 0 && existsSync(jar) && statSync(jar).size > 0) return jar;
  rmSync(jar, { force: true });
  log(`plantuml: could not fetch ${url} (${r.stderr?.toString().trim() || `exit ${r.status}`}); diagrams are marked "not rendered"`);
  return undefined;
}

/**
 * Copy the IG's source into `src` for staging, and return what was copied.
 *
 * A repository that declares `contentTypes.ig` gets exactly its `include`
 * entries that exist, and its `index.config.json`, so the staged copy keeps
 * the declaration every later reader checks. One that declares none is
 * copied whole, less {@link notSource}, as before.
 */
export function copyIgSource(ig: string, src: string, scope: IgReadScope = igReadScope(ig)): string[] {
  if (!scope.legacy) return copyDeclared(scope, src);
  const skip = notSource(ig);
  const top = readdirSync(ig).filter((e) => !skip.has(e));
  for (const e of top) cpSync(join(ig, e), join(src, e), { recursive: true });
  return top;
}

/** Whether the IG has PlantUML sources to render. */
function hasPlantuml(ig: string): boolean {
  const d = join(ig, "input", "images-source");
  const scope = igReadScope(ig);
  return scope.reaches("input/images-source") && existsSync(d) && readdirSync(d).some((f) => f.endsWith(".plantuml") && scope.declares(`input/images-source/${f}`));
}

export function compose(o: { docs: string; ig: string; baseurl: string; ast?: string; work?: string; plantumlJar?: string; log?: (s: string) => void }): void {
  const log = o.log ?? ((s: string) => console.error(s));
  const ig = resolve(o.ig);
  const scope = igReadScope(ig, { warn: log });
  if (!existsSync(scope.path("sushi-config.yaml"))) throw new Error(`${ig} holds no sushi-config.yaml: not an IG checkout`);
  if (!existsSync(o.docs)) throw new Error(`${o.docs}: no host site source to compose into`);
  const name = siteName(ig);
  const work = mkdtempSync(join(tmpdir(), "ig-repo-site-"));
  try {
    const src = join(work, "src");
    mkdirSync(src, { recursive: true });
    const copied = copyIgSource(ig, src, scope);
    log(`${name}: ${scope.legacy ? `source copied whole (no contentTypes.ig), ${copied.length} top-level entr${copied.length === 1 ? "y" : "ies"}` : `source copied from contentTypes.ig.include: ${copied.join(", ")}`}`);
    const menu = buildMenu(ig, new Date().toISOString().slice(0, 10));
    log(`${name}: menu read from sushi-config.yaml at build time — ${menu.groups.length} group(s)`);
    const theme = topMountPalette(ig);
    log(theme.note);
    const gh = githubRepo(ig);
    const editBase = gh ? githubEditBase(gh) : undefined;
    const site = join(work, "site");
    const baseurl = o.baseurl.replace(/\/$/, "");
    const label = igTitle(ig) ?? name;
    const igApi = readIgApi(o.work);
    log(igApi ? `${name}: ${igApi.files} IG API sidecar file(s) left by a layer above${igApi.label ? `, called "${igApi.label}"` : ""}` : `${name}: no IG API sidecars under the work directory — none bound`);
    const ast = resolve(o.ast ?? join(ig, AST_DIR));
    const inst = astArtefactPages({ ig, ast, work, name, label, ...(igApi ? { igApi } : {}), log });
    if (o.work) {
      // For `publisher-pages`, which serves the index the pages were drawn from.
      mkdirSync(join(o.work, INDEX_WORK), { recursive: true });
      cpSync(join(inst, INDEX_SERVED, "index.json"), join(o.work, INDEX_WORK, "index.json"));
    }
    const plantumlJar = plantumlJarFor(o.plantumlJar, process.env, homedir()) ?? (hasPlantuml(ig) ? fetchPlantuml(homedir(), log) : undefined);
    const annexes = annexesFor(ig, log);
    // The QA report the footer's "QA Report" links: the FHIR QA the build
    // holds and the knowledge graph's, on one page (`ig-qa-page.ts`).
    const qa = buildQaPage({ root: ig, ast, ...(o.work ? { validity: join(o.work, VALIDITY_FILE) } : {}) });
    const r = stageIgSite(src, site, {
      baseurl,
      menu,
      // The IG's pages loop site.data.canonicals and site.data["<Type>-<id>"]: drawn from the same AST.
      ast,
      artifacts: artifactsFor(inst, "artifact/"),
      footer: footerFor(inst, ""),
      ...(theme.palette ? { palette: theme.palette } : {}),
      ...(plantumlJar ? { plantumlJar } : {}),
      ...(editBase ? { editBase } : {}),
      // The IG's own annexes (`ig-annex` directories it declares), as an
      // index's IG site places them (stage-ig-sites.ts).
      ...(annexes ? { annexes } : {}),
      // A checkout with an OpenAPI graph gets its `openapi/` pages from
      // `ig-site:openapi`, a later step that refuses a path the site holds,
      // so the IG's own `input/images/openapi/` (the Publisher's Swagger UI)
      // is not published over them.
      ...(igOpenapiGraph(ig) ? { reservedPaths: [{ prefix: `${OPENAPI_DIR}/`, by: "ig-site:openapi" }] } : {}),
      search: true,
      qaPage: qa.page,
    });
    log(`${name}:\n${describeStage(r)}`);
    if (r.qa === "written") {
      const n = publishQaAssets(qa, site);
      log(`${name}: QA report — FHIR QA ${qa.fhir.publisher ? "with" : "without"} the Publisher's summary; KG QA over ${qa.kg.instances.length} instance(s), ${n} record(s)`);
    }
    // The artefact pages draw the footer from JSON after load: the same
    // footer as every other page, links decided once (`igSiteFooter`).
    const footerData = join(inst, "docs", "assets", "ig-footer.json");
    if (existsSync(footerData)) {
      const { stylesheets: _s, scope: _c, ...data } = r.footer;
      writeFileSync(footerData, `${JSON.stringify(data, null, 2)}\n`);
    }
    if (r.siteData.refused.length) throw new Error(`${name}: the IG's site data was refused (${r.siteData.refused.join(", ")})`);
    const d = copyDocsInto(join(inst, "docs"), site);
    log(`${name}: ${d.copied} artefact page and node file(s) built into the site${d.merged.length ? `; front matter laid onto ${d.merged.join(", ")}` : ""}`);
    if (d.collisions.length) throw new Error(`${name}: ${d.collisions.length} artefact file(s) the IG's own pages already write — refusing two answers for one URL:\n  ${d.collisions.slice(0, 20).join("\n  ")}`);
    const before = new Set(filesUnder(resolve(o.docs)));
    const c = composeIgSite(site, resolve(o.docs), name, { atRoot: true, siteBase: baseurl });
    listUpstream(filesUnder(resolve(o.docs)).filter((f) => !before.has(f)).map(builtPage).filter((p): p is string => p !== undefined));
    log(`${name}: composed at the site root — ${c.pages} page(s), ${c.files - c.pages} other file(s), ${c.includes} include(s)`);
    // The thin layout links the shared thin-page stylesheet, which the artefact
    // page generator writes when a layer has one; here nothing else does.
    const thinCss = join(resolve(o.docs), IG_THIN_CSS_FILE);
    if (!existsSync(thinCss)) {
      mkdirSync(join(thinCss, ".."), { recursive: true });
      cpSync(THIN_CSS_SOURCE, thinCss);
    }
    if (c.collisions.length) throw new Error(`${name}: ${c.collisions.length} path(s) the host source already holds — refusing two answers for one URL:\n  ${c.collisions.slice(0, 20).join("\n  ")}`);
    const s = writeSearch(resolve(o.docs), site, JSON.parse(readFileSync(join(inst, INDEX_SERVED, "index.json"), "utf-8")) as FhirArtifactIndex);
    log(`${name}: search over ${s.pages} page(s) and ${s.artifacts} artefact(s) at ${IG_SEARCH_INDEX_FILE} (${Math.round(s.bytes / 1024)} KB, fetched on the first search)`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

/**
 * The IG's search under the docs root: the index of the staged site's pages
 * and the artefact index's artefacts, and the client every box loads
 * (`ig-search.ts`). A path the host source already holds is refused, as
 * every other file `compose` writes is.
 */
export function writeSearch(docs: string, staged: string, ix: Pick<FhirArtifactIndex, "artifacts">): { pages: number; artifacts: number; bytes: number } {
  const pages = pageSearchEntries(staged);
  const artifacts = artifactSearchEntries(ix.artifacts);
  const body = `${JSON.stringify(igSearchIndex(pages, artifacts))}\n`;
  for (const [rel, text] of [[IG_SEARCH_INDEX_FILE, body], [IG_SEARCH_SCRIPT_FILE, readFileSync(IG_SEARCH_SCRIPT_SOURCE, "utf-8")]] as const) {
    const to = join(docs, rel);
    if (existsSync(to)) throw new Error(`${rel}: the host source already holds it — refusing two answers for one URL`);
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, text);
  }
  return { pages: pages.length, artifacts: artifacts.length, bytes: Buffer.byteLength(body) };
}

/**
 * The language picker's block (`fa-translation-meta`) on every page of the
 * built site that lacks one: the block the platform writes on a page Jekyll
 * never laid out (cat-harness-tools `lib/translation-meta.ts`), from the IG
 * checkout's translation declaration (the six UN languages, source `en`,
 * when it declares none). A page with its own block, or with no `<head>`, is
 * left as it is. Returns how many pages were given one.
 */
export function stampTranslationMeta(site: string, ig: string): number {
  const block = translationMetaBlock(ig);
  let n = 0;
  for (const f of filesUnder(site)) {
    if (!/\.html?$/i.test(f)) continue;
    const abs = join(site, f);
    const html = readFileSync(abs, "utf-8");
    const after = withTranslationMeta(html, block);
    if (after !== html) {
      writeFileSync(abs, after);
      n++;
    }
  }
  return n;
}

/**
 * The IG's SLIM bar on every page of the built site that does not carry the
 * composed pages' full bar (`ig-search.ts` {@link withIgBar}): the IG's name
 * linked home, the search box and the language picker's slot
 * ({@link igFallbackBar}). It replaces the thin artefact and list pages' own
 * header and is given to pages that a layer above or below wrote with none
 * (an IG API hub page, the OpenAPI pages), with the shared page layout and
 * the IG's stylesheet linked. Owner, 2026-10-15: "please consolidate
 * behaviours/appearance", then "keep slim". The full menu, inlined, would
 * cost every one of some two thousand pages about 2.5 KB. Paths are relative
 * to each page, so it works under any base. Nothing is stamped under
 * `assets/` (vendored tools' own pages), and nothing at all when the site
 * serves no search index, so no page names a file the site does not hold.
 * Returns how many pages were changed.
 */
export function stampIgBar(site: string, label: string): { pages: number } {
  if (!existsSync(join(site, IG_SEARCH_INDEX_FILE))) return { pages: 0 };
  let n = 0;
  for (const f of filesUnder(site)) {
    if (!/\.html?$/i.test(f) || f.startsWith("assets/")) continue;
    const up = "../".repeat(f.split("/").length - 1);
    const abs = join(site, f);
    const html = readFileSync(abs, "utf-8");
    const after = withIgBar(html, { ref: { index: `${up}${IG_SEARCH_INDEX_FILE}`, script: `${up}${IG_SEARCH_SCRIPT_FILE}` }, label, home: `${up}index.html`, up });
    if (after !== html) {
      writeFileSync(abs, after);
      n++;
    }
  }
  return { pages: n };
}

/** The config block ids of the IG's thin pages: an artefact's page, the artifacts/toc lists, the IG API hub. */
export const IG_THIN_CONFIG_IDS: readonly string[] = [THIN_PAGE_CONFIG_ID, THIN_INDEX_CONFIG_ID, IG_API_HUB_CONFIG_ID];
const TOC_NAV_RE = /<script type="application\/json" data-fa-visualiser-nav>[\s\S]*?<\/script>/;
const TOC_LABEL_RE = /<meta name="fa-visualiser-label" content="[^"]*">/;

/**
 * The IG's TOC in the rail on its THIN pages too (owner, 2026-11-02: "the LHS
 * navbar should have TOC ... some pages have it but not artifact. why?").
 *
 * The rail's IG section is DECLARED (`igTocNav`), and only the layout the
 * IG's narrative pages wear writes it. The thin pages (`artifacts.html`,
 * `toc.html`, every `artifact/*.html`, the IG API hub) are finished HTML that
 * never pass through that layout, and they draw their content by script, so
 * the rail found no section on them and drew none.
 *
 * This copies the declaration and its label, read off a built page that has
 * them (`index.html` first), into each thin page that lacks one, before the
 * rail pass reads it. Only pages carrying one of {@link IG_THIN_CONFIG_IDS}
 * are touched: a page of anybody else's keeps its own section. No page with
 * the declaration, nothing to copy and nothing stamped.
 */
export function stampIgTocNav(site: string): { pages: number } {
  const all = filesUnder(site).filter((f) => /\.html?$/i.test(f) && !f.startsWith("assets/"));
  let nav: string | undefined;
  let label: string | undefined;
  for (const f of ["index.html", ...all.filter((x) => x !== "index.html")]) {
    if (!existsSync(join(site, f))) continue;
    const html = readFileSync(join(site, f), "utf-8");
    const m = TOC_NAV_RE.exec(html);
    if (!m) continue;
    nav = m[0];
    label = TOC_LABEL_RE.exec(html)?.[0];
    break;
  }
  if (!nav) return { pages: 0 };
  const thin = new RegExp(`<script type="application/json" id="(?:${IG_THIN_CONFIG_IDS.join("|")})">`);
  let n = 0;
  for (const f of all) {
    const abs = join(site, f);
    const html = readFileSync(abs, "utf-8");
    if (!thin.test(html) || TOC_NAV_RE.test(html)) continue;
    const at = html.search(/<\/head>/i);
    if (at < 0) continue;
    const add = `${label && !TOC_LABEL_RE.test(html) ? `${label}\n` : ""}${nav}\n`;
    writeFileSync(abs, html.slice(0, at) + add + html.slice(at));
    n++;
  }
  return { pages: n };
}

/** Every file under `dir`, relative to it, `/`-separated. */
function filesUnder(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) out.push(relative(dir, p).split(sep).join("/"));
    }
  };
  walk(dir);
  return out;
}

/**
 * The platform commit a site was built with: the `cat-harness-tools` mount
 * `index.lock.json` pins (the toolset that draws the chrome), else the first
 * mount it pins. A checkout that only mounts layers has no platform checkout
 * of its own to ask `git` about.
 */
export function platformCommit(root: string): string | undefined {
  const lock = join(root, "index.lock.json");
  if (!existsSync(lock)) return undefined;
  const mounts = ((JSON.parse(readFileSync(lock, "utf-8")) as { mounts?: { harness?: unknown; ref?: unknown }[] }).mounts ?? []).filter((m) => typeof m.ref === "string" && m.ref !== "");
  return (mounts.find((m) => m.harness === "cat-harness-tools") ?? mounts[0])?.ref as string | undefined;
}

/**
 * The site's `folio-build.json` (`site-build-stamp.ts`): what built it, read
 * from the runner's environment and, where that is silent (an agent's own
 * run), from the checkout. Every folio site carries one at its root, and the
 * publisher's root guard recognises a folio site by it, so a bare IG deploy
 * never overwrites this one.
 */
export function igSiteStamp(ig: string, env: Record<string, string | undefined> = process.env, now = new Date()): SiteBuild {
  const git = (...a: string[]): string | undefined => {
    const r = spawnSync("git", ["-C", ig, ...a], { encoding: "utf-8" });
    return r.status === 0 ? r.stdout.trim() || undefined : undefined;
  };
  const platform = platformCommit(ig) ?? git("rev-parse", "HEAD");
  if (!platform) throw new Error(`${ig}: no index.lock.json pin and no git commit to name the platform this site was built with`);
  const repo = /github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?\/?$/.exec(git("config", "--get", "remote.origin.url") ?? "")?.[1];
  return siteBuild(siteName(ig), platform, {
    GITHUB_REPOSITORY: env.GITHUB_REPOSITORY ?? repo,
    GITHUB_REF_NAME: env.GITHUB_REF_NAME ?? git("rev-parse", "--abbrev-ref", "HEAD"),
    GITHUB_SHA: env.GITHUB_SHA ?? git("rev-parse", "HEAD"),
  }, now);
}

/**
 * The IG Publisher's page chrome: its stylesheets (`fhir.css`,
 * `bootstrap-fhir.css`) and its "Generated <date>" footer. A page carrying
 * any of them is the Publisher's finished HTML, which this site never
 * publishes (owner, 2026-10-14).
 */
export const PUBLISHER_CHROME: readonly RegExp[] = [
  /<link\b[^>]*href="(?:[^"]*\/)?fhir\.css"/i,
  /bootstrap-fhir\.css/i,
  /Generated <span title="/,
];

/** The built pages that carry the Publisher's chrome, relative to the site. */
export function publisherChromePages(site: string): string[] {
  return filesUnder(site).filter((p) => /\.html?$/i.test(p) && PUBLISHER_CHROME.some((re) => re.test(readFileSync(join(site, p), "utf-8"))));
}

/** What `publisher-pages` put in the site. */
export interface ServedData {
  /** Resources served at the root under the Publisher's name, `<Type>-<id>.json`, the one copy the pages draw. */
  named: number;
  /** Root paths the site already held, so the AST's copy was not laid over them (the pages show the site's file). */
  kept: number;
  /** IG API sidecar files served under `fhir-artifact-index/sidecars/`. */
  sidecars: number;
  /** Files the layer above wrote for the site root, served; and those the site already held, not laid over. */
  siteFiles: number;
  siteKept: string[];
  /** Pages of the IG's own that held the layer's placeholder, replaced by the layer's file. */
  siteFilled: string[];
  /** Whether the artefact index is served at `fhir-artifact-index/index.json`. */
  index: boolean;
  /** Libraries served with their CQL by URL and no ELM ({@link libraryByUrl}). */
  librariesByUrl?: number;
}

/** Copy a file into the site unless the site already holds that path. */
function serve(from: string, site: string, rel: string): boolean {
  const to = join(site, rel);
  if (existsSync(to)) return false;
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to);
  return true;
}

/** Where a Library's CQL is read from: the IG's `input/cql/` and the URL each file is published at. */
export interface CqlSource {
  dir: string;
  url: (file: string) => string;
}

/** The compiled-logic content types a docs-site Library leaves out: the ELM ships in the release package. */
export const ELM_CONTENT_TYPES: ReadonlySet<string> = new Set(["application/elm+xml", "application/elm+json"]);

/**
 * A Library as the docs site serves it (owner, 2026-11-08, card "ELM", option
 * A: reference the CQL from the KG). The compiled ELM (`application/elm+xml`,
 * `application/elm+json`, about 80% of each file as base64) is left out, and
 * the CQL is an `Attachment.url` to the CQL source the IG holds instead of
 * base64 `data`, so a viewer loads it on demand. CQL whose source file the IG
 * does not hold is kept inline, never dropped. Undefined: not a Library, or
 * nothing to change.
 */
export function libraryByUrl(resource: unknown, cql: CqlSource): object | undefined {
  const r = resource as { resourceType?: string; id?: string; name?: string; content?: Array<{ contentType?: string; data?: string; url?: string }> };
  if (r?.resourceType !== "Library" || !Array.isArray(r.content)) return undefined;
  const file = [r.name, r.id].filter((x): x is string => typeof x === "string" && /^[A-Za-z0-9._-]+$/.test(x)).map((n) => `${n}.cql`).find((f) => existsSync(join(cql.dir, f)));
  let changed = false;
  const content = r.content.flatMap((c) => {
    if (c.contentType && ELM_CONTENT_TYPES.has(c.contentType)) {
      changed = true;
      return [];
    }
    if (c.contentType === "text/cql" && c.data !== undefined && file !== undefined) {
      changed = true;
      const { data: _data, ...rest } = c;
      return [{ ...rest, url: cql.url(file) }];
    }
    return [c];
  });
  return changed ? { ...r, content } : undefined;
}

/**
 * Serve the AST's data in the built site: each resource once, by the
 * Publisher's name at the root, the artefact index, and the IG API sidecars.
 * Never the Publisher's HTML, and never a path the site already holds. With
 * `cql`, a Library is served by {@link libraryByUrl}: its CQL by URL, no ELM.
 */
export function serveAstData(o: { site: string; ast: string; index?: string; igApi?: IgApi; cql?: CqlSource }): ServedData {
  const manifest = join(o.ast, "manifest.json");
  if (!existsSync(manifest)) throw new Error(`${o.ast}: no AST to serve — run ${IG_SITE_SCRIPTS.ast} first`);
  const out: ServedData = { named: 0, kept: 0, sidecars: 0, siteFiles: 0, siteKept: [], siteFilled: [], index: false };
  const m = JSON.parse(readFileSync(manifest, "utf-8")) as { resources?: { resourceType?: string; id?: string; file?: string }[] };
  for (const r of m.resources ?? []) {
    if (!r.file || !r.resourceType || !r.id) continue;
    const src = join(o.ast, r.file);
    if (!existsSync(src)) continue;
    const rel = `${r.resourceType}-${r.id}.json`;
    if (!serve(src, o.site, rel)) {
      out.kept += 1;
      continue;
    }
    out.named += 1;
    if (o.cql && r.resourceType === "Library") {
      const slim = libraryByUrl(JSON.parse(readFileSync(src, "utf-8")), o.cql);
      if (slim) {
        writeFileSync(join(o.site, rel), `${JSON.stringify(slim, null, 2)}\n`);
        out.librariesByUrl = (out.librariesByUrl ?? 0) + 1;
      }
    }
  }
  if (o.index && existsSync(o.index)) out.index = serve(o.index, o.site, join(INDEX_SERVED, "index.json"));
  if (o.igApi) {
    for (const f of readdirSync(o.igApi.sidecars).sort()) {
      const from = join(o.igApi.sidecars, f);
      if (statSync(from).isFile() && serve(from, o.site, join(SIDECARS_SERVED, f))) out.sidecars += 1;
    }
    if (o.igApi.site) {
      for (const f of filesUnder(o.igApi.site)) {
        if (serve(join(o.igApi.site, f), o.site, f)) out.siteFiles += 1;
        else if (o.igApi.placeholder && /\.html?$/i.test(f) && readFileSync(join(o.site, f), "utf-8").includes(o.igApi.placeholder)) {
          // The IG's page is a shell around the layer's marker: the layer's page is its content.
          cpSync(join(o.igApi.site, f), join(o.site, f));
          out.siteFilled.push(f);
        } else out.siteKept.push(f);
      }
    }
  }
  return out;
}

/**
 * The CQL a docs-site Library links (card "ELM", option A): the IG's
 * `input/cql/` file at the commit being built, on the repository the site
 * step names (`SITE_REPOSITORY`, `SITE_COMMIT`). Undefined without either, or
 * with no `input/cql/`: the Libraries are then served as the AST holds them.
 */
export function cqlSourceOf(ig: string | undefined, env: Record<string, string | undefined> = process.env): CqlSource | undefined {
  const repo = env.SITE_REPOSITORY;
  const commit = env.SITE_COMMIT;
  if (!ig || !repo || !commit || !/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^[0-9a-f]{7,40}$/.test(commit)) return undefined;
  const dir = join(ig, CQL_DIR);
  if (!existsSync(dir)) return undefined;
  return { dir, url: (file) => `https://raw.githubusercontent.com/${repo}/${commit}/${CQL_DIR}/${encodeURIComponent(file)}` };
}

/** Where an IG keeps its CQL. */
export const CQL_DIR = "input/cql";

export function publisherPages(o: { site: string; ast: string; work?: string; ig?: string; cql?: CqlSource; log?: (s: string) => void }): ServedData {
  const log = o.log ?? ((s: string) => console.error(s));
  if (!existsSync(o.site) || !statSync(o.site).isDirectory()) throw new Error(`${o.site}: no built site`);
  const igApi = readIgApi(o.work);
  const index = o.work ? join(o.work, INDEX_WORK, "index.json") : undefined;
  const served = serveAstData({ site: o.site, ast: o.ast, ...(index ? { index } : {}), ...(igApi ? { igApi } : {}), ...(o.cql ? { cql: o.cql } : {}) });
  if (served.librariesByUrl) log(`publisher pages: ${served.librariesByUrl} Library resource(s) link their CQL in ${CQL_DIR}/ by URL; their ELM is left to the release package`);
  log(
    `publisher pages: from the AST, ${served.named} resource(s) as <Type>-<id>.json at the root (no ast-data/ mirror)` +
      `${served.kept ? ` (${served.kept} the site already held were kept)` : ""}; ` +
      `${served.index ? `the artefact index at ${INDEX_SERVED}/index.json` : "no artefact index served"}; ` +
      `${served.sidecars} IG API sidecar(s) at ${SIDECARS_SERVED}/; ${served.siteFiles} file(s) the layer above wrote for the site root. The Publisher's HTML is not taken`,
  );
  if (served.siteFilled.length) log(`publisher pages: ${served.siteFilled.length} page(s) of the IG's own held the layer above's placeholder and are its page now: ${served.siteFilled.join(", ")}`);
  // The IG API hub, drawn from the index's bound sidecars (bean `h7ap`): at the
  // IG's page holding the placeholder, or `ig-api.html`. Laid over a page the
  // site holds only when that page is the placeholder's shell or the layer's own.
  if (igApi && index && existsSync(index)) {
    const ix = JSON.parse(readFileSync(index, "utf-8")) as FhirArtifactIndex;
    if (hasIgApi(ix)) {
      const page = o.ig !== undefined ? igApiHubPageOf(o.ig, igApi.placeholder) : IG_API_HUB_DEFAULT_PAGE;
      const at = join(o.site, page);
      const mine = !existsSync(at) || (igApi.site !== undefined && existsSync(join(igApi.site, page))) || (igApi.placeholder !== undefined && readFileSync(at, "utf-8").includes(igApi.placeholder));
      if (mine) {
        const openapi = existsSync(join(o.site, "openapi", "index.html"));
        const documents = igApi.site ? readdirSync(igApi.site).filter((f) => f.endsWith(".schema.json") && statSync(join(igApi.site!, f)).isFile()) : [];
        writeIgApiHubSite({ site: o.site, ix, label: igApi.label ?? "IG API", page, openapi, documents });
        log(`publisher pages: the ${igApi.label ?? "IG API"} hub at ${page}, drawn from the index (${hubEntries(ix).length} sidecar(s))`);
      } else log(`publisher pages: ${page} is a page of the IG's own without the hub's placeholder; no hub written over it`);
    }
  }
  if (served.siteKept.length) log(`publisher pages: the site already held ${served.siteKept.length} path(s) the layer above also wrote, kept as the site built them: ${served.siteKept.slice(0, 10).join(", ")}`);
  // The guard: whatever put it there, a page wearing the Publisher's chrome is not published.
  const chrome = publisherChromePages(o.site);
  if (chrome.length) throw new Error(`${chrome.length} page(s) of the built site carry the IG Publisher's chrome (fhir.css, bootstrap-fhir.css or its "Generated" footer) — the Publisher's HTML is not published:\n  ${chrome.slice(0, 20).join("\n  ")}`);
  const renamed = dedupeSiteIds(o.site);
  if (renamed.size) log(`publisher pages: repeated element ids repaired on ${renamed.size} page(s)`);
  if (o.ig !== undefined) {
    const stamped = stampTranslationMeta(o.site, o.ig);
    log(`publisher pages: the language picker's block (fa-translation-meta) written on ${stamped} page(s) that lacked one`);
    const barred = stampIgBar(o.site, igTitle(o.ig) ?? basename(resolve(o.ig)));
    log(`publisher pages: the IG's slim bar given to ${barred.pages} page(s) that had another or none, with the shared page layout`);
    const tocd = stampIgTocNav(o.site);
    log(`publisher pages: the IG's TOC declared for the rail on ${tocd.pages} thin page(s) that lacked it`);
    const stamp = igSiteStamp(o.ig);
    const validity = o.work ? join(o.work, VALIDITY_FILE) : undefined;
    if (validity && existsSync(validity)) {
      const v = JSON.parse(readFileSync(validity, "utf-8")) as AstValidity;
      stamp.ast = { commit: v.recorded?.sourceRevision, verdict: v.verdict };
      // P4: which kind of build made the AST. Read from the manifest alone, so
      // a manifest the stamp cannot read leaves the kind out rather than guessing.
      try {
        stamp.ast.kind = buildKind({ manifest: JSON.parse(readFileSync(join(o.ast, "manifest.json"), "utf-8")) });
      } catch {
        // no kind: the stamp says only what it knows
      }
      if (v.verdict !== "valid") log(`publisher pages: the artefact pages come from an AST that is ${v.verdict} (built from ${v.recorded?.sourceRevision?.slice(0, 7) ?? "an unrecorded revision"}), not from ${stamp.source.commit?.slice(0, 7) ?? "the source"}; ${STAMP_FILE} says so`);
    }
    writeFileSync(join(o.site, STAMP_FILE), `${JSON.stringify(stamp, null, 2)}\n`);
    log(`publisher pages: stamped ${STAMP_FILE} — ${stamp.instance}, platform ${stamp.platform.commit.slice(0, 9)}`);
  }
  return served;
}

/**
 * `ig-site:bar`, a FINAL step of the site build (cat-harness-tools
 * `build-instance-site.ts` `finalSteps`): the language picker's block and the
 * IG's slim bar ({@link stampIgBar}) on the pages the platform writes AFTER
 * `publisher-pages` — the identifier lookup page and the mounted layer
 * docs. Owner, 2026-10-15: those pages get the search box too. Both stamps
 * leave a page that already carries them as it was, so the pages
 * `publisher-pages` stamped are untouched.
 */
export function lateBar(site: string, ig: string): { lang: number; pages: number } {
  const lang = stampTranslationMeta(site, ig);
  const { pages } = stampIgBar(site, igTitle(ig) ?? basename(resolve(ig)));
  return { lang, pages };
}

if (import.meta.main) {
  const [cmd, target, ...rest] = process.argv.slice(2);
  const args = cmd === "ast" ? [target, ...rest].filter((x): x is string => x !== undefined) : rest;
  const opt = (k: string): string | undefined => {
    const i = args.indexOf(`--${k}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const ig = resolve(opt("ig") ?? ".");
  // The site build's work directory: where a layer above leaves the IG API sidecars, and `compose` the index.
  const work = opt("work") ?? process.env.SITE_WORK;
  try {
    if (cmd === "ast") {
      restoreAst({ ig, ...(work ? { work } : {}), acceptStale: acceptStaleFromEnv(process.env[ACCEPT_STALE_ENV]), preview: isPreviewBase(process.env.SITE_BASEURL ?? process.env.FOLIO_SITE_BASEURL) });
    } else if (cmd === "compose" && target) {
      const baseurl = opt("baseurl") ?? process.env.FOLIO_SITE_BASEURL;
      if (baseurl === undefined) throw new Error("compose needs --baseurl, or FOLIO_SITE_BASEURL from the site build");
      compose({ docs: resolve(target), ig, baseurl, ...(work ? { work } : {}), ...(opt("plantuml-jar") ? { plantumlJar: opt("plantuml-jar")! } : {}) });
    } else if (cmd === "publisher-pages" && target) {
      const cql = cqlSourceOf(ig);
      publisherPages({ site: resolve(target), ast: join(ig, AST_DIR), ...(work ? { work } : {}), ig, ...(cql ? { cql } : {}) });
    } else if (cmd === "bar" && target) {
      const r = lateBar(resolve(target), ig);
      console.log(`bar: the language picker's block on ${r.lang} and the IG's slim bar on ${r.pages} page(s) the platform wrote after publisher-pages`);
    } else {
      console.error(
        "usage: ig-repo-site.ts ast [--ig <checkout>] [--work <dir>]\n" +
          "       ig-repo-site.ts compose <site source> [--ig <checkout>] [--baseurl <base>] [--plantuml-jar <jar>] [--work <dir>]\n" +
          "       ig-repo-site.ts publisher-pages <built site> [--ig <checkout>] [--work <dir>]\n" +
          "       ig-repo-site.ts bar <built site> [--ig <checkout>]",
      );
      process.exit(2);
    }
  } catch (e) {
    console.error(`✗ ig-repo-site ${cmd}: ${(e as Error).message}`);
    process.exit(1);
  }
}
