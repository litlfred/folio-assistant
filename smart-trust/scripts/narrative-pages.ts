/**
 * Render an IG's narrative pages — `input/pagecontent/*.md` — as Jekyll pages.
 *
 * Bean `jut3`: the owner asked for *"the input/page(s)/ content to be rendered
 * via justthedocs pipeline"* rather than mounting the Publisher's HTML. The
 * sources are copied verbatim by `ingest-ig-pages.ts`; this module resolves
 * the IG's Liquid, which the Publisher would otherwise do.
 *
 * ## The Liquid surface, measured rather than assumed
 *
 * Over smart-trust's 42 pages (bean `jut3` §M2): `include` 54, `assign` 6,
 * `unless` 6, `for` 1, no `sql`, no `[[[ ]]]` links. So this is not a Liquid
 * engine. It resolves exactly the constructs measured and REPORTS everything
 * else, because a construct dropped silently and one rendered correctly look
 * the same on the page.
 *
 * | construct | resolved as |
 * |---|---|
 * | `include X.md` | the other page's text, transcluded (depth-limited) |
 * | `include img.html img=… caption=… width=…` | the same markup `img.html` emits |
 * | `include` of anything else (`.svg`, `.xhtml`, `.liquid`) | a stated gap linking the published page — these are Publisher output, not source |
 * | `assign` / `unless` | dropped; `unless` bodies KEPT (the Publisher default excludes nothing) |
 * | `for c in V` where `V = site.data.canonicals \| where: 'type', 'T'` | a list of the index's `T` artefacts |
 * | `{{ site.data.fhir.packageId \| … }}` | evaluated (`split`, `first`, `last`, `prepend`, `append`) |
 * | any other `{{ … }}` | left as written, and reported |
 *
 * The body is then wrapped by `wrapRaw`, so what is left of the IG's Liquid
 * reaches the reader as text instead of being parsed a second time by Jekyll.
 *
 * ## Links
 *
 * A relative link to another snapshotted page stays relative; one to an
 * artefact this site renders goes to its artefact page; anything else — an
 * image, a zip, a Publisher-generated page — goes to the IG's published base.
 * Images are therefore served from the published IG, not copied: a stated limit.
 *
 * @module smart-trust/scripts/narrative-pages
 */

import { wrapRaw } from "../../cat-harness/scripts/lib/liquid-raw.ts";

export interface NarrativeContext {
  /** Page sources by filename (`concepts.md`), as `ingest-ig-pages.ts` copied them. */
  sources: ReadonlyMap<string, string>;
  /** The IG's published base, for every link this site does not serve. */
  publishedBase: string;
  /** `site.data.fhir.packageId`. */
  packageId: string;
  /** This site's page for an artefact named `ResourceType-id`, relative to a narrative page; undefined if none. */
  artifactHref(name: string): string | undefined;
  /** Every artefact of a resource type, for the `site.data.canonicals | where: 'type'` loop. */
  artifactsOfType(resourceType: string): Array<{ label: string; href: string }>;
}

export interface Rendered {
  body: string;
  /** What could not be reproduced, one line each — for the build log. */
  gaps: string[];
}

const MAX_DEPTH = 5;
const TAG = /\{%-?\s*([\s\S]*?)\s*-?%\}/g;

function stripFrontMatter(text: string): string {
  return text.replace(/^---\n[\s\S]*?\n---\n/, "");
}

/** `key="value"` / `key='value'` / `key=value` pairs from an include tag. */
function includeParams(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of s.matchAll(/(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g)) out[m[1]!] = m[2] ?? m[3] ?? m[4] ?? "";
  return out;
}

/** Evaluate a `site.data.fhir.packageId | …` output, or return undefined. */
export function evalOutput(expr: string, packageId: string): string | undefined {
  const [head, ...filters] = expr.split("|").map((s) => s.trim());
  if (head !== "site.data.fhir.packageId") return undefined;
  let v: string | string[] = packageId;
  for (const f of filters) {
    const m = /^(\w+)(?:\s*:\s*['"]([^'"]*)['"])?$/.exec(f);
    if (!m) return undefined;
    const [, name, a] = m;
    const s = Array.isArray(v) ? v.join("") : v;
    if (name === "split" && a !== undefined) v = s.split(a);
    else if (name === "last" && Array.isArray(v)) v = v[v.length - 1] ?? "";
    else if (name === "first" && Array.isArray(v)) v = v[0] ?? "";
    else if (name === "prepend" && a !== undefined) v = a + s;
    else if (name === "append" && a !== undefined) v = s + a;
    else return undefined;
  }
  return Array.isArray(v) ? v.join("") : v;
}

