---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s583-a-4-1-general
section_title: "A.4.1. General"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11451-11455
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.4.1. General

All C2PA Manifest Stores shall be embedded using embedded file streams (ISO 32000, 7.11.4). The file specification dictionary of the embedded file stream shall have an `AFRelationship` key (ISO 32000-2, 7.11.3) whose value is `C2PA_Manifest`. The embedded file stream dictionary (referenced by the `EF` key of the file specification dictionary) shall have a `Subtype` key whose value is `application/c2pa`. If a C2PA Manifest Store is embedded into an encrypted PDF, the embedded file stream shall use an `Identity` crypt filter (ISO 32000-2, 7.4.10).

<a id="_document_level_manifests"></a>
