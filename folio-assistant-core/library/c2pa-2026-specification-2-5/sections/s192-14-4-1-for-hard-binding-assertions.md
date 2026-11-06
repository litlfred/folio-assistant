---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s192-14-4-1-for-hard-binding-assertions
section_title: "14.4.1. For hard binding assertions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2597-2601
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.4.1. For hard binding assertions

Each hard binding assertion has an `alg` field that specifies the hashing algorithm used to compute the hash of the asset. If the `alg` field is present, it shall be used as the hashing algorithm for the hard binding assertion. If no `alg` field is present in the hard binding assertion, the value of the `alg` field in the Claim shall be used as the hash algorithm. If no `alg` field is present in the Claim, the Claim shall be rejected with a failure code of `algorithm.unsupported`.

<a id="_for_hashed_uris"></a>
