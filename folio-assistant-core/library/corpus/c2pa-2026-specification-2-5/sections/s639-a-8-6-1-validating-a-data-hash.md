---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s639-a-8-6-1-validating-a-data-hash
section_title: "A.8.6.1. Validating a data hash"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12224-12233
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.8.6.1. Validating a data hash

To validate a `c2pa.hash.data` assertion against unstructured text, a validator shall perform the standard checks for a data hash, with the following considerations:

1.  The `exclusions` field in the assertion shall correspond to the location of the `C2PATextManifestWrapper` in the text.
    
2.  The hash shall be computed by first removing the bytes specified by the `exclusions` field, then normalizing the remaining text to NFC and encoding it as UTF-8, as specified in [Section 14.12.1.3.1, “Validating a text data hash”](#validating_a_text_data_hash). The result shall match the `hash` value in the assertion.
    

<a id="_normalization"></a>
