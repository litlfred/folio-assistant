---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s720-g-3-4-uri-hashed-data
section_title: "G.3.4. URI Hashed Data"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14115-14140
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.3.4. URI Hashed Data

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

<a id="_hash_assertions"></a>
