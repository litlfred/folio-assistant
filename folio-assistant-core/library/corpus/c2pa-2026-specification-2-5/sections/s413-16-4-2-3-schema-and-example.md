---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s413-16-4-2-3-schema-and-example
section_title: "16.4.2.3. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 7589-7738
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.2.3. Schema and Example

The schema for this type is defined by the `external-reference-map` and `hashed-external-reference-map` rules in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.5.8, “External Reference”](#cddl_annex_external_reference) for the complete normative schema):

```cddl
; Assertion that references assertion data stored externally by URI (no hash)
external-reference-map = {
  ; specifies the location and type of the remote data
  "location": unhashed-ext-uri-map,

  ; label for the referenced assertion, if relevant (e.g., c2pa.metadata)
  ? "label": tstr,

  ; human-readable description of the referenced data
  ? "description": tstr .size (1..max-tstr-length),

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map,
}

; Assertion that references externally-stored data by hashed URI
hashed-external-reference-map = {
  ; specifies the location, type and hash of the remote data
  "location": $hashed-ext-uri-map,

  ; label for the referenced assertion, if relevant (e.g., c2pa.metadata)
  ? "label": tstr,

  ; human-readable description of the referenced data
  ? "description": tstr .size (1..max-tstr-length),

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map,
}
```

The schema for the `unhashed-ext-uri-map` is defined in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.3.3, “Unhashed External URI”](#cddl_annex_unhashed_ext_uri)):

```cddl
; The data structure used to store a reference to an external URI WITHOUT a
; hash. This might include, for example, http/https reference or URI reference
; to a smart contract under CAIP-10 convention
unhashed-ext-uri-map = {
  "url": tstr, ; URI reference
  ? "dc:format": format-string, ; IANA media type of the data
  ? "size": size-type, ; Number of bytes of data

  ; additional information about the data's type
  ? "data_types": [1* asset-type-map],
}
```

The schema for the `hashed-ext-uri-map` is defined in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.3.2, “Hashed External URI”](#cddl_annex_hashed_ext_uri)):

```cddl
; The data structure used to store a reference to an external URL and its hash.
; We use a socket/plug here to allow hashed-ext-uri-map to be used in individual
; files without having the map defined in the same file
$hashed-ext-uri-map /= {
  "url": ext-url-type, ; http/https URL

  ; A string identifying the cryptographic hash algorithm used to compute the
  ; hash on this URI's data, taken from the C2PA hash algorithm identifier list.
  ; Unlike alg fields in other types, this field is mandatory here.
  "alg": tstr .size (1..max-tstr-length),
  "hash": bstr, ; byte string containing the hash value
  ? "dc:format": format-string, ; IANA media type of the data
  ? "size": size-type, ; Number of bytes of data

  ; additional information about the data's type
  ? "data_types": [1* asset-type-map],
}

; with CBOR Head (#) and tail ($) are introduced in regexp, so not needed
; explicitly
ext-url-type  /= tstr .regexp "https?:\/\/[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b[-a-zA-Z0-9@:%_\\+.~#?&//=]*"
```

Examples in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) are shown below:

```none
// unhashed: reference to a c2pa.metadata assertion stored remotely //
{
  "label": "c2pa.metadata",
  "location": {
    "url": "https://northwindtraders.com/assets/metadata/abc123",
  },
}


// unhashed: reference to an arbitrary blob of data //
{
  "location": {
    "url": "https://northwindtraders.com/assets/blob/def456",
    "dc:format": "application/octet-stream"
  }
}

// unhashed: reference to dynamic data about asset //
{
  "location": {
    "url": "https://northwindtraders.com/assetData/abc123.json",
    "dc:format": "application/json"
  },
  "description": "Data about the asset that may change over time"
}


// hashed: reference to a structured audit log //
{
  "location": {
    "alg": "sha256",
    "url": "https://northwindtraders.com/data/logs/a1b2c3d4e5f6",
    "hash": b64'zP84FPSremIrAQHlhw+hRYQdZp/+KggnD0W8opXlIQQ=',
    "dc:format": "application/cbor",
    "data_types": [{"type": "c2pa.types.audit-log"}]
  },
  "description": "Structured log of text composition events",
  "metadata": {
    "dateTime": 0("2026-03-03T14:30:00Z"),
    "processStart": {
      "value": 0("2026-03-03T14:00:00Z"),
      "timestampType": "lowerBound"
    },
    "processEnd": {
      "value": 0("2026-03-03T14:30:00Z"),
      "timestampType": "upperBound"
    },
    "dataSource": {
      "type": "localProvider.TEE",
      "details": "Process data collected by local observer in trusted execution environment"
    }
  }
}


// hashed: reference to version history data //
{
  "location": {
    "alg": "sha256",
    "url": "https://northwindtraders.com/provenance/commits/main/abc123.cbor",
    "hash": b64'kQ7J3p+xYL8mHkR4Y0vKDg2aWHC5cGxDJSFj5oozmQI=',
    "dc:format": "application/cbor",
    "data_types": [{"type": "c2pa.types.version-history"}]
  },
  "description": "Signed commit history for source file"
}
```

<a id="_linked_resource_integrity"></a>
