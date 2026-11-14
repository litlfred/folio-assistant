---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s359-16-3-3-4-schema-and-example
section_title: "16.3.3.4. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 5492-5790
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.3.4. Schema and Example

The schema for this type is defined by the `box-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.4.4, “Boxes Hash”](#cddl_annex_boxes_hash) for the complete normative schema):

CDDL for Box Hash

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

Five examples in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) are shown in [Example Box Hash](#example_box_hash):

1.  JPEG 1;
    
2.  PNG;
    
3.  GIF;
    
4.  TTF;
    
5.  JXL.
    

Example Box Hash

```none
// JPEG 1 Example //
// with the first box containing exclusions //
{
  	"alg" : "sha256",
	"boxes": [
		{
			"names" : ["SOI", "APP0", "APP2"],
			"hash" : b64'...',
			"pad" : b64'',
			"exclusions": [ 
				{
					"start": 54,
					"length": 4,
					"boxIndex": 1,
				},
				{
					"start": 1234,
					"length": 56,
					"boxIndex": 1,
				},
				{
					"start": 54,
					"length": 4,
					"boxIndex": 2,
				} 
			],
		},
		{
			"names" : ["C2PA"],
			"hash" : b64'AA==',
			"pad" : b64'',
		},
		{
			"names" : ["DQT", "SOF0", "DHT", "SOS", "RST0", "RST1", "EOI"],
			"hash" : b64'...',
			"pad" : b64'',
		}
	]
}

// PNG Example //
// with the XMP box excluded //
{
  	"alg" : "sha256",
	"boxes": [
		{
			"names" : ["PNGh", "IHDR"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["C2PA"],
			"hash" : b64'AA==',
			"pad" : b64'',
		},
		{
			"names" : ["sBIT"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["iTXt"],
			"hash" : b64'...',
			"excluded": true,
			"pad" : b64'',
		},
		{
			"names" : ["IDAT", "IEND"],
			"hash" : b64'...',
			"pad" : b64'',
		}
	]
}

// GIF Example //
{
  	"alg" : "sha256",
	"boxes": [
		{
			"names" : ["GIF89a", "LSD"]
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["2C", "TBID", "2C", "TBID"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["21FE"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["21F9"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["3B"],
			"hash" : b64'...',
			"pad" : b64'',
		},
	]
}

// TTF Example //
{
  	"alg" : "sha256",
	"boxes": [
		{
			"names" : ["C2PA"],
			"hash" : b64'AA==',
			"pad" : b64'',
		},
		{
			"names" : ["PCLT"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["cmap"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["cvt"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["fpgm"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["gasp"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["glyf"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["head"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["hhea"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["hmtx"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["loca"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["maxp"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["name"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["post"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["prep"],
			"hash" : b64'...',
			"pad" : b64'',
		}
	]
}

// JPEG-XL Example //
// showing extra jumb box not containing "C2PA"
{
  	"alg" : "sha256",
	"boxes": [
		{
			"names" : ["JXL", "ftyp", "jumb"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["C2PA"],
			"hash" : b64'AA==',
			"pad" : b64'',
		},
		{
			"names" : ["jxlp"],
			"hash" : b64'...',
			"pad" : b64'',
		},
		{
			"names" : ["brob", "brob"],
			"hash" : b64'...',
			"excluded": true,
			"pad" : b64'',
		},
		{
			"names" : ["jxlp"],
			"hash" : b64'...',
			"pad" : b64'',
		}
	]
}
```

Normally, the `start` and `length` values of an `exclusion` shall be written in their preferred serialization (i.e., "as short as possible"). However, when a box hash assertion needs to be created but the `start` and `length` values are not yet known, they shall be created "as large as possible", which would be as a 32-bit integer.

<a id="_collection_data_hash"></a>
