---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s193-14-4-2-for-hashed-uris
section_title: "14.4.2. For Hashed URIs"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2602-2606
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.4.2. For Hashed URIs

Various parts of the C2PA Manifest utilize a `hashed_uri` structure for encapsulating a URI, its hash and (optionally) the algorithm used to compute the hash. If there is an `alg` field in the `hashed_uri` structure, it shall be used as the hashing algorithm. If the `alg` field is not present in the `hashed_uri` structure, the hash algorithm shall be determined by evaluating the nearest enclosing structure that contains an `alg` field. If no `alg` field is found in any of these locations, the value of the `alg` field in the claim shall be used as the hash algorithm. If no `alg` field is present in any of these locations, the claim shall be rejected with a failure code of `algorithm.unsupported`.

<a id="_for_hashed_ext_uris"></a>
