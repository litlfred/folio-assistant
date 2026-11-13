---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s610-a-6-2-1-hashing-the-entries
section_title: "A.6.2.1. Hashing the Entries"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11820-11827
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.6.2.1. Hashing the Entries

A ZIP-based file format shall be hashed using a [collection data hash](#_collection_data_hash), where each entry contained in the ZIP (except the C2PA Manifest itself) shall be included. The hash of each entry in the collection is computed over the entry’s `local file header` followed by the compressed and/or encrypted content, and any data description if present. The hash algorithm used shall be specified in the `alg` field of the [collection data hash](#_collection_data_hash) structure.

> **NOTE:**
> The reason that the hash is over the compressed/encrypted content is to enable validation without the need to decompress or have the decryption key. This is important for formats that can be encrypted, such as EPUB.

<a id="_hashing_the_zip_central_directory"></a>
