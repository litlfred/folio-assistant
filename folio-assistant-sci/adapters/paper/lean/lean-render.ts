#!/usr/bin/env bun
/**
 * lean-render — publish a Lean package's doc-gen4 HTML under a folio's site,
 * wrapped in the harness navbar and rail.
 *
 * Owner, 2026-10-10: *"there should be a lean/ visualizer which is then the
 * lean html render (but wrapped w/ cat-harness navbar chrome/rails)"*. The
 * render is doc-gen4's; this script does not re-render anything. It STAGES the
 * render into the folio's site tree and then runs the platform's own rail pass,
 * `cat-harness/scripts/rail-standalone-pages.ts --foreign-site`, exactly as
 * `folio-assistant-core/scripts/stage-folio-local.ts` does for the folio's own
 * pages. One rail implementation; this file only prepares its input.
 *
 * ## What staging does, and why each step is needed
 *
 * 1. **Copies the render to `<site>/<route>/`** (default route `lean`), leaving
 *    out Lake's build bookkeeping. doc-gen4's output directory is a Lake build
 *    directory: beside every page sit `<page>.html.hash` and `.html.trace`
 *    (4,646 of them in qou's July render, more files than there are pages).
 *    They are Lake's, they describe a build nobody can reproduce from the
 *    site, and publishing them would double the file count for nothing.
 *
 * 2. **Marks the pages that must NOT get a rail** with the platform's own
 *    opt-out, `<meta name="folio-navbar" content="none">`, which every rail
 *    pass honours (`declinesNavbar`, #1881). Two kinds of doc-gen4 page are not
 *    pages a reader stays on:
 *    - `navbar.html` is loaded INTO AN IFRAME on every module page
 *      (`<iframe src="./navbar.html" class="navframe">`, and it carries
 *      `<base target="_parent">`). Railing it would draw a second harness rail
 *      inside the doc-gen4 sidebar of every page.
 *    - `find/index.html` has an empty body: it is a script that resolves a
 *      declaration name and redirects.
 *    Detected by those two properties, not by filename, so a doc-gen4 release
 *    that renames them is still handled.
 *
 * 3. **Optionally prunes to the folio's own modules** (`--modules QOU,UGB`).
 *    doc-gen4's `:docs` facet renders every module in the import closure, so a
 *    Mathlib-based package publishes Mathlib too: in qou's July render 337 MB
 *    of 545 MB was `Mathlib/`. Pruned, every link from a kept page into a
 *    dropped module is rewritten to `--external-base` (default: the
 *    community's mathlib4 docs), so nothing the reader can click 404s.
 *    STATED LIMITS, not hidden ones: the external docs are built from THEIR
 *    Mathlib, not the folio's pinned one, so a declaration can have moved; and
 *    doc-gen4's search reads `declarations/declaration-data.bmp`, which is
 *    binary and still lists dropped declarations, whose hits then 404.
 *    Default is NO pruning: full fidelity unless the folio asks.
 *
 * 4. **Adds a layout shim** to every page that will be railed
 *    ({@link RAIL_OFFSET_STYLE}): doc-gen4's header and sidebar are
 *    `position: fixed`, so the rail's body padding does not move them.
 *
 * Then the rail pass runs over the WHOLE site, not the subtree, because the
 * rail's depth (`..` per directory) and its home link are computed from the
 * site root. The pass is idempotent (`injectRail` refuses a page already
 * navigated), so pages railed by an earlier step are left byte-identical.
 *
 * ## Usage
 *
 *   bun run folio-assistant-sci/adapters/paper/lean/lean-render.ts \
 *     --docs <lake-root>/.lake/build/doc --site _site [--route lean] \
 *     [--module qou --module ugb | --modules QOU,UGB] [--external-base <url>] \
 *     [--home-label qou] [--instance <name>] [--platform <index root>] [--no-rail]
 *
 * Exit 0 staged (and railed); 1 the rail pass failed; 2 usage, or the input
 * is not a doc-gen4 render — a missing or empty render is never a clean run.
 *
 * @module folio-assistant-sci/adapters/paper/lean/lean-render
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative, resolve, sep } from "node:path";

/** The platform's rail opt-out, exactly as `harness-rail.ts` `declinesNavbar` reads it. */
export const NAVBAR_NONE = `<meta name="folio-navbar" content="none">`;

