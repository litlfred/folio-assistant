---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s194-14-4-3-for-hashed-ext-uris
section_title: "14.4.3. For Hashed Ext URIs"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2607-2614
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.4.3. For Hashed Ext URIs

Some parts of a C2PA Manifest utilize a `hashed_ext_uri` structure for encapsulating an external URI, its hash and the algorithm used to compute the hash. If there is an `alg` field in the `hashed_ext_uri` structure, it shall be used as the hashing algorithm. If the `alg` field is not present in the `hashed_ext_uri` structure, the failure code of `algorithm.unsupported` shall be used.

> **NOTE:**
> The `alg` field is mandatory in `hashed_ext_uri`, so no recursive procedure to determine the hash algorithm is necessary.

<a id="_algorithm_validation"></a>
