---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s560-a-3-14-2-data-hash-binding
section_title: "A.3.14.2. Data hash binding"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11167-11174
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.14.2. Data hash binding

A claim generator embedding a manifest in a Parquet file shall include a [`c2pa.hash.data`](#_data_hash) assertion with a single exclusion range covering the Base64-encoded value bytes of the `c2pa:manifest` `KeyValue` entry within the serialized footer.

> **NOTE:**
> This means that the prefix is not part of the exclusion range.

<a id="_writing_a_manifest_store_3"></a>
