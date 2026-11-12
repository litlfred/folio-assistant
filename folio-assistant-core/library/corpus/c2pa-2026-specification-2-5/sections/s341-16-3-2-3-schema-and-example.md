---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s341-16-3-2-3-schema-and-example
section_title: "16.3.2.3. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4883-5271
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.2.3. Schema and Example

The schema for the `c2pa.hash.bmff.v2` (deprecated) and `c2pa.hash.bmff.v3` assertions are defined by the `bmff-hash-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.4.2, “BMFF Hash”](#cddl_annex_bmff_hash) for the complete normative schema):

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

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) for a monolithic MP4 file asset where the `mdat` box is validated as a unit is shown below:

```none
{
  "hash": b64'EiAuxjtmax46cC2N3Y9aFmBO9Jfay8LEwJWzBUtZ0sUM8gA=',
  "name": "Example `c2pa.hash.bmff.v2` assertion",
  "exclusions": [
    {
      "data": [
        {
          "value": b64'2P7D1hsOSDySl1goh37EgQ==',
          "offset": 8
        }
      ],
      "xpath": "/uuid"
    },
    {
      "xpath": "/mfra"
    },
    {
      "xpath": "/moov[1]/pssh"
    },
    {
      "xpath": "/emsg",
      "data": [
        {
          "value": b64'r3avWCpXHkmKHATFsV0Q5g==',
          "offset": 20
        }
      ]
    }
  ]
}
```

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) for an asset composed of fragmented MP4 files is shown below:

```none
{
  "alg": "sha256",
  "name": "Example `c2pa.hash.bmff.v3` assertion for fMP4",
  "merkle": [
    {
      "count": 23,
      "hashes": [ b64'HvWZOxKMfkSatRAygs8DJfnEEcN/G1BNi359NdIDxbQ=', b64'HvWZOxKMfkSatRAygs8DJfnEEcN/G1BNi359NdIDxbQ=' ],
      "localId": 19,
      "initHash": b64'Hf0IgeqbL0m+FTTLpUWwsDGR8pvhUR1AlwvaXjQ0qGY=',
      "uniqueId": 17
    },
    {
      "count": 69,
      "hashes": [ b64'9Zk7Eox+RJq1EDKCzwMl+cQRw38bUE2Lfn010gPFtB0=', b64'9Zk7Eox+RJq1EDKCzwMl+cQRw38bUE2Lfn010gPFtB0=', b64'mTsSjH5EmrUQMoLPAyX5xBHDfxtQTYt+fTXSA8W0Hf0=', b64'mTsSjH5EmrUQMoLPAyX5xBHDfxtQTYt+fTXSA8W0Hf0=', b64'OxKMfkSatRAygs8DJfnEEcN/G1BNi359NdIDxbQd/Qg=' ],
      "localId": 38,
      "initHash": b64'Hf0IgeqbL0m+FTTLpUWwsDGR8pvhUR1AlwvaXjQ0qGY=',
      "uniqueId": 34
    },
    {
      "count": 46,
      "hashes": [ b64'OxKMfkSatRAygs8DJfnEEcN/G1BNi359NdIDxbQd/Qg=' ],
      "localId": 57,
      "initHash": b64'Hf0IgeqbL0m+FTTLpUWwsDGR8pvhUR1AlwvaXjQ0qGY=',
      "uniqueId": 51
    }
  ],
  "exclusions": [
    {
      "data": [
        {
          "value": b64'2P7D1hsOSDySl1goh37EgQ==',
          "offset": 8
        }
      ],
      "xpath": "/uuid"
    },
    {
      "xpath": "/mfra"
    },
    {
      "xpath": "/moov[1]/pssh"
    },
    {
      "data": [
        {
          "value": b64'9Q==',
          "offset": 5
        },
        {
          "value": b64'UAJXD79SlkG9rfnmcsqTUA==',
          "offset": 20
        },
        {
          "value": b64'OxKM',
          "offset": 70
        }
      ],
      "flags": b64'ZDNx',
      "xpath": "/emsg",
      "length": 200,
      "subset": [
        {
          "length": 7,
          "offset": 5
        },
        {
          "length": 28,
          "offset": 20
        },
        {
          "length": 63,
          "offset": 45
        },
        {
          "length": 112,
          "offset": 80
        }
      ],
      "version": 1
    }
  ]
}


