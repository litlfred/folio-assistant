/**
 * Where a folio's public-comment dashboard is published: one answer, used by
 * the site builder, the change-set issues and the rendered-impact predictor.
 *
 * Rule 1 of the route conventions (`skills/kg/kg-core/schema-management.md`):
 * a HANDLER rendering a KIND's assets lives at
 * `<base>/<handler>/<kind>/<optional subject>`. The handler is this instance
 * (folio-assistant-core), the kind is `public-comments`, and the subject is
 * the path of the materialised document in the folio, `folio/<slug>`
 * (owner, 2026-10-07: "url for review process should be more reflective of
 * other visualize paths and IRIs … folio-assistant-core/public-comments/
 * <path to materialized document in folio>"). It was a flat
 * `public-comments/index.html` until then; a clean break, with no redirect
 * left at the old address (owner: "no deprecated/redirect links").
 */
import { join, relative } from "node:path";

import { folioDir, readDeclaration } from "../../cat-harness/schemas/cat-harness.js";

/** This instance's declared name: the handler segment. */
export const HANDLER = (readDeclaration(join(import.meta.dir, "..")) as { name?: string } | undefined)?.name ?? "folio-assistant-core";

/** The kind segment. */
export const KIND = "public-comments";

/** `<handler>/public-comments/<folio path>/<slug>`, relative to the site root, no trailing slash. */
export function dashboardRoute(repoRoot: string, slug: string): string {
  const folio = relative(repoRoot, folioDir(repoRoot)).split("\\").join("/") || "folio";
  return `${HANDLER}/${KIND}/${folio}/${slug}`;
}

/** From the dashboard back to the site root: one `../` per segment. */
export function toSiteRoot(route: string): string {
  return "../".repeat(route.split("/").length);
}
