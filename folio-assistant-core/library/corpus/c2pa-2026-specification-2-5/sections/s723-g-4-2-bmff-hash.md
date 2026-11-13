---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s723-g-4-2-bmff-hash
section_title: "G.4.2. BMFF Hash"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14179-14319
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.4.2. BMFF Hash

```cddl
bmff-hash-map = {
  "exclusions": [1* exclusions-map],

  ; A string identifying the cryptographic hash algorithm used to compute this
  ; hash, taken from the C2PA hash algorithm identifier list. If this field is
  ; absent, the hash algorithm is taken from an enclosing structure as defined
  ; by that structure. If both are present, the field in this structure is used.
  ; If no value is present in any of these places, this structure is invalid;
  ; there is no default.
  ? "alg": tstr .size (1..max-tstr-length),

  ; For non-fragmented MP4, this is the hash of the entire BMFF file excluding
  ; boxes listed in the exclusions array. This field and the `merkle` field may
  ; both be present only for non-fragmented MP4. For fragmented MP4 validated
  ; using a Merkle tree, this field is absent. For live media segments using a
  ; per-segment BMFF hash map, this is the hash of the segment excluding boxes
  ; listed in the exclusions array, and the `merkle` field is absent.
  ? "hash": bstr,

  ; A set of Merkle tree rows and the associated data required to enable
  ; verification of a single 'mdat' box, multiple 'mdat' boxes, and/or
  ; individual fragment files within the asset.
  ? "merkle": [1* merkle-map],

  ; (optional) a human-readable description of what this hash covers.
  ? "name": tstr .size (1..max-tstr-length),
  ? "url": uri, ; Unused and deprecated.

  ; in a live media workflow, the monotonically increasing sequence number for
  ; each segment
  ? "sequenceNumber": uint,
}

; (optional) CBOR byte string of exactly 3 bytes.
flag-type = bytes

flag-t = flag-type .eq 3

exclusions-map = {
  ; Location of box(es) to exclude from the hash starting from the root node as
  ; an xpath formatted string of version https://www.w3.org/TR/xpath-10/ with
  ; highly constrained syntax.
  "xpath": tstr,

  ; (optional) Length that a leafmost box must have to exclude from the hash.
  ? "length": uint,

  ; (optional) The data in the leafmost box at the specified relative byte
  ; offset must be identical to the specified data for the box to be excluded
  ; from the hash.
  ? "data": [1* data-map],

  ; (optional) Only this portion of the excluded box is excluded from the hash.
  ; Each entry in the array must have a monotonically increasing relative byte
  ; offset. No subset within the array may overlap. The last entry may have a
  ; length of zero; this indicates that the remainder of the box from that
  ; relative byte offset onward is excluded. A relative byte offset or relative
  ; byte offset plus length that exceeds the length of the box is allowed; bytes
  ; beyond the end of the box are never hashed.
  ? "subset":[1* subset-map],

  ; (optional) Version that must be set in a leafmost box for the box to be
  ; excluded from the hash. Only specified for a box that inherits from FullBox.
  ? "version": int,

  ; (optional) byte string of exactly 3 bytes. The 24-bit flags that must be set
  ; in a leafmost box for the box to be excluded from the hash. Only specified
  ; for a box that inherits from FullBox.
  ? "flags": flag-t,

  ; (optional) indicates that flags must be an exact match. If not specified,
  ; defaults to true. Only specified for a box that inherits from FullBox and
  ; when flags is also specified.
  ? "exact": bool,
}

data-map = {
  "offset": uint,
  "value" : bstr,
}
subset-map = {
  "offset": uint,
  "length": uint,
}

; Each entry in a map is a Merkle tree row and the associated data required to
; enable validation of a single
; 'mdat' box or multiple 'mdat' boxes within the asset.",
merkle-map = {
  ; 1-based unique id used to differentiate across files to determine which
  ; Merkle tree should be used to validate a given 'mdat' box.
  "uniqueId": int,
  "localId": int, ; A local id indicating Merkle tree.

  ; Number of leaf nodes in the Merkle tree. Null nodes are not included in this
  ; count.
  "count": int,

  ; A string identifying the cryptographic hash algorithm used to compute the
  ; hashes in this Merkle tree, taken from the C2PA hash algorithm identifier
  ; list. If this field is absent, the hash algorithm is taken from the `alg`
  ; value of the enclosing structure as defined by that structure. If both are
  ; present, the field in this structure is used. If no value is present in any
  ; of these places, this structure is invalid; there is no default.
  ? "alg": tstr .size (1..max-tstr-length),

  ; For fragmented MP4 assets that are split across multiple files, this field
  ; is required to be present and is the hash of the entire initialization
  ; segment file for chunks hashed by this Merkle tree excluding boxes listed in
  ; the exclusions array. For fragmented MP4 assets that are stored as a single
  ; flat MP4 file, this field is required to be present and is the hash of all
  ; bytes preceding the first 'moof' box excluding boxes listed in the
  ; exclusions array. For non-fragmented MP4, this field is required to be
  ; absent.
  ? "initHash": bstr,

  ; An ordered array representing a single row of the Merkle tree, which may be
  ; the leaf-most row, root row, or any intermediate row. Any null nodes are
  ; excluded. The depth of the row is implied by (is computed from) the number
  ; of items in this array.
  "hashes": [1* bstr],

  ; For non-fragmented MP4 assets where the mdat box is validated piecewise,
  ; this field can be present. This field is the non-negative size in bytes of a
  ; given leaf node in the Merkle tree. For fragmented MP4, this field is not
  ; present.
  ? "fixedBlockSize": uint,

  ; For non-fragmented MP4 assets where the mdat box is validated piecewise,
  ; this field can be present. Each entry in the array corresponds to the
  ; non-negative size in bytes of a given leaf node in the Merkle tree. The
  ; number of elements is equal to `count` and sum of the values is equal to
  ; size of payload of mdat. For fragmented MP4, this field is not present.
  ? "variableBlockSizes": [1* int],
}
```

<a id="cddl_annex_bmff_merkle"></a>
