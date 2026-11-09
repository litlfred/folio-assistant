---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s137-11-8-1-embedding-a-reference-to-an-external-mani
section_title: "11.8.1. Embedding a Reference to an external Manifest"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1822-1831
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 11.8.1. Embedding a Reference to an external Manifest

If the asset has embedded XMP, and the C2PA Manifest Store will be stored externally, it is recommended that the claim generator add a [`dcterms:provenance`](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/provenance) key to the XMP, the value (a URI reference) being where to locate the C2PA Manifest Store.

> **NOTE:**
> A previous version of this specification also recommended using this method for references to embedded manifests. Now this mechanism is only for external manifests.

Since fonts do not support XMP, an equivalent method for specifying a URI to a remote C2PA Manifest Store is described in [this clause on fonts](#_embedding_manifests_into_fonts).

<a id="_cryptography"></a>
