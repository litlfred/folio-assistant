---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s727-g-4-6-multi-asset-hash
section_title: "G.4.6. Multi-Asset Hash"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14420-14450
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.4.6. Multi-Asset Hash

```cddl
multi-asset-hash-map = {
  ; An array of one or more hashes for individual parts of the multi-part file
  "parts": [* part-hash-map]
}

byte-range-locator = (
  "byteOffset": uint ; The byte offset of the part within the file
  "length": uint ; The length of the part
)

; this is a special CDDL map of choices (meaning that only one of the following
; can be present)
; The byte offset & length of the part within the file
; An XPath to the BMFF box of the part
locator-map = {
  (byte-range-locator // "bmffBox": tstr)
}

part-hash-map = {
  "location" : locator-map, ; The location of the part within the file

  ; hashed_uri to the hash assertion of the part
  "hashAssertion": $hashed-uri-map,
  ? "optional": bool, ; If the part is optional and can be discarded
}
```

<a id="cddl_annex_segment_hash"></a>
