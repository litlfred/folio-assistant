---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s666-a-10-6-concatenation-and-splitting
section_title: "A.10.6. Concatenation and splitting"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12603-12610
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.10.6. Concatenation and splitting

When WARC files are concatenated or split, the collection data hash of a pre-existing C2PA Manifest Store will no longer cover the correct set of records. A claim generator producing a combined WARC file shall remove any pre-existing C2PA manifest records from constituent files and append a new C2PA manifest record covering all other records in the resulting file. The pre-existing manifests may be referenced as ingredients.

> **NOTE:**
> Recompressing a record does not change its hash, because the hash covers uncompressed bytes. Any change to a record’s uncompressed content, or to the set of records present, requires a new C2PA Manifest Store.

<a id="_validation_behaviour_2"></a>
