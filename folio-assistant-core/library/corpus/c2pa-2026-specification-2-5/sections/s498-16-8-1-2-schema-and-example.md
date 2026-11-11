---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s498-16-8-1-2-schema-and-example
section_title: "16.8.1.2. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9879-9919
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.8.1.2. Schema and Example

The schema for this type is defined by the `environmental-sustainability-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.5.13, “Environmental Sustainability”](#cddl_annex_environmental_sustainability) for the complete normative schema):

```cddl
; The environmental sustainability assertion describes sustainability
; measurements associated with the creation or modification of an asset.

environmental-sustainability-map = {
  ? "energy_kwh": environmental-sustainability-measurement-map,
  ? "carbon_kgco2e": environmental-sustainability-measurement-map,
  ? "water_litres": environmental-sustainability-measurement-map,
  ? "metadata": $assertion-metadata-map,
  * tstr => any ; allow for any other custom use case
}

environmental-sustainability-measurement-map = {
  "value": float .ge 0,
  ? "measurementMethod": $sustainability-measurement-method
}

$sustainability-measurement-method /= tstr .regexp "([\\da-zA-Z_-]+\\.)+[\\da-zA-Z_-]+"
```

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) is shown below. In this example, the asset is a TensorFlow model file of version 2.11.0 which is stored in the SavedModel format.

```none
{
  "carbon_kgco2e": {
    "value": 0.74
  },
  "water_litres": {
    "value": 12.3
  },
  "energy_kwh": {
    "value": 1.82
  }
}
```

<a id="_ai_disclosure"></a>
