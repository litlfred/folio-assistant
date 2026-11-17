---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s744-g-5-15-linked-resource-integrity
section_title: "G.5.15. Linked Resource Integrity"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 15451-15485
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.5.15. Linked Resource Integrity

```cddl
; One or more external resources with cryptographic hashes, used when the
; container format only supports absolute references to external resources.
external-resources-map = {
  "externalResources": [1* $hashed-ext-uri-map],
}

; One or more relative resources with cryptographic hashes, used when the
; container format supports references relative to the asset.
relative-resources-map = {
  "relativeResources": [1* $uri-hashed-data-map],

  ; A string identifying the cryptographic hash algorithm used to compute the
  ; hash on each entry of the `relativeResources` array, taken from the C2PA
  ; hash algorithm identifier list.
  "alg": tstr .size (1..max-tstr-length),
}

linked-resource-integrity-map = {
  ; the resources - either external or relative - that are part of the
  ; asset, and their associated hashes
  "resources": external-resources-map / relative-resources-map,

  ; If true, all URIs embedded in the container format are covered by
  ; this assertion. If false or absent, additional unreferenced URIs may exist.
  ? "allURIsIncluded": bool,

  ; Additional information about the assertion
  ? "metadata": $assertion-metadata-map,
}
```

<a id="cddl_annex_depthmap_gdepth"></a>
