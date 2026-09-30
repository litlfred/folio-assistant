/**
 * One IG → one Jekyll source for the just-the-docs pipeline, with the IG
 * Publisher's `site.data.fhir` populated (bean `bamf`).
 *
 * ## Why one site per IG (owner, 2026-09-30)
 *
 * An IG's pages say `{{ site.data.fhir.packageId }}`, not `site.data.fhir.<ig>`:
 * the Publisher builds one IG per Jekyll site, so `_data/fhir.json` names ONE
 * IG. The owner chose to keep that shape rather than rewrite the pages: each IG
 * gets its own Jekyll source and its own `_data/fhir.json`, so the pages render
 * unchanged under the Publisher and under just-the-docs alike.
 *
 * ## What it stages, from an IG source repository
 *
 * | from | to | why |
 * |---|---|---|
 * | `input/pagecontent/*.md` | `<page>.md` with front matter | the pages; title, parent and order from `sushi-config.yaml` `pages:` |
 * | `input/includes/*`, `input/pagecontent/*`, `input/images/*.svg` | `_includes/` | the Publisher resolves `{% include %}` against all three, so pages include each other and inline SVGs |
 * | `input/images/*` | `images/` | referenced as `<img src>` |
 * | `input/images-source/*.plantuml` | `_includes/<name>.svg` | the Publisher RENDERS these; rendered here with `--plantuml-jar`, otherwise a visible "not rendered" marker, reported |
 * | `ig-site-data` over the source | `_data/fhir.json` | `site.data.fhir.*`, only what is sourced |
 * | — | `_config.yml` | just-the-docs, one site |
 *
 * Nothing is inferred that the source does not say: a page with no `pages:`
 * entry keeps its file name as title and is reported, and every field
 * `ig-site-data` cannot source is reported undetermined, never written empty.
 *
 * Usage:
 *   bun run fhir-harness/scripts/build-ig-site.ts --ig-src <IG repo> --out <jekyll source> \
 *     [--baseurl /<site>/<ig>] [--plantuml-jar <plantuml.jar>]
 *
 * @module fhir-harness/scripts/build-ig-site
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { describeSiteData, igSiteData, type IgSiteDataResult } from "./ig-site-data";

/** One page's navigation, from `sushi-config.yaml` `pages:`. */
export interface PageNav {
  title: string;
  parent?: string;
  navOrder: number;
}

/**
 * Flatten sushi's nested `pages:` into title, parent title and order. Keys are
 * the generated file names (`index.md`, `overview.md`); a nested map's keys are
 * children of the page that holds them.
 */
export function pageNav(pages: unknown): Map<string, PageNav> {
  const out = new Map<string, PageNav>();
  let order = 0;
  const walk = (node: unknown, parent?: string) => {
    if (!node || typeof node !== "object") return;
    for (const [file, spec] of Object.entries(node as Record<string, unknown>)) {
      if (file === "title" || file === "generation") continue;
      const s = (spec ?? {}) as Record<string, unknown>;
      const title = typeof s.title === "string" ? s.title : basename(file, extname(file));
      out.set(basename(file, extname(file)), { title, ...(parent ? { parent } : {}), navOrder: ++order });
      walk(s, title);
    }
  };
  walk(pages);
  return out;
}

const yamlString = (s: string) => JSON.stringify(s);

/** Front matter for a page: title, parent and order, as just-the-docs reads them. */
export function frontMatter(nav: PageNav): string {
  return [
    "---",
    `title: ${yamlString(nav.title)}`,
    ...(nav.parent ? [`parent: ${yamlString(nav.parent)}`] : []),
    `nav_order: ${nav.navOrder}`,
    "---",
    "",
  ].join("\n");
}

export interface StageResult {
  pages: string[];
  /** Pages with no `pages:` entry in sushi-config: titled by file name. */
  unlisted: string[];
  includes: number;
  images: number;
  /** Diagrams rendered from `input/images-source/*.plantuml`. */
  rendered: string[];
  /** Included files the source does not hold and nothing rendered: a marker stands in. */
  notRendered: string[];
  siteData: IgSiteDataResult;
}

const files = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile()) : []);

/**
 * `{% include x %}` targets the pages name, so a missing one is found before
 * Jekyll aborts on it.
 */