/** The community's published docs, which carry Init, Std, Lean, Lake, Batteries and Mathlib. */
export const DEFAULT_EXTERNAL_BASE = "https://leanprover-community.github.io/mathlib4_docs/";

/** Lake's per-artefact bookkeeping, which doc-gen4's output directory carries beside every page. */
export function isBuildBookkeeping(name: string): boolean {
  return name.endsWith(".hash") || name.endsWith(".trace");
}

/** Is this directory a doc-gen4 render? Its root carries the declaration index and the iframe navbar. */
export function isDocGen4Render(dir: string): boolean {
  return existsSync(join(dir, "index.html")) && existsSync(join(dir, "navbar.html")) && existsSync(join(dir, "declarations"));
}

/**
 * Does this page want no rail? An iframe's content (`<base target="_parent">`)
 * or a page with nothing in its body (a script redirect). See the module doc.
 */
export function shouldDeclineRail(html: string): boolean {
  if (/<base\s+[^>]*target=["']_parent["']/i.test(html)) return true;
  return /<body\b[^>]*>\s*<\/body>/i.test(html);
}

/**
 * The layout shim a railed doc-gen4 page needs, keyed on the rail being there.
 *
 * The rail is a fixed 56 px column on the left and offsets the page with
 * `body { padding-left: 56px }` (`navbar.css`). doc-gen4 positions its header
 * and its left sidebar (`nav.nav`, which holds the module-tree iframe) with
 * `position: fixed`, which body padding does not move, so without this the
 * rail covers the first 56 px of the sidebar — measured in Chromium on qou's
 * render: rail 0–56 px, doc-gen4 sidebar iframe from 7.8 px.
 *
 * `body:has(nav.fa-nav)`, so a page staged with `--no-rail` and never railed
 * keeps doc-gen4's own layout rather than a gap where a rail would be.
 */
export const RAIL_OFFSET_STYLE =
  `<style data-lean-render="rail-offset">` +
  `body:has(nav.fa-nav)>header{left:56px;width:calc(100% - 56px)}` +
  `body:has(nav.fa-nav)>nav.nav{left:calc(56px + 1ex)}` +
  `@media print{body:has(nav.fa-nav)>header{left:0;width:100%}body:has(nav.fa-nav)>nav.nav{left:1ex}}` +
  `</style>`;

/** `html` with {@link RAIL_OFFSET_STYLE} before `</head>`, once. Pages without a `</head>` are returned unchanged. */
export function withRailOffset(html: string): string {
  if (html.includes(`data-lean-render="rail-offset"`)) return html;
  const head = /<\/head\s*>/i.exec(html);
  return head ? html.slice(0, head.index) + RAIL_OFFSET_STYLE + html.slice(head.index) : html;
}

/** `html` with the platform's opt-out meta added, once, right after `<head>`. */
export function withRailDeclined(html: string): string {
  if (/name=["']folio-navbar["']/i.test(html)) return html;
  const head = /<head\b[^>]*>/i.exec(html);
  if (!head) return html;
  const at = head.index + head[0].length;
  return html.slice(0, at) + NAVBAR_NONE + html.slice(at);
}

/**
 * The top-level MODULE ROOT a render-relative path belongs to, or undefined
 * for doc-gen4's own files. A module root is an upper-case name: the
 * directory `Mathlib/` or the page `Mathlib.html`. doc-gen4's infrastructure
 * (`declarations/`, `find/`, `style.css`, `navbar.html`, …) is lower-case.
 */
export function moduleRootOf(renderRel: string): string | undefined {
  const first = renderRel.split("/")[0] ?? "";
  // `Mathlib.html` and its Lake bookkeeping `Mathlib.html.hash` both belong to `Mathlib`.
  const name = first.replace(/\.html(\..*)?$/, "");
  return /^[A-Z]/.test(name) ? name : undefined;
}

/**
 * Rewrite every relative `href` in a kept page that lands in a DROPPED module
 * to the same path under `externalBase`. `pageRel` is the page's path inside
 * the render, POSIX separators.
 */
export function rewriteDroppedLinks(html: string, pageRel: string, keep: ReadonlySet<string>, externalBase: string): { html: string; rewritten: number } {
  let rewritten = 0;
  const kept = new Set([...keep].map((k) => k.toLowerCase()));
  const base = externalBase.endsWith("/") ? externalBase : `${externalBase}/`;
  const out = html.replace(/\bhref="([^"]*)"/g, (whole, href: string) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#") || href.startsWith("/") || href === "") return whole;
    const [path, frag] = splitFragment(href);
    if (path === "") return whole;
    const target = posix.normalize(posix.join(posix.dirname(pageRel), path));
    if (target.startsWith("..")) return whole;
    const root = moduleRootOf(target);
    if (root === undefined || kept.has(root.toLowerCase())) return whole;
    rewritten++;
    return `href="${base}${target}${frag}"`;
  });
  return { html: out, rewritten };
}

