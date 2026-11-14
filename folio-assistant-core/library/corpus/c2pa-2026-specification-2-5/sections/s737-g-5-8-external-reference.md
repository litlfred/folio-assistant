---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s737-g-5-8-external-reference
section_title: "G.5.8. External Reference"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 15045-15079
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.5.8. External Reference

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

<a id="cddl_annex_cloud_data"></a>
