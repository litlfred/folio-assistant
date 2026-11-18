---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s726-g-4-5-collection-data-hash
section_title: "G.4.5. Collection Data Hash"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14400-14419
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.4.5. Collection Data Hash

```cddl
; An array of URIs and their associated hashes
$collection-data-hash-map /= {
  "uris": [1* $uri-hashed-data-map],

  ; A string identifying the cryptographic hash algorithm used to compute the
  ; hash on each entry of the `uris` array, taken from the C2PA hash algorithm
  ; identifier list.
  "alg": tstr .size (1..max-tstr-length),
  ? "zip_central_directory_hash" : bstr,
}

; URN-based record identifiers for container formats whose members are named by
; URN rather than by path (e.g., WARC-Record-ID in WARC files), per RFC 8141.
relative-url-type  /= tstr .regexp "urn:[a-zA-Z0-9][a-zA-Z0-9-]{0,30}[a-zA-Z0-9]:[a-zA-Z0-9()+,\\-./:=@;$_!*'&~%#]+"
```

<a id="cddl_annex_multi_asset_hash"></a>
