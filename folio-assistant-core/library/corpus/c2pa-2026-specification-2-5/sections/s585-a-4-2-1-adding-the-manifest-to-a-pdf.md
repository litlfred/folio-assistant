---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s585-a-4-2-1-adding-the-manifest-to-a-pdf
section_title: "A.4.2.1. Adding the Manifest to a PDF"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11459-11471
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.4.2.1. Adding the Manifest to a PDF

When adding a C2PA Manifest to the entire PDF, the document catalog dictionary shall contain an `AF` entry. One of the entries in the array value of `AF` shall be an indirect reference to the embedded file specification consisting of the C2PA Manifest Store containing the active manifest. Only that C2PA Manifest Store shall be listed there; earlier C2PA Manifest Stores may remain embedded in the PDF consistent with [Special Considerations for PDF](#locating_active_manifest_pdf_special). That embedded file specification shall also be referenced, via indirect object, either from the `EmbeddedFiles` name tree (ISO 32000-2, 7.7.4) or from a `FileAttachment` annotation (ISO 32000-2, 12.5.6.15). The annotation approach shall be used when adding a C2PA Manifest Store to a PDF that already has an existing PDF certifying signature in order to avoid invalidating its `DocMDP` restrictions.

> **NOTE:**
> Values of _1_ or _2_ of the `P` field in the DocMDP dictionary do not allow this type of modification. Only a value of _3_ does.

In most other formats, there only exists a single C2PA Manifest Store that contains all of the C2PA Manifests for the asset. However, because of PDF’s "incremental update" feature, it is necessary to instead support multiple manifests in a single PDF. In this scenario, the C2PA Manifest Store found in the base PDF (the earliest PDF revision that contains a C2PA Manifest Store) shall be considered the initial manifest and the one in the most recent update, the active manifest. A C2PA Manifest Consumer shall process all C2PA Manifests in all C2PA Manifest Stores as if they were contained in a single C2PA Manifest Store.

> **NOTE:**
> Because a JUMBF URI is always a full URI, meaning that it starts at a given C2PA Manifest, and all C2PA Manifests are considered to be contained in a single C2PA Manifest Store, using such a URI to refer to a `parentOf` ingredient across C2PA Manifest Stores in a PDF is acceptable.

<a id="_compatibility_with_pdf_signatures"></a>
