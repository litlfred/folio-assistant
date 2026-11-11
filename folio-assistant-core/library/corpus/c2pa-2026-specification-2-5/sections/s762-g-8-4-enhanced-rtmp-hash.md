---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s762-g-8-4-enhanced-rtmp-hash
section_title: "G.8.4. Enhanced RTMP Hash"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 16065-16077
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.8.4. Enhanced RTMP Hash

```cddl
; The data structure used to store the cryptographic hash of an
; Enhanced RTMP (E-RTMP) segment's media payload.
rtmp-hash-map = {
  ; hash algorithm identifier, taken from the C2PA hash algorithm identifier list
  "alg": tstr .size (1..max-tstr-length),
  "hash": bstr, ; byte string of the hash value
}
```

<a id="deprecated_constructs_annex"></a>
