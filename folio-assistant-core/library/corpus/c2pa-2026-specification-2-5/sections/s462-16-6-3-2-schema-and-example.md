---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s462-16-6-3-2-schema-and-example
section_title: "16.6.3.2. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9018-9063
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.6.3.2. Schema and Example

The schema for this type is defined by the `asset-types` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.5.6, “Asset Type”](#cddl_annex_asset_type) for the complete normative schema):

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

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) is shown below. In this example, the asset is a TensorFlow model file of version 2.11.0 which is stored in the SavedModel format.

```none
{
  "types":
  [
    {
      "type": "c2pa.types.model.tensorflow",
      "version": "2.11.0"
    },
    {
      "type": "c2pa.types.tensorflow.savedmodel",
      "version": "2.11.0"
    }
  ]
}
```

<a id="_details_on_selection_of_a_value_for_type"></a>
