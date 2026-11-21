---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s288-14-12-5-3-hashing-of-warc-files
section_title: "14.12.5.3. Hashing of WARC files"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3998-4009
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.12.5.3. Hashing of WARC files

For WARC files, the collection data hash covers every record other than the C2PA manifest record, and each record’s hash is computed over its uncompressed bytes, as described in [Section A.10.3, “Hashing”](#warc_hashing).

A WARC file has no central directory that fixes the complete set of records present, so the collection data hash on its own binds only the records it lists. A validator shall reject the manifest with a failure code of `assertion.collectionHash.mismatch` if any two records in the file, other than the C2PA manifest record, share the same `WARC-Record-ID`. A validator shall then verify that the correspondence between the file’s remaining records and the entries of the `uris` array, formed by matching each entry’s `uri` field against a record’s `WARC-Record-ID`, is a bijection: every record corresponds to exactly one entry, and every entry corresponds to exactly one record. A record covered by no entry, an entry covered by no record, or any record or entry covered by more than one counterpart, shall be rejected with a failure code of `assertion.collectionHash.mismatch`. This is the WARC counterpart of the ZIP Central Directory check above: without it, a record appended after signing, or a signed record duplicated under its own identifier, would leave the manifest valid.

Where a record is stored compressed, the validator shall decompress it before computing its hash. To bound the cost of decompressing untrusted input, the validator shall enforce an implementation-defined maximum decompressed record size, shall reject any record whose decompressed size exceeds that maximum, and shall reject any record whose decompressed block length does not equal its declared `Content-Length`. A record failing either check shall be rejected with a failure code of `assertion.collectionHash.mismatch`.

> **NOTE:**
> A record stored with a high compression ratio can expand to a size far larger than its stored form. Bounding the decompressed size, and checking the decompressed block length against the declared `Content-Length`, prevents a maliciously crafted record from forcing unbounded work during validation.

<a id="_validating_a_segment_hash"></a>
