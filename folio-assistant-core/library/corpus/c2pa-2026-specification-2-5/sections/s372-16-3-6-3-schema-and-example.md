---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s372-16-3-6-3-schema-and-example
section_title: "16.3.6.3. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6127-6206
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.6.3. Schema and Example

The schema for this type is defined by the `segment-hash-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.4.7, “Segment Hash”](#cddl_annex_segment_hash) for the complete normative schema):

```cddl
; Segment hash assertion for append-only plain-text files.
; Carries the byte-exact binding between a signed checkpoint manifest
; and its covered segment, together with a cryptographic digest of the
; immediately preceding sentinel line so that historical sentinels cannot
; be rewritten without invalidating the chain.

segment-hash-map = {
  ; Version of this assertion format. Always 1 for this version of the specification.
  "version": 1,

  ; A string identifying the cryptographic hash algorithm used to compute both
  ; "hash" and predecessorSentinel.hash, taken from the C2PA hash algorithm
  ; identifier list. If this field is absent, the hash algorithm is taken from
  ; the `alg` value of the enclosing structure. If both are present, the field
  ; in this structure is used. If no value is present in any of these places,
  ; this structure is invalid; there is no default.
  ? "alg": tstr .size (1..max-tstr-length),

  ; Hash of the segment bytes [segmentStart, segmentEnd).
  "hash": bstr,

  ; Byte offset of the first byte of the segment (inclusive).
  ; For the first checkpoint this is 0 (the start of the file).
  "segmentStart": uint,

  ; Byte offset of the first byte of the sentinel line (exclusive end
  ; of the segment).  The sentinel begins immediately after the segment.
  "segmentEnd": uint,

  ; Byte length of the sentinel line, including its terminating line
  ; ending (LF or CRLF). Present when the sentinel references an external
  ; URI; absent when the manifest is embedded inline in the sentinel.
  ? "sentinelLength": uint,

  ; Digest of the immediately preceding sentinel line's bytes.
  ; Required for every checkpoint after the first; absent for the first.
  ? "predecessorSentinel": predecessor-sentinel-map,

  ? "metadata": $assertion-metadata-map,
}

; Locates and authenticates the immediately preceding sentinel line.
; All three fields are required together; none may appear without the others.
predecessor-sentinel-map = {
  ; Byte offset of the first byte of the preceding sentinel line.
  "start": uint,

  ; Byte length of the preceding sentinel line including its line ending.
  "length": uint,

  ; Hash of bytes [start, start + length), using the alg of the enclosing
  ; segment-hash-map.
  "hash": bstr,
}
```

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) is shown below. The byte offsets and hash values are those of the second checkpoint in [Section A.3.17.6, “Test vectors”](#_append_only_text_test_vectors):

```none
{
  "version": 1,
  "alg": "sha256",
  "hash": b64'axfDsyQ12xTN4nWbwIPzKx/rxSLSC1UQhasygsqD4Ls=',
  "segmentStart": 127,
  "segmentEnd": 143,
  "sentinelLength": 113,
  "predecessorSentinel": {
    "start": 14,
    "length": 113,
    "hash": b64'52VROEjEl9C7I15jXoXVjuO9LzZvsBVf04bXeubHuM8='
  }
}
```

<a id="soft_binding_assertion"></a>
