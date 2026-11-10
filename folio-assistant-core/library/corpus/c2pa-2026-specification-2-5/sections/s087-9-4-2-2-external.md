---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s087-9-4-2-2-external
section_title: "9.4.2.2. External"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1109-1149
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 9.4.2.2. External

When referring to a resource that exists externally to the C2PA Manifest Store, a `hashed-ext-uri-map` data structure is used. It is a variation on the `hashed-uri`, in that it references an external URI instead of a `self#jumbf`. The `hashed-ext-uri` data structure is defined by the `hashed-ext-uri-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.3.2, “Hashed External URI”](#cddl_annex_hashed_ext_uri) for the complete normative schema):

CDDL for hashed external URI

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

> **IMPORTANT:**
> In keeping with common practice, it is recommended that the `https` scheme be used to retrieve assertion data to protect the privacy of the data in transit, but `http` is also permitted because the data’s integrity is protected by the `hash` field and this privacy may not be required in all circumstances. Authors of manifests with external URIs should choose the scheme to suit their needs.

The optional `dc:format` field, when present, provides an alternative to the `Content-Type` field of the http(s) headers. If present, this field shall be used as the required format retrieved during any content negotiate/request. Sometimes, it may also be necessary to provide one or more [asset types](#_asset_type) as the value of the `data_types` field for more clarity on the format and usage of that data.

An optional `size` field is also provided to specify the size of the data to be retrieved. This may be useful to a validator as a hint in addition to the hash.

> **NOTE:**
> It could be used to provide information about whether to perform downloading or validation or both.

<a id="_hashing_jumbf_boxes"></a>
