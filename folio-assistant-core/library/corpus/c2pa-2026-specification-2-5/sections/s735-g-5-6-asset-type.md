---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s735-g-5-6-asset-type
section_title: "G.5.6. Asset Type"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14961-14986
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.5.6. Asset Type

```cddl
; The asset type assertion provides a way to describe the type or format of an
; asset, specifically additional context on how to parse or otherwise process
; it. It can also be used to describe externally referenced or related assets
; such as AI/ML models.

asset-type-map = {
  "type": $asset-type-choice, ; one of the listed choices or a custom value

  ; The version of the asset type, if applicable. This is a SemVer formatted
  ; string.
  ? "version": semver-string
}

asset-types = {
  ? "dc:format": format-string, ; IANA media type of the asset
  ? "types": [* asset-type-map], ; a collection of types related to the asset

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map
}
```

<a id="cddl_annex_asset_type_choices"></a>