export function includeTargets(md: string): string[] {
  return [...md.matchAll(/\{%-?\s*include\s+([^\s%]+)/g)].map((m) => m[1]!);
}

/** What stands in for a diagram nothing rendered: visible, never an empty include. */
export const notRenderedMarker = (name: string, from: string) =>
  `<p class="ig-not-rendered"><strong>⟦not rendered: ${name}⟧</strong> — the IG Publisher renders it from <code>${from}</code>; no renderer was given to this build.</p>\n`;

export function stageIgSite(igSrc: string, out: string, baseurl = "", plantumlJar?: string): StageResult {
  const src = resolve(igSrc);
  const sushi = parseYaml(readFileSync(join(src, "sushi-config.yaml"), "utf-8")) as Record<string, unknown>;
  const nav = pageNav(sushi.pages);
  mkdirSync(join(out, "_includes"), { recursive: true });
  mkdirSync(join(out, "_data"), { recursive: true });

  const pagecontent = join(src, "input", "pagecontent");
  const pages: string[] = [];
  const unlisted: string[] = [];
  for (const f of files(pagecontent).filter((f) => f.endsWith(".md"))) {
    const name = basename(f, ".md");
    let n = nav.get(name);
    if (!n) {
      unlisted.push(f);
      // After every listed page, in file order: sushi does not place it.
      n = { title: name, navOrder: 1000 + unlisted.length };
    }
    const body = readFileSync(join(pagecontent, f), "utf-8");
    // A page that already carries front matter keeps it.
    writeFileSync(join(out, f), body.startsWith("---\n") ? body : frontMatter(n) + body);
    pages.push(f);
  }

  let includes = 0;
  for (const dir of [join(src, "input", "includes"), pagecontent]) {
    for (const f of files(dir)) {
      copyFileSync(join(dir, f), join(out, "_includes", f));
      includes++;
    }
  }
  const imagesDir = join(src, "input", "images");
  let images = 0;
  if (existsSync(imagesDir)) mkdirSync(join(out, "images"), { recursive: true });
  for (const f of files(imagesDir)) {
    copyFileSync(join(imagesDir, f), join(out, "images", f));
    if (f.endsWith(".svg")) {
      copyFileSync(join(imagesDir, f), join(out, "_includes", f));
      includes++;
    }
    images++;
  }

  // Diagrams the Publisher renders from images-source, and anything else a page
  // includes that the source does not hold.
  const rendered: string[] = [];
  const notRendered: string[] = [];
  const imagesSource = join(src, "input", "images-source");
  const wanted = new Set(pages.flatMap((f) => includeTargets(readFileSync(join(out, f), "utf-8"))));
  for (const name of [...wanted].sort()) {
    if (existsSync(join(out, "_includes", name))) continue;
    const puml = join(imagesSource, basename(name, extname(name)) + ".plantuml");
    if (name.endsWith(".svg") && existsSync(puml) && plantumlJar) {
      execFileSync("java", ["-jar", plantumlJar, "-tsvg", "-o", join(out, "_includes"), puml], { stdio: "ignore" });
      if (existsSync(join(out, "_includes", name))) {
        rendered.push(name);
        continue;
      }
    }
    writeFileSync(join(out, "_includes", name), notRenderedMarker(name, existsSync(puml) ? `input/images-source/${basename(puml)}` : "a source this build does not hold"));
    notRendered.push(name);
  }

  const siteData = igSiteData(src);
  writeFileSync(join(out, "_data", "fhir.json"), JSON.stringify(siteData.data, null, 2) + "\n");
  const title = typeof sushi.title === "string" ? sushi.title : String(sushi.id ?? "IG");
  writeFileSync(
    join(out, "_config.yml"),
    [
      "# GENERATED by fhir-harness/scripts/build-ig-site.ts: one IG, one site (bean bamf).",
      `title: ${yamlString(title)}`,
      `baseurl: ${yamlString(baseurl)}`,
      "theme: just-the-docs",
      "defaults:",
      "  - scope: { path: \"\" }",
      "    values: { layout: default }",
      "",
    ].join("\n"),
  );
  return { pages: pages.sort(), unlisted: unlisted.sort(), includes, images, rendered, notRendered, siteData };
}

export function describeStage(r: StageResult): string {
  return [
    `pages: ${r.pages.length}; includes: ${r.includes}; images: ${r.images}; diagrams rendered: ${r.rendered.length}`,
    ...(r.notRendered.length ? [`NOT RENDERED (a visible marker stands in): ${r.notRendered.join(", ")}`] : []),
    ...(r.unlisted.length ? [`not in sushi-config pages: (titled by file name): ${r.unlisted.join(", ")}`] : []),
    describeSiteData(r.siteData),
  ].join("\n");
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const igSrc = opt("--ig-src");
  const out = opt("--out");
  if (!igSrc || !out) {
    console.error("usage: build-ig-site.ts --ig-src <IG repo> --out <jekyll source> [--baseurl <path>] [--plantuml-jar <jar>]");
    process.exit(2);
  }
  const r = stageIgSite(igSrc, resolve(out), opt("--baseurl") ?? "", opt("--plantuml-jar"));
  console.log(describeStage(r));
  console.log(`staged ${out}`);
  if (r.siteData.refused.length) process.exit(1);
}
