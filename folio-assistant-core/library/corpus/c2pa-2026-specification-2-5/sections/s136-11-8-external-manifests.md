---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s136-11-8-external-manifests
section_title: "11.8. External Manifests"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1805-1821
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 11.8. External Manifests

In some cases, it may not be possible (or practical) to embed a C2PA Manifest Store in an asset. In those cases, keeping the C2PA Manifests externally to the asset is an acceptable model for providing provenance to assets. The C2PA Manifest should be stored in a location, referred to as a manifest repository, that is easily locatable by a Manifest Consumer working with the asset, such as [by reference or URI](#manifests-by-reference). As the C2PA Manifest Store is a JUMBF box, it shall be served with the Media Type for C2PA Manifest Stores, `application/c2pa`.

> **NOTE:**
> Previous versions of this specification used the media type `application/x-c2pa-manifest-store` for the C2PA Manifest Store. That media type is deprecated.

Some common reasons to use external manifests are:

*   Embedding may not be technically possible, for example because the file format has no defined embedding.
    
*   Embedding may not be practical, such as when the size of the C2PA Manifest Store is larger than the asset’s digital content.
    
*   Embedding may not be appropriate, such as when it would modify an asset that cannot be modified (e.g., because the asset has already been shared).
    

<a id="_embedding_a_reference_to_an_external_manifest"></a>
