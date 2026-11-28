---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s416-16-4-3-2-schema-and-example
section_title: "16.4.3.2. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 7757-7887
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.3.2. Schema and Example

The schema for this type is defined by the `linked-resource-integrity-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.5.15, “Linked Resource Integrity”](#cddl_annex_linked_resource_integrity) for the complete normative schema):

```cddl
; One or more external resources with cryptographic hashes, used when the
; container format only supports absolute references to external resources.
external-resources-map = {
  "externalResources": [1* $hashed-ext-uri-map],
}

; One or more relative resources with cryptographic hashes, used when the
; container format supports references relative to the asset.
relative-resources-map = {
  "relativeResources": [1* $uri-hashed-data-map],

  ; A string identifying the cryptographic hash algorithm used to compute the
  ; hash on each entry of the `relativeResources` array, taken from the C2PA
  ; hash algorithm identifier list.
  "alg": tstr .size (1..max-tstr-length),
}

linked-resource-integrity-map = {
  ; the resources - either external or relative - that are part of the
  ; asset, and their associated hashes
  "resources": external-resources-map / relative-resources-map,

  ; If true, all URIs embedded in the container format are covered by
  ; this assertion. If false or absent, additional unreferenced URIs may exist.
  ? "allURIsIncluded": bool,

  ; Additional information about the assertion
  ? "metadata": $assertion-metadata-map,
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

The schema for the `uri-hashed-data-map` is defined in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.3.4, “URI Hashed Data”](#cddl_annex_uri_hashed_data)):

```cddl
; The data structure used to store a reference to a URI and its hash.
$uri-hashed-data-map /= {
  "uri": relative-url-type, ; relative URI reference
  "hash": bstr, ; byte string containing the hash value
  ? "size": size-type, ; Number of bytes of data
  ? "dc:format": format-string, ; IANA media type of the data

  ; additional information about the data's type
  ? "data_types": [1* asset-type-map],
}

; An RFC 3986 relative-reference with no scheme and no authority: excludes
; ":" (which would indicate a scheme) entirely, and permits at most one
; leading "/" (a second leading "/" would indicate a network-path
; reference to an authority). Does not require a file extension, so
; extensionless relative paths are permitted. Percent-encoded sequences
; (e.g. "%2e%2e") are syntactically valid here; decoding them and
; rejecting traversal is the responsibility of validation, not this
; schema (see <<_c2pa_linked_resource_integrity_validation>>).
relative-url-type  /= tstr .regexp "/?[-a-zA-Z0-9@%_\\+.~#?&=][-a-zA-Z0-9@%_\\+.~#?&/=]{0,254}"
```

Two examples in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) are shown below:

```none
// Example: HTML asset that links two external resources //
// The signer has hashed both resources at signing time //
{
  "resources": {
    "externalResources": [
      {
        "url": "https://northwindtraders.com/assets/main.js",
        "alg": "sha256",
        "hash": b64'Hf0IgeqbL0m+FTTLpUWwsDGR8pvhUR1AlwvaXjQ0qGY=',
        "dc:format": "text/javascript"
      },
      {
        "url": "https://northwindtraders.com/assets/style.css",
        "alg": "sha256",
        "hash": b64'zP84FPSremIrAQHlhw+hRYQdZp/+KggnD0W8opXlIQQ=',
        "dc:format": "text/css"
      }
    ]
  },
  "allURIsIncluded": true
}
```

```none
// Example: MaterialX scene with texture references; partial coverage //
{
  "resources": {
    "relativeResources": [
      {
        "uri": "./scenes/albedo.png",
        "hash": b64'kQ7J3p+xYL8mHkR4Y0vKDg2aWHC5cGxDJSFj5oozmQI=',
        "dc:format": "image/png"
      }
    ],
    "alg": "sha256"
  },
  "allURIsIncluded": false
}
```

<a id="_asset_reference"></a>
