---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s287-14-12-5-2-extras-for-zip
section_title: "14.12.5.2. Extras for ZIP"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3991-3997
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.12.5.2. Extras for ZIP

In a ZIP file with an associated C2PA Manifest, the [collection data hash](#_collection_data_hash) contains the additional `zip_central_directory_hash` field. As described [earlier](#_hashing_the_zip_central_directory), this field contains a hash of every "central directory header" in the ZIP Central Directory as well as the "end of central directory record" (which is the last part of a ZIP file). The hash algorithm used for this field is the same as the one used for the `hash` field in the `c2pa.hash.collection.data` assertion.

When validating a ZIP file, the validator shall check that the `zip_central_directory_hash` field is present and that the hash of the ZIP Central Directory and "end of central directory record" matches its value. If the hash does not match, then the manifest shall be rejected with a failure code of `assertion.collectionHash.mismatch`.

<a id="validating_a_warc_collection_hash"></a>
