---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s746-g-5-17-alternative-content-representation
section_title: "G.5.17. Alternative Content Representation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 15573-15614
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.5.17. Alternative Content Representation

```cddl
; Describes a reference to an alternative version of the content
; (e.g. an original preservation image in Exif, a secure capture from TEE, etc.)
alternative-content-representation =
  original-preservation-image-representation
  / generic-representation

; The original-preservation-image-representation describes the location of the
; original captured scene image.
original-preservation-image-representation = {
  "type": "exif.originalPreservationImage",
  "parameters": original-preservation-image-params

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map,
}

original-preservation-image-params = {
  ; The zero-based index of the element within the parts array of the
  ; corresponding c2pa.hash.multi-asset assertion that uniquely identifies the
  ; location of the OPI.
  ? "multiAssetPartIndex": uint

  ; hashed URI reference to the embedded data assertion containing OPI, or to
  ; another assertion that is technically equivalent to an embedded data
  ; assertion (e.g., c2pa.thumbnail.claim).
  ? "embeddedOriginalPreservationImage": $hashed-uri-map,
  * tstr => any ; custom fields
}

generic-representation = {
  "type": tstr .regexp "([\\da-zA-Z_-]+\\.)+[\\da-zA-Z_-]+",
  "parameters": { * tstr => any }

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map,
}
```

<a id="cddl_annex_font_info"></a>
