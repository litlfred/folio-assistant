#!/usr/bin/env bun
/**
 * One landing page shape for every harnessed site, built from what the site
 * holds and laid out as its navbar is.
 *
 * Owner, 2026-11-28: *"I wanna make the landing pages for things like
 * DTH–HRH, smart-RA, QOU, litlfred/mathlib4, etc more consistent. Start with
 * the intro/overview on content harnessed in repo (what it is). Then (if any)
 * "Documents" which is bullet list of things under folio/ with links for each
 * of: pdf, interactive site, KG json(ld). Then Folder (ones with content in the
 * repos KG by default with option to show all in harness dependency. LHS
 * navbar should only show those with active content). Then Processes (w/ any
 * skills and tools associated) if any in the repo. Then visualizers (...) that
 * are turned on within harness depdency (default to show only w/ content,
 * toggle to show all). Last is harnesses in depdency tree with some links to
 * their docs/KGs, etc. landing page and navbar should align (execpt user can
 * override landing page, so dont worry then)."*
 *
 * ## Where the rows come from: the navbar's own data
 *
 * The page's rail data (`assets/navbar/rail-<hash>.js`, written by the rail
 * pass just before this one) is the navbar. The Folders section is its
 * Folders rows, the Visualizers section its Pages rows and the landing's own
 * visualiser links, the Harnesses section its Harnesses rows. So the landing
 * and the navbar cannot disagree about what a site holds: they read one list.
 * The navbar shows only the rows that open (`liveRows`); the landing shows
 * those first and the rest behind a `<details>` toggle, with the reason each
 * has no page.
 *
 * ## When it runs, and when it does not
 *
 * On the site's ROOT `index.html` only, after the rail pass, and only when the
 * page is the generated document landing (an `<h1>` reading "Documents") or
 * carries {@link LANDING_SECTIONS_MARKER}. A layer that writes its own home
 * page (`site.build.home`) is left alone: the owner's "user can override
 * landing page".
 *
 * Usage: bun run cat-harness-tools/scripts/gen-landing-sections.ts --site <built site> [--root <checkout>] --instance <name>
 *
 * @module cat-harness-tools/scripts/gen-landing-sections
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { readDeclaration } from "../schemas/kg/cat-harness.js";
import { dependencyClosure, instanceRoots } from "./gen-processes-viz.ts";
import { railDataJson, railPageOf } from "./lib/harness-rail.ts";

/** A page that asks for the sections without being the generated document landing. */
export const LANDING_SECTIONS_MARKER = "<!-- fa-landing-sections -->";

/** One navbar row as the shared rail data carries it. */
export interface RailRow {
  label: string;
  href?: string;
  note?: string;
  description?: string;
  children?: RailRow[];
}

