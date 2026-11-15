---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s210-14-5-4-decompression
section_title: "14.5.4. Decompression"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2757-2761
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.5.4. Decompression

As described [previously](#_compressed_manifests), both standard and update manifests can be compressed. When a compressed manifest is encountered, a validator shall decompress it before proceeding with the standard validation process. If the data contained in the `brob` box of a compressed manifest is not either a standard or update manifest or if the decompression fails, the validator shall reject the manifest with a failure code of `manifest.compressed.invalid`.

<a id="_validating_a_match"></a>
