---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s558-a-3-14-embedding-manifests-into-parquet
section_title: "A.3.14. Embedding manifests into Parquet"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11152-11159
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.3.14. Embedding manifests into Parquet

[Apache Parquet File Format](https://parquet.apache.org/docs/file-format/) is a columnar storage format widely used for structured and semi-structured data, such as analytics and machine-learning datasets. A Parquet file consists of one or more row groups of column-chunk data followed by a footer containing a Thrift-encoded `FileMetaData` structure that describes the file’s schema, row groups, and an optional `key_value_metadata` list of arbitrary key/value pairs. The file ends with a 4-byte, little-endian length of the footer followed by the 4-byte magic number `PAR1`.

> **NOTE:**
> A C2PA Manifest can only be embedded into a non-encrypted Parquet file due to technical limitations of the encrypted version.

<a id="_c2pa_manifest_store_embedding_3"></a>
