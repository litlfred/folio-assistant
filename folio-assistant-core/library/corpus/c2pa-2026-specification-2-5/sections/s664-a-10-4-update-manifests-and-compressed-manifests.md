---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s664-a-10-4-update-manifests-and-compressed-manifests
section_title: "A.10.4. Update manifests and compressed manifests"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12584-12597
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.10.4. Update manifests and compressed manifests

The block of the C2PA manifest record is a C2PA Manifest Store, so it may contain [update manifests](#_update_manifests), and any manifest it contains may be a [compressed manifest](#_compressed_manifests).

An update manifest is added to a WARC file by the update procedure in [Section A.10.2, “Placement of the Manifest Store”](#warc_placement): the existing C2PA manifest record is removed and the replacement, containing the update manifest, is appended as the new last record. Because the C2PA manifest record is not a member of the collection data hash and no other record is moved, the bytes of every other record are unchanged and the hard binding of the manifest being updated remains valid.

The requirement in [Section A.10.3, “Hashing”](#warc_hashing) that a WARC file be hashed using a collection data hash describes the hard binding of a standard manifest. An update manifest contains no content binding assertion, so where the active manifest is an update manifest the collection data hash covering the WARC file remains the one in the standard manifest being updated.

> **NOTE:**
> The requirement in the [clause on update manifests](#_update_manifests) that the C2PA Manifest Store continue to start at the same file offset addresses a file offset hash (`c2pa.hash.data`). A WARC file is bound with a collection data hash, whose entries identify records by `WARC-Record-ID` rather than by offset, so the offset and length of the C2PA manifest record may both change when the C2PA Manifest Store is updated.

Compression of a manifest within the C2PA Manifest Store, as described in the [clause on compressed manifests](#_compressed_manifests), is independent of any compression applied to the WARC record that carries it, which is described in [Section A.10.5, “Compressed WARC files”](#warc_compression). The `Content-Type` of the C2PA manifest record remains `application/c2pa` and its `Content-Length` remains the byte length of the C2PA Manifest Store held in the record block.

<a id="warc_compression"></a>
