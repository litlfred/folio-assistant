---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s722-g-4-1-data-hash
section_title: "G.4.1. Data Hash"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14144-14178
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.4.1. Data Hash

```cddl
; Also check optionality within the hash-map
; The data structure used to store the cryptographic hash of some or all of the
; asset's data
; and additional information required to compute the hash.
data-hash-map = {
  ; Ranges have monotonically increasing `start` values, and no two ranges may
  ; overlap.
  ? "exclusions": [1* EXCLUSION_RANGE-map],

  ; A string identifying the cryptographic hash algorithm used to compute the
  ; hash in this assertion, taken from the C2PA hash algorithm identifier list.
  ; If this field is absent, the hash algorithm is taken the `alg` value of the
  ; enclosing structure. If both are present, the field in this structure is
  ; used. If no value is present in any of these places, this structure is
  ; invalid; there is no default.
  ? "alg":tstr .size (1..max-tstr-length),
  "hash": bstr, ; byte string of the hash value
  "pad": bstr, ; zero-filled byte string used for filling up space
  ? "pad2": bstr, ; zero-filled byte string used for filling up space

  ; (optional) a human-readable description of what this hash cover
  ? "name": tstr .size (1..max-tstr-length),
  ? "url": uri, ; Unused and deprecated.
}

EXCLUSION_RANGE-map = {
  "start": uint, ; Starting byte of the range
  "length": uint, ; Number of bytes of data to exclude
}
```

<a id="cddl_annex_bmff_hash"></a>
