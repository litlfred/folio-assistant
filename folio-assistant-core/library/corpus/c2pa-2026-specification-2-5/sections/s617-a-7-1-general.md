---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s617-a-7-1-general
section_title: "A.7.1. General"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11908-11914
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.7.1. General

[HTML](https://www.w3.org/TR/html/) supports two methods for associating a C2PA Manifest Store with a document: an embedded `script` element for inline manifests and a `link` element for referencing external manifests. Both use the IANA Media type `application/c2pa`. While this section describes both approaches, the use of an [external manifest](#_external_manifests) via the `link` element is preferred.

There shall be at most one C2PA Manifest Store association per HTML document. Both methods place their element in the `head`, so the `head` element shall not contain more than one `script` element with `type="application/c2pa"`, and shall not contain both a `script` element and a `link` element referencing a C2PA Manifest Store. A matching element outside the `head` does not form an association and shall be ignored. If a validator encounters multiple C2PA manifest elements in the `head`, the asset shall be treated as if no manifests were located.

<a id="_embedded_inline_manifests"></a>
