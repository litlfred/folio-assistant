---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s276-14-12-1-6-hashing-of-safetensors-files
section_title: "14.12.1.6. Hashing of SafeTensors files"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3850-3858
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.12.1.6. Hashing of SafeTensors files

For SafeTensors files, the data hash shall be computed over the raw bytes of the complete file (8-byte header length field + JSON header + tensor data) with the Base64-encoded `c2pa:manifest` value bytes excluded via the exclusion range in the data hash assertion. The validator shall follow the general data hash validation procedure defined in [Section 12.2.2, “Hard Bindings”](#_hard_bindings).

A validator shall verify that exactly one `c2pa:manifest` key exists in the `__metadata__` object of the JSON header. If more than one such key is encountered, the asset shall be treated as if no manifests were located.

The validator shall verify that the 8-byte header length field is consistent with the actual byte length of the JSON header. If the header length field does not match the actual header byte length, the validator shall reject the asset with a failure code of `assertion.dataHash.malformed`.

<a id="_validating_a_bmff_hash"></a>