function splitFragment(href: string): [string, string] {
  const i = href.search(/[#?]/);
  return i < 0 ? [href, ""] : [href.slice(0, i), href.slice(i)];
}

export interface StageOptions {
  /** The doc-gen4 output directory (`<lake-root>/.lake/build/doc`). */
  docs: string;
  /** The site being published. */
  site: string;
  /** Where under the site the render goes. Default `lean`. */
  route?: string;
  /** Module roots to keep (`QOU`, or its package name `qou`; matched case-insensitively). Absent: keep everything. */
  modules?: readonly string[];
  externalBase?: string;
}

export interface StageReport {
  dest: string;
  pages: number;
  files: number;
  bookkeepingSkipped: number;
  declined: string[];
  droppedModules: string[];
  linksRewritten: number;
}

/** Copy the render into the site, as the module doc describes. Replaces `<site>/<route>/` whole. */
export function stageLeanRender(o: StageOptions): StageReport {
  const src = resolve(o.docs);
  if (!isDocGen4Render(src)) {
    throw new Error(`${src} is not a doc-gen4 render (no index.html + navbar.html + declarations/) — build it with lean-docs-build.sh first`);
  }
  const route = (o.route ?? "lean").replace(/^\/+|\/+$/g, "");
  if (route === "" || route.split("/").includes("..")) throw new Error(`--route must name a directory under the site, got "${o.route}"`);
  const dest = join(resolve(o.site), route);
  // Case-insensitive, so a folio can name its Lake PACKAGES (`qou`, `fred2005`)
  // and keep the module roots they build (`QOU`, `Fred2005`).
  const keep = o.modules && o.modules.length > 0 ? new Set(o.modules.map((m) => m.toLowerCase())) : undefined;
  const externalBase = o.externalBase ?? DEFAULT_EXTERNAL_BASE;
  const report: StageReport = { dest, pages: 0, files: 0, bookkeepingSkipped: 0, declined: [], droppedModules: [], linksRewritten: 0 };
  const dropped = new Set<string>();

  rmSync(dest, { recursive: true, force: true });
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, e.name);
      const rel = relative(src, abs).split(sep).join("/");
      const root = moduleRootOf(rel);
      if (keep && root !== undefined && !keep.has(root.toLowerCase())) {
        dropped.add(root);
        continue;
      }
      if (e.isDirectory()) {
        walk(abs);
        continue;
      }
      if (isBuildBookkeeping(e.name)) {
        report.bookkeepingSkipped++;
        continue;
      }
      const to = join(dest, rel);
      mkdirSync(dirname(to), { recursive: true });
      report.files++;
      if (!e.name.endsWith(".html")) {
        copyFileSync(abs, to);
        continue;
      }
      report.pages++;
      let html = readFileSync(abs, "utf-8");
      if (shouldDeclineRail(html)) {
        html = withRailDeclined(html);
        report.declined.push(rel);
      } else {
        html = withRailOffset(html);
      }
      if (keep) {
        const r = rewriteDroppedLinks(html, rel, keep, externalBase);
        html = r.html;
        report.linksRewritten += r.rewritten;
      }
      writeFileSync(to, html);
    }
  };
  walk(src);
  report.droppedModules = [...dropped].sort();
  if (report.pages === 0) throw new Error(`${src}: no pages staged — that is not a pass`);
  return report;
}

/**
 * The index checkout that holds the rail pass: `--platform`, then
 * `$FOLIO_ASSISTANT_ROOT`, then the first ancestor of this file that has
 * `cat-harness/scripts/rail-standalone-pages.ts` (true when this layer is
 * mounted in an index, and through a folio's `folio-assistant/` link).
 */
