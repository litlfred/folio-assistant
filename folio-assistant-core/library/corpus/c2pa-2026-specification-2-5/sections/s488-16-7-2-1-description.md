---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s488-16-7-2-1-description
section_title: "16.7.2.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9687-9693
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.7.2.1. Description

In some provenance workflows, a standard or update manifest is created offline, where it is not possible to obtain a trusted time stamp (as per [RFC 3161](https://www.rfc-editor.org/rfc/rfc3161)) from a TSA at the time of signing. However, in such cases those signing certificates will expire after a certain period of time, thus leading to an invalid C2PA Manifest.

To prevent that expiration, a trusted time stamp can be added at a later point in time (provided the certificate has not yet expired) providing for a "proof of existence" for that C2PA Manifest and (in the case of the active manifest) its associated asset. This time stamp assertion is used to provide a trusted time stamp for such C2PA Manifests.

<a id="_schema_and_example_19"></a>
