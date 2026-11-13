---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s086-9-4-2-1-embedded
section_title: "9.4.2.1. Embedded"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1066-1108
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 9.4.2.1. Embedded

A `hashed_uri` is used when the URI is for something embedded in the same C2PA Manifest Store.

This specification provides an equivalent `hashed-uri-map` data structure for schemas using a [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.3.1, “Hashed URI”](#cddl_annex_hashed_uri) for the complete normative schema):

CDDL for hashed URI

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

Because assertion stores shall be located in the same C2PA Manifest box as the claim that refers to them, only `self#jumbf` URIs are permitted. These `self#jumbf` URIs may be relative to the entire C2PA Manifest Store, in which case they shall start with a `/` (U+002F, Slash), or relative to the current C2PA Manifest. URIs shall not contain the sequence `..` (a pair of U+002E, Full Stop).

Example 1. Example `self#jumbf` URIs

The following are examples of valid `self#jumbf` URIs:

*   `self#jumbf=/c2pa/urn:c2pa:F095F30E-6CD5-4BF7-8C44-CE8420CA9FB7/c2pa.assertions/c2pa.thumbnail.claim` is relative to the entire store (since it starts with `/`);
    
*   `self#jumbf=c2pa.assertions/c2pa.thumbnail.claim` would be relative to the manifest of the box containing the URI.
    

<a id="hashed-ext-uri"></a>
