/**
 * A FHIR IG's narrative pages, copied out of its SOURCE at a pinned commit.
 *
 * Sibling of `ig-menu.ts`, and for the same reason a separate file: the menu
 * is the IG's navigation, these are the pages it navigates to. Both are read
 * from `sushi-config.yaml` plus the repository at one commit, so both carry a
 * `source` with that commit — two files, one answer each to "where did this
 * come from".
 *
 * ## What is copied, and what is not
 *
 * Every file under `input/pagecontent/` is copied VERBATIM to `pages/`, beside
 * this manifest. Verbatim is the point: the renderer resolves the IG's Liquid,
 * so a copy that pre-resolved it would be a second renderer nobody tests.
 *
 * Images and downloads are NOT copied. They are linked at the IG's published
 * base, which `fhir-artifact-index/index.json` already records. That is a
 * stated limit, not an oversight — see bean `jut3`.
 *
 * @module schemas/ig-pages
 */

import { z } from "zod";

export const IG_PAGES_SCHEMA_TAG = "folio-ig-pages/v1";

export const IgPagesSourceSchema = z.object({
  kind: z.literal("ig-source"),
  /** The repository the pages were read from — a development fork is fine. */
  of: z.string().url(),
  /** The commit they were read at. Provenance, and the pin. */
  ref: z.string().min(7),
  /** The directory within that repository. */
  path: z.string().min(1),
  readAt: z.string().min(4),
});

/**
 * One page as `sushi-config.yaml`'s `pages:` tree declares it.
 *
 * `parent` is the parent page's FILE, not its title, because titles are free
 * text and two pages may share one. A file in `pagecontent/` that the tree
 * does not list is still copied — it is usually a transclusion fragment — and
 * appears here with `listed: false` and no title, so nothing invents one.
 */
export const IgPageSchema = z.object({
  file: z.string().regex(/^[^/]+\.md$/, "a file directly under input/pagecontent/"),
  title: z.string().min(1).optional(),
  parent: z.string().min(1).optional(),
  /** Position among its siblings, in the config's own order. */
  order: z.number().int().nonnegative(),
  listed: z.boolean(),
});

export const IgPagesSchema = z.object({
  $schema: z.literal(IG_PAGES_SCHEMA_TAG),
  /** The IG's `id`, e.g. `smart.who.int.trust`. */
  id: z.string().min(1),
  canonical: z.string().url(),
  /** The licence `sushi-config.yaml` declares — carried, never assumed. */
  license: z.string().min(1).optional(),
  source: IgPagesSourceSchema,
  pages: z.array(IgPageSchema),
  /** Entries the tree names that are not files here (e.g. `artifacts.html`, which the Publisher generates). */
  notInSource: z.array(z.string()),
});

export type IgPages = z.infer<typeof IgPagesSchema>;
export type IgPage = z.infer<typeof IgPageSchema>;

/**
 * Flatten SUSHI's nested `pages:` map. Keys are filenames; a `title` key is the
 * page's own title, every other key is a child. Order is the file's order.
 */
export function flattenPageTree(tree: Record<string, unknown>, parent?: string): Array<{ key: string; title?: string; parent?: string; order: number }> {
  const out: Array<{ key: string; title?: string; parent?: string; order: number }> = [];
  let order = 0;
  for (const [key, value] of Object.entries(tree)) {
    if (key === "title") continue;
    const node = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    const title = typeof node.title === "string" ? node.title : undefined;
    out.push({ key, title, parent, order: order++ });
    out.push(...flattenPageTree(node, key));
  }
  return out;
}
