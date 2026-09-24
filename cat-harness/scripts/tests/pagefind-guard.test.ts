/**
 * The plain docs pipeline loads no Pagefind, and that is checked rather than
 * promised.
 *
 * Bean `folio-assistant-4pm8`. The owner scoped the docs pipeline to "no
 * extensions. no fancy. no js (if possible)", and admitted Pagefind ONLY
 * inside the large-datasets subgraph, where it is being prototyped and
 * measured (`large-datasets/scripts/bench-pagefind.ts`). Pagefind is now a
 * dev dependency of this repository, so nothing but this test stops a page
 * under `cat-harness/docs/` from picking it up.
 *
 * A REFERENCE is anything that would make a docs page load or build with
 * Pagefind: a script or stylesheet of its bundle, one of its index files, its
 * `data-pagefind-*` attributes, its UI constructors, an import of the
 * package, a path to a `pagefind/` bundle directory, or the word anywhere in
 * the Jekyll build's own configuration (a plugin). Prose that NAMES Pagefind
 * is not a reference: the docs may say that the glossary page adds no search
 * engine because bean `4pm8` admits Pagefind only elsewhere.
 *
 * @module scripts/tests/pagefind-guard.test
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

import { repoRootFor } from "../../schemas/cat-harness.ts";

const REPO = repoRootFor(resolve(import.meta.dir, "../.."));
const DOCS = join(REPO, "cat-harness", "docs");

/** Patterns that load or build with Pagefind, in any text file. */
export const LOADS_PAGEFIND: RegExp[] = [
  /pagefind(?:-(?:ui|modular-ui|component-ui|highlight|worker|entry))?\.(?:m?js|css|json)\b/i,
  /\.pf_(?:meta|index|fragment|filter)\b/i,
  /\bdata-pagefind-/i,
  /\bPagefind(?:Modular)?UI\b/,
  /["'(=/]_?pagefind\//i,
  /\bfrom\s*["']pagefind["']/,
  /\b(?:require|import)\s*\(\s*["']pagefind["']/,
];

/** Files whose every mention of Pagefind is configuration, not prose: the Jekyll build's. */
const BUILD_CONFIG = new Set(["_config.yml", "Gemfile", "Gemfile.lock", "package.json"]);

const BINARY = /\.(?:png|jpe?g|gif|webp|ico|svg|pdf|woff2?|ttf|otf|eot|zip|gz|mp4|webm)$/i;

/** Every reference to Pagefind in one file's text. */
export function pagefindReferences(name: string, text: string): string[] {
  const hits: string[] = [];
  if (BUILD_CONFIG.has(basename(name)) && /pagefind/i.test(text)) hits.push("pagefind in the docs build configuration");
  for (const re of LOADS_PAGEFIND) {
    const m = re.exec(text);
    if (m) hits.push(m[0]);
  }
  return hits;
}

function textFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...textFiles(p));
    else if (!BINARY.test(e.name)) out.push(p);
  }
  return out;
}

describe("no file under cat-harness/docs/ loads Pagefind (bean 4pm8)", () => {
  test("the docs tree exists and is not trivially small, so the scan has something to scan", () => {
    expect(existsSync(join(DOCS, "_config.yml"))).toBe(true);
    expect(textFiles(DOCS).length).toBeGreaterThan(500);
  });

  test("no docs file references Pagefind", () => {
    const found: string[] = [];
    for (const f of textFiles(DOCS)) {
      const hits = pagefindReferences(f, readFileSync(f, "utf8"));
      if (hits.length) found.push(`${relative(REPO, f)}: ${hits.join(", ")}`);
    }
    expect(found).toEqual([]);
  });

  // The guard can fail: each shape a real integration takes is caught, and prose is not.
  test.each([
    ["page.html", '<script src="/pagefind/pagefind-ui.js"></script>'],
    ["page.html", '<link href="{{ site.baseurl }}/pagefind/pagefind-ui.css" rel="stylesheet">'],
    ["page.md", '<main data-pagefind-body>'],
    ["search.js", 'new PagefindUI({ element: "#search" })'],
    ["search.js", 'const pf = await import("/pagefind/pagefind.js");'],
    ["search.js", 'import * as pagefind from "pagefind";'],
    ["fetch.js", 'fetch("pagefind/pagefind.en_1a2b3c.pf_meta")'],
    ["_config.yml", "plugins:\n  - jekyll-pagefind\n"],
    ["Gemfile", 'gem "jekyll-pagefind"\n'],
  ])("a %s carrying %j is reported", (name, text) => {
    expect(pagefindReferences(name, text).length).toBeGreaterThan(0);
  });

  test.each([
    ["intent.md", "No search engine is added: bean `4pm8` admits Pagefind only in the large-datasets sub-graph."],
    ["index.json", '{"title":"PAGEFIND: evaluate as the search engine for the large-datasets subgraph"}'],
  ])("prose naming Pagefind in a %s is not a reference", (name, text) => {
    expect(pagefindReferences(name, text)).toEqual([]);
  });
});