/** Expand the page's Liquid. Links are rewritten afterwards, once, over the whole result. */
function expand(file: string, ctx: NarrativeContext, gaps: string[], depth: number): string {
  const text = ctx.sources.get(file);
  if (text === undefined) {
    gaps.push(`include ${file}: no such page source`);
    return "";
  }
  let src = stripFrontMatter(text);

  // A `for` over a typed canonical list, resolved first because its body
  // contains tags that must not be expanded one by one.
  src = src.replace(/\{%-?\s*for\s+(\w+)\s+in\s+(\w+)\s*-?%\}[\s\S]*?\{%-?\s*endfor\s*-?%\}/g, (_whole, _item: string, list: string) => {
    const assign = new RegExp(`\\{%-?\\s*assign\\s+${list}\\s*=\\s*site\\.data\\.canonicals\\s*\\|\\s*where:\\s*'type'\\s*,\\s*'(\\w+)'\\s*-?%\\}`).exec(src);
    if (!assign) {
      gaps.push(`${file}: a for loop over \`${list}\` this renderer cannot evaluate`);
      return `\n> *A generated list is not reproduced here.*\n`;
    }
    const rows = ctx.artifactsOfType(assign[1]!).map((a) => `- [${a.label}](${a.href})`);
    return rows.length ? `\n${rows.join("\n")}\n` : `\n*No ${assign[1]} artefacts in the index.*\n`;
  });

  src = src.replace(TAG, (whole, inner: string) => {
    const [kw, ...rest] = inner.split(/\s+/);
    const arg = rest.join(" ");
    switch (kw) {
      case "include": {
        const target = rest[0] ?? "";
        if (/\.md$/.test(target)) {
          if (depth >= MAX_DEPTH) {
            gaps.push(`${file}: include ${target} deeper than ${MAX_DEPTH}`);
            return "";
          }
          return expand(target, ctx, gaps, depth + 1);
        }
        if (target === "img.html") {
          const p = includeParams(arg);
          const caption = p.caption ?? "";
          const width = p.width ? ` style="width:${p.width}"` : "";
          return `<p><strong>${caption}</strong></p>\n<img src="${p.img ?? ""}" alt="${caption}"${width}/>`;
        }
        gaps.push(`${file}: include ${target} (Publisher output, not source)`);
        return `\n> *This part of the page (\`${target}\`) is generated by the IG Publisher and is not reproduced here — see [the published page](${ctx.publishedBase.replace(/\/+$/, "")}/${file.replace(/\.md$/, ".html")}).*\n`;
      }
      case "assign":
      case "unless":
      case "endunless":
        return "";
      default:
        gaps.push(`${file}: {% ${kw} %} left unresolved`);
        return whole;
    }
  });

  return src.replace(/\{\{\s*([\s\S]*?)\s*\}\}/g, (whole, expr: string) => {
    const v = evalOutput(expr, ctx.packageId);
    if (v !== undefined) return v;
    gaps.push(`${file}: {{ ${expr} }} left as written`);
    return whole;
  });
}

/** Where a relative link from a narrative page should point. */
export function rewriteHref(href: string, ctx: NarrativeContext): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#") || href.startsWith("/")) return href;
  // Already site-relative: written by this module (the artefact list), not by the IG.
  if (href.startsWith("../")) return href;
  const clean = href.replace(/^\.\//, "");
  const [path, frag] = clean.split("#", 2) as [string, string | undefined];
  const hash = frag !== undefined ? `#${frag}` : "";
  const html = /^([^/]+)\.html$/.exec(path);
  if (html) {
    if (ctx.sources.has(`${html[1]}.md`)) return `${path}${hash}`;
    const art = ctx.artifactHref(html[1]!);
    if (art) return `${art}${hash}`;
  }
  return `${ctx.publishedBase.replace(/\/+$/, "")}/${clean}`;
}

function rewriteLinks(text: string, ctx: NarrativeContext): string {
  return text
    .replace(/\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (_w, href: string, title = "") => `](${rewriteHref(href, ctx)}${title})`)
    .replace(/\b(href|src)="([^"]+)"/g, (_w, attr: string, href: string) => `${attr}="${rewriteHref(href, ctx)}"`);
}

/** Render one page: Liquid expanded, links rewritten, the result raw-wrapped. */
export function renderNarrative(file: string, ctx: NarrativeContext): Rendered {
  const gaps: string[] = [];
  const expanded = expand(file, ctx, gaps, 0);
  const body = wrapRaw(rewriteLinks(expanded, ctx).trim()).join("\n");
  return { body, gaps };
}

/** A page's title: the tree's, else its first heading, else its filename. */
export function narrativeTitle(file: string, treeTitle: string | undefined, source: string | undefined): string {
  if (treeTitle) return treeTitle;
  const h = /^#{1,6}\s+(.+?)\s*#*\s*$/m.exec(stripFrontMatter(source ?? ""));
  return h ? h[1]! : file.replace(/\.md$/, "");
}
