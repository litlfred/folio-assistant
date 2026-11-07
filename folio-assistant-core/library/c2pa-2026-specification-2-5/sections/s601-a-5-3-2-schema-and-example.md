---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s601-a-5-3-2-schema-and-example
section_title: "A.5.3.2. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11709-11751
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.5.3.2. Schema and Example

The schema for this type is defined by the `bmff-merkle-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.4.3, “BMFF Merkle Hash”](#cddl_annex_bmff_merkle) for the complete normative schema):

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

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) is shown below:

```none
{
  "hashes": [
    b64'TWVub3JhaA=='
  ],
  "localId": 4402,
  "location": 2203,
  "uniqueId": 1339
}
```

For non-fragmented asset, the `localId` field in the `bmff-merkle-map` shall indicate the `'mdat'` box. This is a zero-based index indicating the order of 'mdat' within the file. For fragmented asset, the `localId` field in the `bmff-merkle-map` shall be set to the `track_id` field of the `'tkhd'` box pertaining to the `'mdat'` being hashed.

<a id="_dynamic_stream_generation"></a>
