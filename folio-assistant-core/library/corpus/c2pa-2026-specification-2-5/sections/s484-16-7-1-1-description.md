---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s484-16-7-1-1-description
section_title: "16.7.1.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9650-9654
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.7.1.1. Description

In some provenance workflows, a standard or update manifest is created offline, where it is not possible to obtain the revocation information (via OCSP) at the time of signing. Without that information available during the validation process, a validator may need to go online to determine the revocation status of the certificate. This assertion is used to provide the trusted certificate status for such C2PA Manifests, by adding the information after the fact.

<a id="_schema_and_example_18"></a>
