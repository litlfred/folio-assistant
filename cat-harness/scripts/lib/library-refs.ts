/**
 * Where a library reference links — bean `qgjh`.
 *
 * Owner, 2026-09-30: a library reference links to THREE things, and a
 * reference is resolved to each only where that target exists:
 *
 * 1. `viewer` — the library viewer's page for the item's instance, opened on
 *    the item (`#<id>`, which the viewer honours on load and on hashchange).
 *    A SITE-relative path; the page that shows it prefixes its own root.
 * 2. `readme` — the item's generated README (`library-readmes.ts`), "like
 *    bootstrap readmes", on the repository host.
 * 3. `source` — the document's own record upstream: arXiv or DOI, from the
 *    identifier its manifest records (read as its README reads it). None is
 *    invented for an item without one.
 *
 * Read, never composed: the item from the library projection
 * (`assets/library/index.json`, written by `gen-library-viz.ts`), the viewer
 * page and the README from disk. A reference none of this resolves gets no
 * link at all, so it stays text rather than becoming a 404.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { directoriesForGraph, readDeclaration, sourceLinks } from "../../schemas/cat-harness.ts";
import { detectRepoUrl } from "../../src/core/git-refs.js";
import { docsLayers } from "../compose-docs.js";
import { itemFacts } from "../library-readmes.ts";

/** The links a library reference resolves to; each absent where it does not. */
export interface LibraryLinks {
  viewer?: string;
  readme?: string;
  source?: string;
}

interface Entry {
  id: string;
  instance: string;
  dir: string;
}

/** A resolver over one checkout, built once and asked per reference. */
export interface LibraryResolver {
  links(id: string, instance?: string): LibraryLinks | undefined;
}

/** The branch a README link views. The same answer the landing data uses. */
const SOURCE_BRANCH = "main";

export function libraryResolver(repo: string, instanceRoot: string): LibraryResolver {
  const base = docsLayers(repo).layers.find((l) => !l.repositoryScoped)?.dir;
  const handler = readDeclaration(instanceRoot)?.name;
  const libs = directoriesForGraph(instanceRoot, "library");
  const seg = libs.length > 0 ? basename(libs[0]!) : undefined;
  const projection = base === undefined ? undefined : join(base, "assets", "library", "index.json");
  const entries: Entry[] =
    projection !== undefined && existsSync(projection)
      ? ((JSON.parse(readFileSync(projection, "utf-8")) as { entries?: Entry[] }).entries ?? [])
      : [];
  const repoUrl = detectRepoUrl(repo);

  return {
    links(id, instance) {
      const matches = entries.filter((e) => e.id === id && (instance === undefined || e.instance === instance));
      // Ambiguous without an instance: two libraries hold the slug, and
      // picking one would be a guess that reads as a resolution.
      if (matches.length !== 1) return undefined;
      const e = matches[0]!;
      const out: LibraryLinks = {};
      if (base !== undefined && handler !== undefined && seg !== undefined) {
        if (existsSync(join(base, handler, seg, e.instance, "index.html"))) {
          out.viewer = `${handler}/${seg}/${e.instance}/#${encodeURIComponent(e.id)}`;
        }
      }
      const readme = `${e.dir}/README.md`;
      if (existsSync(join(repo, readme))) out.readme = sourceLinks(repoUrl, readme, SOURCE_BRANCH)?.viewHref;
      // From the item's own manifest, through the reader its README uses, so
      // the two cannot disagree. The projection's `arxiv` is not used: it
      // flattens the manifest's `{ id, version }` record to an empty string.
      const facts = itemFacts(join(repo, e.dir));
      if (facts?.arxiv) out.source = `https://arxiv.org/abs/${facts.arxiv}`;
      else if (facts?.doi) out.source = `https://doi.org/${facts.doi}`;
      return Object.values(out).some((v) => v !== undefined) ? out : undefined;
    },
  };
}
