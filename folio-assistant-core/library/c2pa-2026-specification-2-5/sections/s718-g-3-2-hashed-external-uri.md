---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s718-g-3-2-hashed-external-uri
section_title: "G.3.2. Hashed External URI"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14071-14097
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.3.2. Hashed External URI

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

<a id="cddl_annex_unhashed_ext_uri"></a>
