/**
 * Where smart-base and the layers built on it (smart-*, dth-*) live on
 * GitHub, and where their sites are served — in ONE place, so the move to
 * the WHO GitHub org is a one-line change here (litlfred/cat-harness-tools#1917).
 *
 * Two URL bases (owner, 2026-11-11, card Q-MIG-3 "B"):
 *  - STAGING: the owner's GitHub Pages. Sites are built there, and KG IRIs
 *    are minted under it while a layer is in staging.
 *  - PUBLISHED: smart.who.int. When a layer is published, a scripted rewrite
 *    moves its IRIs from the staging root to this one.
 *
 * The harness (folio-assistant, folio-assistant-core, cat-harness, …) stays
 * under litlfred; its pages are HARNESS_PAGES_ROOT.
 *
 * @module smart-base/schemas/site-roots
 * @graphNode none — configuration constants (owner and site roots), not a schema
 */

/** The GitHub owner of smart-base and its smart-* / dth-* layers. Change to the WHO org on migration. */
export const SMART_OWNER = "litlfred";

/** The staging site root: the owner's GitHub Pages, no trailing slash. */
export const STAGING_ROOT = `https://${SMART_OWNER.toLowerCase()}.github.io`;

/** The published site root, no trailing slash. IRIs move here when a layer is published. */
export const PUBLISHED_ROOT = "https://smart.who.int";

/** The GitHub Pages root of the harness layers, which stay under litlfred. */
export const HARNESS_PAGES_ROOT = "https://litlfred.github.io";

/** `<owner>/<repo>` of a smart-* / dth-* repository. */
export function smartRepository(repo: string): string {
  return `${SMART_OWNER}/${repo}`;
}

/** A layer's staging site (and, while staged, its IRI base), with a trailing slash. */
export function stagingSite(repo: string): string {
  return `${STAGING_ROOT}/${repo}/`;
}
