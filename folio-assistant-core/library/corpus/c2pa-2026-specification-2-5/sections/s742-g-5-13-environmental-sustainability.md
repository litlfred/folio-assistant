---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s742-g-5-13-environmental-sustainability
section_title: "G.5.13. Environmental Sustainability"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 15362-15384
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.5.13. Environmental Sustainability

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

<a id="cddl_annex_ai_disclosure"></a>
