---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s734-g-5-5-asset-reference
section_title: "G.5.5. Asset Reference"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14937-14960
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.5.5. Asset Reference

```cddl
; The asset reference assertion (ARA) describes where a copy of the asset may be
; obtained.
asset-ref-map = {
  "references": [1* ara-reference-block-map]

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map,
}

ara-reference-block-map = {
  "reference": ara-reference-uri-map,
  ? "description": tstr, ; Human readable description of the location.
}

ara-reference-uri-map = {
  ; URI reference a location where a copy of the asset may be obtained from
  "uri": tstr,
}
```

<a id="cddl_annex_asset_type"></a>
