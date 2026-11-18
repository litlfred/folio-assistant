---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s725-g-4-4-boxes-hash
section_title: "G.4.4. Boxes Hash"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14346-14399
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.4.4. Boxes Hash

```cddl
box-map = {
  "boxes": [1* box-hash-map],

  ; A string identifying the cryptographic hash algorithm used to compute the
  ; hash in this assertion, taken from the C2PA hash algorithm identifier list.
  ; If this field is absent, the hash algorithm is taken the `alg` value of the
  ; enclosing structure. If both are present, the field in this structure is
  ; used. If no value is present in any of these places, this structure is
  ; invalid; there is no default.
  ? "alg":tstr .size (1..max-tstr-length),
}

box-hash-map = {
  ; An array of strings representing the box identifiers in order of appearance
  ; (e.g., `APP0`, `IHDR`)
  "names": [1* box-name],

  ; A string identifying the cryptographic hash algorithm used to compute the
  ; hash in this assertion, taken from the C2PA hash algorithm identifier list.
  ; If this field is absent, the hash algorithm is taken the `alg` value of the
  ; enclosing structure. If both are present, the field in this structure is
  ; used. If no value is present in any of these places, this structure is
  ; invalid; there is no default.
  ? "alg": tstr .size (1..max-tstr-length),
  "hash": bstr, ; byte string of the hash value

  ; A boolean value indicating whether a validator can ignore this box ( &
  ; associated hash) during validation. If this field is absent, the box is
  ; hashed and the values compared.
  ? "excluded": bool,

  ; An array of hash exclusion ranges. Ranges have monotonically increasing
  ; `start` values, and no two ranges may overlap.
  ? "exclusions": [1* box-exclusions-map],
  ? "pad": bstr, ; zero-filled byte string used for filling up space
  ? "pad2": bstr, ; zero-filled byte string used for filling up space
}

box-name /= tstr .size (1..10)

box-exclusions-map = {
  "start": uint, ; Starting byte offset (from the start of the box) of the range
  "length": uint, ; Number of bytes of data to exclude

  ; 0-based index into the names array in the box-hash-map. Can be omitted if
  ; the number of box is one.
  ? "boxIndex": int,
}
```

<a id="cddl_annex_collection_data_hash"></a>
