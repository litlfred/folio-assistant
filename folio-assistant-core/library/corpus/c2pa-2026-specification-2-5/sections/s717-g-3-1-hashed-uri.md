---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s717-g-3-1-hashed-uri
section_title: "G.3.1. Hashed URI"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14045-14070
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.3.1. Hashed URI

```cddl
; The data structure used to store a reference to a URL within the same JUMBF
; and its hash. We use a socket/plug here to allow hashed-uri-map to be used in
; individual files without having the map defined in the same file
$hashed-uri-map /= {
  "url": jumbf-uri-type, ; JUMBF URI reference

  ; A string identifying the cryptographic hash algorithm used to compute all
  ; hashes in this claim, taken from the C2PA hash algorithm identifier list. If
  ; this field is absent, the hash algorithm is taken from an enclosing
  ; structure as defined by that structure. If both are present, the field in
  ; this structure is used. If no value is present in any of these places, this
  ; structure is invalid; there is no default.
  ? "alg": tstr .size (1..max-tstr-length),
  "hash": bstr, ; byte string containing the hash value
}

; with CBOR Head (#) and tail ($) are introduced in regexp, so not needed
; explicitly
; added support for `&cbor=` extensions in 2.5
jumbf-uri-type  /= tstr .regexp "self#jumbf=[A-Za-z0-9/][A-Za-z0-9./:&=-]*[A-Za-z0-9/]"
```

<a id="cddl_annex_hashed_ext_uri"></a>
