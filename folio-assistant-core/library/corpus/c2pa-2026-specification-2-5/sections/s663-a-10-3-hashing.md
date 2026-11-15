---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s663-a-10-3-hashing
section_title: "A.10.3. Hashing"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12570-12583
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.10.3. Hashing

A WARC file shall be hashed using a [collection data hash](#_collection_data_hash). Every WARC record in the file other than the C2PA manifest record shall be included as a member of the collection. The hash algorithm used shall be specified in the `alg` field of the collection data hash structure. The hash of each record shall be computed over the uncompressed bytes of that record, from the first byte of the version line through and including the two CRLF sequences that terminate the record, as defined by the `warc-record` production in [ISO 28500:2017](https://www.iso.org/standard/68004.html). Hashing the full record, including its header fields, integrity-protects the capture metadata together with the captured content. Where a record is stored compressed, it shall be decompressed before its hash is computed, so that the hash depends only on the record’s uncompressed content and not on its stored form.

Refer to the Validation clause for the normative procedure to validate a WARC collection data hash, including the bounds a validator shall apply when decompressing records and the requirement that every record be covered: see [Hashing of WARC files](#validating_a_warc_collection_hash).

The `uri` field of each entry in the collection data hash shall be the value of the corresponding record’s `WARC-Record-ID` header field, without the enclosing angle brackets. Validators shall match collection hash entries to WARC records by comparing the `uri` field to each record’s `WARC-Record-ID`. A claim generator shall verify that the `WARC-Record-ID` values of the records included in the collection are unique, and shall treat a duplicate as an error, since the `uri` field would otherwise not identify a single record.

Continuation records (segments of a record split across multiple WARC records) shall each be hashed as individual records. The collection data hash does not require reassembly of segmented content.

> **NOTE:**
> Revisit records are hashed as they appear in the file, without resolving the revisit reference. Validators need not dereference revisit records for hash computation.

<a id="_update_manifests_and_compressed_manifests"></a>
