---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s724-g-4-3-bmff-merkle-hash
section_title: "G.4.3. BMFF Merkle Hash"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14320-14345
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.4.3. BMFF Merkle Hash

```cddl
; The data structure used to store sufficient information to validate a single
; 'mdat' box or
; a portion of an 'mdat' box when a Merkle tree is used",
bmff-merkle-map = {
  "uniqueId": int, ; A unique integer used to differentiate local ids
  "localId": int, ; A local id indicating Merkle tree.

  ; Zero-based index into the leaf-most Merkle tree row corresponding to this
  ; 'mdat' box or portion of this 'mdat' box
  "location": int,

  ; An ordered array representing the set of additional hashes required to reach
  ; a hash in the Merkle tree specified in the manifest from leaf-most (peer of
  ; this node) to root-most (child of node in manifest). Note that this array
  ; may not be present, e.g. if the manifest itself contains the leaf-most row
  ; of the Merkle tree. Null hashes are not included in this array. The
  ; algorithm used is determined using the `alg` field from the corresponding
  ; entry in the `merkle` field array in the BMFF hash structure.
  ? "hashes": [1* bstr],
}
```

<a id="cddl_annex_boxes_hash"></a>
