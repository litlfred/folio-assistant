---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s195-14-4-4-algorithm-validation
section_title: "14.4.4. Algorithm validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2615-2619
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.4.4. Algorithm validation

Once the hashing algorithm is determined, it shall be compared to the values in the allowed list or the deprecated list in [Section 12.1, “Hashing”](#_hashing). If it is not present in either list, the claim shall be rejected with a failure code of `algorithm.unsupported`. If the algorithm is present in the deprecated list, the claim shall be issued an informational code of `algorithm.deprecated`.

<a id="_locating_the_active_manifest"></a>
