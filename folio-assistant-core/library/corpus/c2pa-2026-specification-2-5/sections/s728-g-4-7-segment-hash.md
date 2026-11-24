---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s728-g-4-7-segment-hash
section_title: "G.4.7. Segment Hash"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14451-14510
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.4.7. Segment Hash

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

<a id="_content_assertions"></a>