{
  "alg": "sha256",
  "name": "Example `c2pa.hash.bmff.v3` assertion for non-fragmented MP4",
  "merkle": [
    {
      "count": 3,
      "hashes": [ b64'HvWZOxKMfkSatRAygs8DJfnEEcN/G1BNi359NdIDxbQ=', b64'HvWZOxKMfkSatRAygs8DJfnEEcN/G1BNi359NdIDxbQ=' ],
      "variableBlockSizes": [ 100, 30, 20 ],
      "localId": 19,
      "initHash": b64'Hf0IgeqbL0m+FTTLpUWwsDGR8pvhUR1AlwvaXjQ0qGY=',
      "uniqueId": 17
    }
  ],
  "exclusions": [
    {
      "data": [
        {
          "value": b64'2P7D1hsOSDySl1goh37EgQ==',
          "offset": 8
        }
      ],
      "xpath": "/uuid"
    },
    {
      "xpath": "/mfra"
    },
    {
      "xpath": "/moov[1]/pssh"
    },
    {
      "data": [
        {
          "value": b64'9Q==',
          "offset": 5
        },
        {
          "value": b64'UAJXD79SlkG9rfnmcsqTUA==',
          "offset": 20
        },
        {
          "value": b64'OxKM',
          "offset": 70
        }
      ],
      "flags": b64'ZDNx',
      "xpath": "/emsg",
      "length": 200,
      "subset": [
        {
          "length": 7,
          "offset": 5
        },
        {
          "length": 28,
          "offset": 20
        },
        {
          "length": 63,
          "offset": 45
        },
        {
          "length": 112,
          "offset": 80
        }
      ],
      "version": 1
    }
  ]
}
```

A pseudo-code implementation of this algorithm is in [Example 3, “Pseudo-code for BMFF-based hash assertion”](#bmff-hash-assertion-algorithm).

Example 3. Pseudo-code for BMFF-based hash assertion

```none
offset = 0
While (offset < length of file)
	Starting at offset, locate the first byte of the first box that matches any entry in the exclusions array, call this first_excluded_byte
		If no such box is found, set first_excluded_byte = length of file
	Determine the length of that box, call this excluded_byte_count
		If no such box was found, set excluded_byte_count = 0
	To the hash, add all bytes between offset and first_excluded_byte minus one (inclusive)
	If first_excluded_byte < length of file and there exists a subset array within the exclusion that determined the value of first_excluded_byte
		set next_included_begin = first_excluded_byte
		For each entry in the subset array within the exclusion that determined the value of first_excluded_byte
			Set next_excluded_begin = this subset array entry's offset field plus first_excluded_byte
			If next_excluded_begin > next_included_begin
				To the hash, add all bytes between next_included_begin and next_excluded_begin minus one (inclusive)
			Set next_included_begin  = this subset array entry's length field plus next_excluded_begin
		If next_included_begin < first_excluded_byte + excluded_byte_count
			To the hash, add all bytes between next_included_begin and first_excluded_byte + excluded_byte_count minus one (inclusive)
	Set offset = first_excluded_byte + excluded_byte_count
```

A example of generating a hash for the Merkle map is in [Example 4, “A suggested example of a merkle map”](#bmff-merkle-hash-example).

Example 4. A suggested example of a merkle map

```none
If the fields `fixedBlockSize` and `variableBlockSizes` are not present
	To the hash, add all bytes between begin_address and last address of mdat payload
If the `fixedBlockSize` field is present and the `variableBlockSizes` field is not present
	While (1)
		next_address = begin_address + fixedBlockSize
		If next_address > last address of the mdat payload
			next_address = last address of the mdat payload plus one
			hash_complete = true
		To the hash, add all bytes between begin_address and next_address minus one (inclusive)
		If hash_complete is true
			break
		begin_address = next_address
If the `variableBlockSizes` field is present and the `fixedBlockSize` field is not present
	For (blockSize in variableBlockSizes)
		next_address = begin_address + blockSize
		If next_address > last address of the mdat payload
			next_address = last address of the mdat payload plus one
			hash_complete = true
		To the hash, add all bytes between begin_address and next_address minus one (inclusive)
		If hash_complete is true
			break
		begin_address = next_address
```

<a id="_exclusion_list_profiles"></a>
