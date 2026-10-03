/**
 * A library entry's ONE IRI — the address of its published JSON-LD.
 *
 * Owner, 2026-10-02 (#1881): *"each asset should have one IRI, but the view
 * page is a rendering of that asset, a different page. fix IRIs"*.
 *
 * So the ASSET — the entry's manifest — is named by the URL its JSON-LD is
 * published at, and that URL dereferences to the file. The viewer page at
 * `<site>/cat-harness/library/<instance>/<id>/` is a RENDERING of it: a second
 * resource with its own IRI, which points TO the asset and is never named by
 * it (*"asset doesnt know about its renderings"*).
 *
 * ## Why this path
 *
 * `assets/library/jsonld/<instance>/<id>/manifest.jsonld` mirrors the source
 * layout `<instance>/library/<id>/manifest.jsonld`, so the entry's other nodes
 * (`blocks/`, `sections/`) have an obvious place to be published under the
 * same directory later, and their relative ids would resolve there. It sits
 * under `assets/library/`, the directory the library projection already
 * occupies, rather than at `/library/<instance>/`, which is each instance's own
 * mount route (`mount-instance-docs.ts`, rule 2).
 *
 * Before this the manifest's `@id` was `library/<id>/manifest` against
 * `@base https://litlfred.github.io/folio/` — an IRI that named neither the
 * instance nor any published file. The entry's BLOCK ids are unchanged: they
 * key `summaries.json`, LSI indexes and kg-qa sidecars, and none of them is a
 * published file yet. Only the manifest, which is, gets its real address.
 *
 * ONE function, called by the writer of the `@id` (`gen-library-jsonld`) and
 * the publisher of the file (`gen-library-viz`), so the IRI and the place the
 * file lands cannot disagree.
 *
 * @module schemas/library-iri
 * @graphNode none — a mint rule, not a schema
 */
import { ownNamespace } from "./namespaces.ts";

/** The published site's root — `_config.yml` `url` + `baseurl`, from the own-namespaces code list. */
export const DOCS_SITE = ownNamespace("docs-site");

/** Where every entry's JSON-LD is published, site-relative — the publisher's to prune. */
export const LIBRARY_JSONLD_SITE_DIR = "assets/library/jsonld";

/** The entry's JSON-LD, SITE-relative: where the publisher writes it under the site directory. */
export function libraryAssetSitePath(instance: string, docId: string): string {
  return `${LIBRARY_JSONLD_SITE_DIR}/${encodeURIComponent(instance)}/${encodeURIComponent(docId)}/manifest.jsonld`;
}

/** The entry's IRI — absolute, dereferenceable, instance-qualified. */
export function libraryAssetIri(instance: string, docId: string): string {
  return `${DOCS_SITE}${libraryAssetSitePath(instance, docId)}`;
}
