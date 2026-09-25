/**
 * Which docs page sections present which BPMN process — read from the PAGES.
 *
 * A page section that shows a diagram already says so: `WebPageNode.asset`
 * with `kind: "bpmn"` and `source: "processes/x.bpmn"`. That is the dependent
 * pointing at the general node (data-modelling step 8), so the index is built
 * from it and nothing is authored on the process.
 *
 * Until bean `xl55` the process pointed the other way — a hand-written
 * `<…:link href="page.html#section"/>` on a call activity — and of the ten
 * such links, five were broken somewhere: two named an anchor no page had,
 * one sat on a gateway the renderer never reads, and every one of them
 * resolved against the wrong directory on the generated `/processes/` pages.
 * Nothing checked them, because nothing could: the process cannot tell
 * whether a page still says what it once said about it.
 *
 * Two readers use this index: `render-bpmn.ts` (where a subprocess box
 * links) and `gen-processes-viz.ts` (the "Presented on" line of a process
 * page).
 *
 * @module scripts/process-presentations
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The part of a `WebPage` manifest this reads, declared here rather than
 * imported: `schemas/webpage.ts` is a core module and this one is harness,
 * which may not depend on core. A real manifest satisfies it structurally.
 */
interface PageManifest {
  slug: string;
  title: string;
  nodes: ReadonlyArray<{ id: string; title?: string; asset?: { kind: string; source: string } }>;
}

/** One page section that presents a process. */
export interface Presentation {
  /** The page's slug — its published path without `.html`, e.g. `guides/who-smart-ig`. */
  page: string;
  /** The section's pinned anchor id. */
  node: string;
  /** The section's heading, when it has one. */
  title?: string;
  /** The page's title. */
  pageTitle: string;
}

/** The docs manifests, as `gen-docs-pages.ts` finds them: `content/docs/<slug>/<slug>.ts`. */
export function docsManifests(instanceRoot: string): string[] {
  const dir = join(instanceRoot, "content", "docs");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(dir, d.name, `${d.name}.ts`))
    .filter((f) => existsSync(f))
    .sort();
}

/**
 * Every BPMN presentation, keyed by the diagram's source path as the page
 * spells it (`processes/x.bpmn`), in page then section order.
 */
export async function processPresentations(instanceRoot: string): Promise<Map<string, Presentation[]>> {
  const out = new Map<string, Presentation[]>();
  for (const manifest of docsManifests(instanceRoot)) {
    const page = ((await import(manifest)) as { default: PageManifest }).default;
    for (const node of page.nodes) {
      if (node.asset?.kind !== "bpmn") continue;
      const list = out.get(node.asset.source) ?? [];
      list.push({
        page: page.slug,
        node: node.id,
        pageTitle: page.title,
        ...(node.title ? { title: node.title } : {}),
      });
      out.set(node.asset.source, list);
    }
  }
  return out;
}

/**
 * Where a link to a process should land, relative to the site root.
 *
 * Exactly one section presents it → that section. None → the process's own
 * generated page. MORE than one → also the process page, which lists every
 * section: choosing one would be a silent pick between pages that each say
 * something about it, and the process page is where they are all named.
 */
export function processTarget(home: string, presentations: readonly Presentation[] | undefined): string {
  if (presentations?.length === 1) {
    const p = presentations[0]!;
    return `${p.page}.html#${p.node}`;
  }
  return `processes/${home}.html`;
}
