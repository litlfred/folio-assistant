---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s513-16-9-1-8-references
section_title: "16.9.1.8. References"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10199-10206
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.9.1.8. References

Because the `reference` field of the assertion metadata assertion is a standard [hashed\_uri](#_uri_references), it is also possible to have an [assertion metadata assertion](#_metadata_about_assertions) refer to assertions in other manifests than the active one. For example, the active manifest may include an `assertion metadata` assertion that validates the `c2pa.metadata` assertion present in an ingredient’s manifest.

> **NOTE:**
> Since the claim is a special type of assertion, this same method can be used to refer to claims in other manifests.

<a id="_process_time"></a>
