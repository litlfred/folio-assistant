---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s208-14-5-3-1-by-reference
section_title: "14.5.3.1. By Reference"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2721-2746
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.5.3.1. By Reference

If there is no embedded C2PA Manifest Store, the following attempts should be made to locate one at a remote location. Once a C2PA Manifest Store is located, the validation process should proceed with that manifest as the active manifest (and therefore not continue looking for additional manifests). The following attempts should be made in order:

*   If the asset was retrieved via an HTTP connection, the [Link Header](#_by_link_header) clause below describes how to find a manifest via the `Link` header.
    
*   If the asset has any XMP in the standard asset locations (i.e., outside the C2PA Manifest) and that XMP contains a `dcterms:provenance` key, the provided URI should be used to locate the active manifest.
    
*   If the asset is a font with a `C2PA` table and its `activeManifestUriLength` is non-zero, then the indicated URI should be used to locate the active manifest.
    
*   If no C2PA Manifest Store has been located, the validator should look for files at the same path or URI, but with the added filename extension of `.c2pa`. If not found, the validator may also look for a file with the same filename with the extension replaced by `.c2pa`. For example, if the asset is located at `image.jpg`, the validator should look for a C2PA Manifest Store at `image.jpg.c2pa` and then `image.c2pa`.
    
*   If the asset is an entry within an archive or packaging format, such as ZIP or TAR, the validator should look for another entry within that same archive, at the same absolute path as the asset’s entry, but with the added filename extension of `.c2pa`. If not found, the validator may also look for a file with the same filename with the extension replaced by `.c2pa`.
    

If the C2PA Manifest Store has not found by any of the above methods, a validator may look in whatever additional places it deems most appropriate to locate it.

If a manifest was documented to exist in a remote location, but is not present there, or the location is not currently available (such as in an offline scenario), the `manifest.inaccessible` error code shall be used to report the situation.

If a C2PA Manifest Store is retrieved from a remote location but is encrypted such that the validator is unable to read its contents, the validator shall reject the manifest with a failure code of `manifest.inaccessible.encrypted`.

If a C2PA Manifest Store is retrieved from a remote location but its contents cannot be interpreted as a valid C2PA Manifest Store, the validator shall reject the manifest with a failure code of `manifest.inaccessible.malformed`.

Information about the IANA media type for a C2PA Manifest Store can be found in the [external manifests section](#_external_manifests).

<a id="_by_link_header"></a>
