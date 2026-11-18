---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s333-16-3-1-2-schema-and-example
section_title: "16.3.1.2. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4650-4710
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.1.2. Schema and Example

The schema for this type is defined by the `data-hash-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.4.1, “Data Hash”](#cddl_annex_data_hash) for the complete normative schema):

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

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) is shown below:

```none
{
  "alg" : "sha256",
  "pad" : '0000',
  "hash": 'Auxjtmax46cC2N3Y9aFmBO9Jfay8LEwJWzBUtZ0sUM8gA=',
  "name": "JUMBF manifest"
  "exclusions": [ 
    {
      "start": 9960,
      "length": 4213
    } 
  ],
}
```

Normally, the `start` and `length` values of an `exclusion` shall be written in their preferred serialization (i.e., "as short as possible"). However, when a data hash assertion needs to be created but the `start` and `length` values are not yet known, they shall be created "as large as possible", which would be as a 32-bit integer.

The `pad` value shall be present and shall be a zero-filled byte string. The `pad2` value, if present, shall be a zero-filled byte string.

> **NOTE:**
> [Section 11.7, “Multiple Step Processing”](#_multiple_step_processing) describes how to fill in the correct values and adjust the padding.

<a id="_special_consideration_for_jpeg_1"></a>