export function findPlatform(explicit?: string): string | undefined {
  const RAIL = join("cat-harness", "scripts", "rail-standalone-pages.ts");
  for (const c of [explicit, process.env.FOLIO_ASSISTANT_ROOT]) {
    if (c && existsSync(join(c, RAIL))) return resolve(c);
  }
  let d = import.meta.dir;
  for (;;) {
    if (existsSync(join(d, RAIL))) return d;
    const up = dirname(d);
    if (up === d) return undefined;
    d = up;
  }
}

/**
 * Run the platform's rail pass over the whole site, exactly as
 * `stage-folio-local.ts` does. Returns false (and says so) when it fails.
 */
export function runRail(platform: string, site: string, homeLabel?: string, instance?: string): boolean {
  const args = ["run", join(platform, "cat-harness/scripts/rail-standalone-pages.ts"), "--site", resolve(site), "--built", "cat-harness", "--foreign-site"];
  if (homeLabel) args.push("--home-label", homeLabel);
  if (instance) args.push("--instance", instance);
  try {
    execFileSync("bun", args, { cwd: platform, stdio: "inherit" });
    return true;
  } catch {
    console.error("✗ the rail pass failed");
    return false;
  }
}

function main(): number {
  const argv = process.argv.slice(2);
  const at = (f: string): string | undefined => {
    const i = argv.indexOf(f);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const docs = at("--docs");
  const site = at("--site");
  if (!docs || !site) {
    console.error(
      "usage: lean-render.ts --docs <doc-gen4 out dir> --site <site dir> [--route lean] [--module <pkg>]... [--modules A,B] [--external-base <url>] [--home-label <name>] [--instance <name>] [--platform <index root>] [--no-rail]",
    );
    return 2;
  }
  // `--module <name>`, repeated, is the form the Tool node declares (one shell-safe
  // token each); `--modules A,B` is the same list for a person typing it.
  const modules = [
    ...(at("--modules")?.split(",") ?? []),
    ...argv.flatMap((a, i) => (a === "--module" && argv[i + 1] ? [argv[i + 1]!] : [])),
  ].map((s) => s.trim()).filter(Boolean);
  let r: StageReport;
  try {
    r = stageLeanRender({ docs, site, route: at("--route"), modules, externalBase: at("--external-base") });
  } catch (e) {
    console.error(`? ${(e as Error).message}`);
    return 2;
  }
  console.log(
    `lean-render: staged ${r.pages} page(s), ${r.files} file(s) into ${r.dest}; ` +
      `${r.bookkeepingSkipped} Lake .hash/.trace file(s) left out; ${r.declined.length} page(s) marked rail-declined (${r.declined.join(", ") || "none"})`,
  );
  if (r.droppedModules.length) {
    console.log(`  pruned ${r.droppedModules.length} module root(s) (${r.droppedModules.join(", ")}); ${r.linksRewritten} link(s) rewritten to the external docs`);
  }
  if (argv.includes("--no-rail")) {
    console.log("  --no-rail: NOT railed. Run rail-standalone-pages.ts --foreign-site over the site before publishing.");
    return 0;
  }
  const platform = findPlatform(at("--platform"));
  if (!platform) {
    console.error("? no index checkout with cat-harness/scripts/rail-standalone-pages.ts found (pass --platform or set FOLIO_ASSISTANT_ROOT) — staged but NOT railed, and that is not a pass");
    return 1;
  }
  if (!runRail(platform, site, at("--home-label"), at("--instance"))) return 1;
  // Every staged page must now carry the rail or have declined it.
  const unrailed: string[] = [];
  const check = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, e.name);
      if (e.isDirectory()) check(abs);
      else if (e.name.endsWith(".html")) {
        const html = readFileSync(abs, "utf-8");
        if (!/<nav class="fa-nav"|id="site-nav"|data-fa-rail/.test(html) && !/name=["']folio-navbar["'][^>]*content=["']none["']/.test(html)) {
          unrailed.push(relative(r.dest, abs));
        }
      }
    }
  };
  if (statSync(r.dest).isDirectory()) check(r.dest);
  if (unrailed.length) {
    console.error(`✗ ${unrailed.length} staged page(s) carry no rail, e.g. ${unrailed.slice(0, 3).join(", ")}`);
    return 1;
  }
  console.log(`✓ every staged page is railed or declined it`);
  return 0;
}

if (import.meta.main) process.exit(main());
