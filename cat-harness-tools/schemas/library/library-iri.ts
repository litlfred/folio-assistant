/**
 * A library entry's ONE IRI — the address of its published JSON-LD.
 *
 * The asset (the entry's manifest) is named by the URL its JSON-LD is
 * published at, and that URL dereferences to the file. The viewer page at
 * `<site>/cat-harness/library/<instance>/<id>/` is a RENDERING of it: a second
 * resource with its own IRI, which points TO the asset and is never named by
 * it.
 *
 * `assets/library/jsonld/<instance>/<id>/manifest.jsonld` mirrors the source
 * layout `<instance>/library/<id>/manifest.jsonld`, so the entry's other nodes
 * (`blocks/`, `sections/`) can later be published under the same directory.
 * It sits under `assets/library/`, not `/library/<instance>/`, which is each
 * instance's own mount route (`mount-instance-docs.ts`, rule 2). Block ids are
 * not published addresses: they key `summaries.json`, LSI indexes and kg-qa
 * sidecars.
 *
 * ONE function, called by the writer of the `@id` (`gen-library-jsonld`) and
 * the publisher of the file (`gen-library-viz`), so the IRI and the place the
 * file lands cannot disagree.
 *
 * @module schemas/library-iri
 * @graphNode none — a mint rule, not a schema
 */
import { ownNamespace } from "../kg/namespaces.ts";

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