/** The shared rail data, as far as this page reads it. */
export interface RailData {
  instance?: string;
  links?: RailRow[];
  pages?: RailRow[];
  harnesses?: RailRow[];
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A rail href (`@fa-rail-to-root@/x/`) as a link from the site root. */
export function fromRoot(href: string): string {
  return href.replace(/^@fa-rail-to-root@\//, "").replace(/^\.\//, "") || "./";
}

/** Is `href` a page of this site that exists under `site`? External links count as present. */
function present(site: string, href: string): boolean {
  if (/^[a-z]+:/i.test(href)) return true;
  const p = href.split(/[?#]/)[0]!;
  if (p === "" || p === "./") return true;
  return existsSync(join(site, p)) || existsSync(join(site, p, "index.html"));
}

/** Short Markdown (inline code, links, emphasis) as HTML, for a declaration's description. */
export function inlineMd(md: string): string {
  return esc(md)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function rowLi(r: RailRow, why?: string): string {
  const desc = r.description ? ` <span class="fa-landing-desc">— ${esc(r.description)}</span>` : "";
  const label = r.href ? `<a href="${esc(fromRoot(r.href))}">${esc(r.label)}</a>` : esc(r.label);
  const note = !r.href && (why ?? r.note) ? ` <em class="fa-landing-note">(${esc(why ?? r.note!)})</em>` : "";
  return `<li>${label}${note}${desc}</li>`;
}

/** A list with the rows that open first and the others behind a toggle. */
export function liveThenAll(live: readonly string[], rest: readonly string[], restLabel: string): string {
  const head = live.length ? `<ul>${live.join("")}</ul>` : `<p><em>None on this site yet.</em></p>`;
  if (rest.length === 0) return head;
  return `${head}\n<details class="fa-landing-all"><summary>${esc(restLabel)} (${rest.length})</summary><ul>${rest.join("")}</ul></details>`;
}

/** The items of an `<h2>Also on this site</h2>` list, split into this site's pages and the about links. */
export function alsoItems(html: string): { visualisers: string[]; about: string[]; span?: [number, number] } {
  const m = /<h2\b[^>]*>\s*Also on this site\s*<\/h2>\s*<ul>([\s\S]*?)<\/ul>/.exec(html);
  if (!m) return { visualisers: [], about: [] };
  const items = [...m[1]!.matchAll(/<li>[\s\S]*?<\/li>/g)].map((x) => x[0]);
  const isAbout = (li: string) => /href="(https?:|contributing\/|LICENSE)/i.test(li);
  return { visualisers: items.filter((x) => !isAbout(x)), about: items.filter(isAbout), span: [m.index, m.index + m[0].length] };
}

/** The declared directories of each layer in `names`, as "not on this site" rows. */
function dependencyFolders(repo: string, names: readonly string[], shown: ReadonlySet<string>): string[] {
  const out: string[] = [];
  for (const root of instanceRoots(repo)) {
    let decl: ReturnType<typeof readDeclaration>;
    try {
      decl = readDeclaration(root);
    } catch {
      continue;
    }
    if (!decl?.name || !names.includes(decl.name)) continue;
    for (const d of (decl as { directories?: { path?: string; graphTypologies?: string[] }[] }).directories ?? []) {
      if (!d.path) continue;
      const key = `${decl.name}:${d.path}`;
      if (shown.has(key)) continue;
      out.push(`<li><code>${esc(d.path)}</code> <span class="fa-landing-desc">— ${esc(decl.name)}${d.graphTypologies?.length ? `, ${esc(d.graphTypologies.join(", "))}` : ""}</span></li>`);
    }
  }
  return out;
}

/** The sections, given everything they are made of. Pure, so it is testable without a site. */
export function landingSections(o: {
  instance: string;
  title?: string;
  description?: string;
  rail: RailData;
  /** `<li>`s of this site's own visualiser pages (the landing's "Also on this site"). */
  visualisers: readonly string[];
  /** `<li>`s of the about links (source, contributing, licence). */
  about: readonly string[];
  /** Processes and tools pages for this layer, from the site root, when the site holds them. */
  processes?: string;
  tools?: string;
  /** The layers this one is built on, nearest first. */
  dependencies: readonly string[];
  /** Rows for the dependencies' declared directories (`dependencyFolders`). */
  dependencyFolders: readonly string[];
  /** Harness page → its JSON-LD exists. */
  harnessJsonld: (href: string) => boolean;
  /** The documents' own pages (`en/<slug>/`), already listed under Documents, so not repeated as visualisers. */
  documentPages?: ReadonlySet<string>;
}): { intro: string; rest: string } {
  // The rail's descriptions end with the layer's title ("…, Quantum Observable
  // Universe"); on the layer's own landing that repeats the heading.
  const strip = (r: RailRow): RailRow =>
    o.title && r.description?.endsWith(`, ${o.title}`) ? { ...r, description: r.description.slice(0, -(o.title.length + 2)) } : r;
  const intro =
    `<section class="fa-landing-intro">` +
    (o.description ? `<p>${inlineMd(o.description)}</p>` : "") +
    (o.about.length ? `<p class="fa-landing-about">${o.about.map((li) => li.replace(/^<li>|<\/li>$/g, "")).join(" · ")}</p>` : "") +
    `</section>`;
  const links = o.rail.links ?? [];
  const live = links.filter((r) => r.href).map(strip);
  const dead = links.filter((r) => !r.href).map(strip);
  const folders = liveThenAll(
    live.map((r) => rowLi(r)),
    [...dead.map((r) => rowLi(r, r.note ?? "no page on this site")), ...o.dependencyFolders],
    o.dependencies.length ? "Show all, including the folders of the harnesses it is built on" : "Show all declared folders",
  );
  const proc: string[] = [];
  if (o.processes) proc.push(`<li><a href="${esc(o.processes)}">Processes</a> — this layer's BPMN processes, and those of the harnesses it is built on, each with the skills its steps run</li>`);
  if (o.tools) proc.push(`<li><a href="${esc(o.tools)}">Tools</a> — the tools this layer declares</li>`);
  const norm = (h: string) => fromRoot(h).replace(/index\.html$/, "").replace(/\/?$/, "/");
  const isTools = (r: RailRow) => r.href !== undefined && /(^|\/)tools\//.test(fromRoot(r.href));
  const allPages = (o.rail.pages ?? []).filter((r) => r.label !== "Documents" && !(r.href && o.documentPages?.has(norm(r.href))));
  // A tools page belongs with the processes whose steps run them, not with the visualisers.
  if (!o.tools) {
    const t = allPages.find((r) => isTools(r) && /\/tools\/[^/]+\/?$/.test(fromRoot(r.href!))) ?? allPages.find(isTools);
    if (t) proc.push(`<li><a href="${esc(fromRoot(t.href!))}">Tools</a> — the tools this layer and the harnesses it is built on declare</li>`);
  }
  const pages = allPages.filter((r) => !isTools(r));
  const vLive = [...o.visualisers, ...pages.filter((r) => r.href).map((r) => rowLi({ ...r, children: [] }))];
  const vDead = pages.filter((r) => !r.href && !(r.children ?? []).some((c) => c.href)).map((r) => rowLi(r, r.note ?? "not built on this site"));
  const harnesses = (o.rail.harnesses ?? []).map((h) => {
    const href = h.href ? fromRoot(h.href) : undefined;
    const kg = href && o.harnessJsonld(href) ? ` · <a href="${esc(href.replace(/\/?$/, "/"))}index.jsonld">KG (JSON-LD)</a>` : "";
    return `<li>${href ? `<a href="${esc(href)}">${esc(h.label)}</a>` : esc(h.label)}${kg}${h.description ? ` <span class="fa-landing-desc">— ${esc(h.description)}</span>` : ""}</li>`;
  });
  const rest = [
    `<h2 id="folders">Folders</h2>`,
    folders,
    ...(proc.length ? [`<h2 id="processes">Processes</h2>`, `<ul>${proc.join("")}</ul>`] : []),
    `<h2 id="visualizers">Visualizers</h2>`,
    liveThenAll(vLive, vDead, "Show all"),
    ...(harnesses.length ? [`<h2 id="harnesses">Harnesses</h2>`, `<p>The harnesses this site is built on${o.dependencies.length ? ", nearest first" : ""}.</p>`, `<ul>${harnesses.join("")}</ul>`] : []),
  ].join("\n");
  return { intro, rest };
}

/** Each document row gets a link to its knowledge graph, `<slug>/graph.jsonld`, where the site holds one. */
export function withDocumentKgLinks(html: string, has: (path: string) => boolean): string {
  return html.replace(/<li><a href="(?:\.\/)?en\/([a-z0-9][a-z0-9-]*)\/index\.html">([\s\S]*?)<\/li>/g, (li, slug: string) => {
    const kg = `${slug}/graph.jsonld`;
    if (!has(kg) || li.includes(kg)) return li;
    return li.replace(/<\/li>$/, ` · <a href="${kg}">KG (JSON-LD)</a></li>`);
  });
}

const STYLE = `<style>.fa-landing-desc{opacity:.75;font-size:.92em}.fa-landing-note{opacity:.7;font-size:.9em}.fa-landing-all{margin:.25rem 0 1rem}.fa-landing-all summary{cursor:pointer}.fa-landing-about{font-size:.92em}</style>`;

/** Rewrite the root landing in `site` for `instance`; returns what it did. */
export function writeLandingSections(site: string, repo: string, instance: string): string {
  const file = join(site, "index.html");
  if (!existsSync(file)) return "no index.html";
  let html = readFileSync(file, "utf-8");
  if (html.includes('class="fa-landing-intro"')) return "already has the sections";
  const h1 = /<h1\b[^>]*>\s*Documents\s*<\/h1>/.exec(html);
  if (!h1 && !html.includes(LANDING_SECTIONS_MARKER)) return "not a generated landing (the layer writes its own home page): left as is";
  const page = railPageOf(html);
  let rail: RailData = {};
  if (page) {
    const f = join(site, "assets", "navbar", `${page.data}.js`);
    if (existsSync(f)) rail = JSON.parse(railDataJson(readFileSync(f, "utf-8"))) as RailData;
  }
  const root = instanceRoots(repo).find((r) => {
    try {
      return readDeclaration(r)?.name === instance;
    } catch {
      return false;
    }
  });
  const decl = root ? readDeclaration(root) : undefined;
  const deps = dependencyClosure(instance, repo);
  const shown = new Set<string>();
  const also = alsoItems(html);
  const at = (p: string) => (present(site, p) ? p : undefined);
  const { intro, rest } = landingSections({
    instance,
    ...(decl?.title ? { title: decl.title } : {}),
    ...(decl?.description ? { description: decl.description } : {}),
    rail,
    visualisers: also.visualisers,
    about: also.about,
    ...(at(`en/cat-harness/processes/${instance}/`) ? { processes: `en/cat-harness/processes/${instance}/` } : {}),
    ...(at(`en/cat-harness/tools/${instance}/`) ? { tools: `en/cat-harness/tools/${instance}/` } : {}),
    dependencies: deps,
    dependencyFolders: dependencyFolders(repo, deps, shown),
    harnessJsonld: (href) => existsSync(join(site, href.split(/[?#]/)[0]!.replace(/\/?$/, "/"), "index.jsonld")),
    documentPages: new Set([...html.matchAll(/<li><a href="(?:\.\/)?(en\/[a-z0-9][a-z0-9-]*\/)index\.html">/g)].map((m) => m[1]!)),
  });
  if (also.span) html = html.slice(0, also.span[0]) + rest + html.slice(also.span[1]);
  else if (html.includes(LANDING_SECTIONS_MARKER)) html = html.replace(LANDING_SECTIONS_MARKER, rest);
  else {
    // No "Also on this site" list: the sections go at the end of the page's content.
    const end = /<\/(?:article|main)>/.exec(html) ?? /<\/body>/.exec(html);
    html = end ? html.slice(0, end.index) + rest + "\n" + html.slice(end.index) : html + rest;
  }
  if (h1) {
    const title = decl?.title ?? rail.instance ?? instance;
    html = html.replace(h1[0], `${STYLE}<h1>${esc(title)}</h1>\n${intro}\n<h2 id="documents">Documents</h2>`);
  } else {
    html = html.replace(rest, `${STYLE}${intro}\n${rest}`);
  }
  html = withDocumentKgLinks(html, (p) => existsSync(join(site, p)));
  writeFileSync(file, html);
  return `landing sections written (${(rail.links ?? []).filter((r) => r.href).length} folder(s) with a page, ${deps.length} harness(es) built on)`;
}

if (import.meta.main) {
  const a = process.argv.slice(2);
  const one = (k: string) => (a.indexOf(k) >= 0 ? a[a.indexOf(k) + 1] : undefined);
  const site = one("--site");
  const instance = one("--instance");
  if (!site || !instance) {
    console.error("usage: gen-landing-sections.ts --site <built site> [--root <checkout>] --instance <name>");
    process.exit(2);
  }
  console.log(`landing sections: ${writeLandingSections(resolve(site), resolve(one("--root") ?? "."), instance)}`);
}
