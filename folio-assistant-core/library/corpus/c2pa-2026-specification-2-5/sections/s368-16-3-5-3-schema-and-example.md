---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s368-16-3-5-3-schema-and-example
section_title: "16.3.5.3. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 5976-6096
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.5.3. Schema and Example

The schema for this type is defined by the `multi-asset-hash-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.4.6, “Multi-Asset Hash”](#cddl_annex_multi_asset_hash) for the complete normative schema):

```cddl
multi-asset-hash-map = {
  ; An array of one or more hashes for individual parts of the multi-part file
  "parts": [* part-hash-map]
}

byte-range-locator = (
  "byteOffset": uint ; The byte offset of the part within the file
  "length": uint ; The length of the part
)

; this is a special CDDL map of choices (meaning that only one of the following
; can be present)
; The byte offset & length of the part within the file
; An XPath to the BMFF box of the part
locator-map = {
  (byte-range-locator // "bmffBox": tstr)
}

part-hash-map = {
  "location" : locator-map, ; The location of the part within the file

  ; hashed_uri to the hash assertion of the part
  "hashAssertion": $hashed-uri-map,
  ? "optional": bool, ; If the part is optional and can be discarded
}
```

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) is shown below:

```none
// multi-asset-hash assertion //
// The asset (of 33,333 bytes) comprises a JPEG part in bytes [0,11111) and another
// part in bytes [11111,33333).
{
  "parts" : [
    {
      "location": {
        "byteOffset": 0,
        "length": 11111
      },
      "hashAssertion": "self#jumbf=c2pa.assertions/c2pa.hash.boxes.part"
    },
    {
      "location": {
        "byteOffset": 11111,
        "length": 22222
      },
      "hashAssertion": "self#jumbf=c2pa.assertions/c2pa.hash.data.part"
    }
  ]
}

// c2pa.hash.boxes.part - box hash for the first part of the asset //
{
  "alg" : "sha256",
  "boxes": [
    {
      "names" : ["SOI", "APP0", "APP2"],
      "hash" : b64'...',
      "pad" : b64'',
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

// c2pa.hash.data.part - data hash for the second part of the asset //
{
  "alg" : "sha256",
  "pad" : '0000',
  "hash" : b64'...',
}

// c2pa.hash.boxes - overall asset hash, covering the whole two-part asset //
{
  "alg" : "sha256",
  "boxes": [
    {
      "names" : ["SOI", "APP0", "APP2"],
      "hash" : b64'...',
      "pad" : b64''
    },
    {
      "names" : ["C2PA"],
      "hash" : b64'AA==',
      "pad" : b64''
    },
    {
      "names" : ["DQT", "SOF0", "DHT", "SOS", "RST0", "RST1", "EOI"],
      "hash" : b64'...',
      "pad" : b64''
    },
    {
      "names" : ["c2pa.after"],
      "hash" : b64'...',
      "pad" : b64''
    }
  ]
}
```

Such a sample multi-asset hash assertion might be included in an image, as shown [below](#multi_asset_hdr_image).

![Example of a multi-asset hash assertion used for an HDR gain map](_images/multi-hash-hdr.drawio.svg)

Figure 17. Example of a multi-asset hash assertion used for an HDR gain map

<a id="_segment_hash"></a>
