---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s419-16-4-4-2-schema-and-example
section_title: "16.4.4.2. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 7903-7949
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.4.2. Schema and Example

The schema for this type is defined by the `asset-ref-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.5.5, “Asset Reference”](#cddl_annex_asset_ref) for the complete normative schema):

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

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) is shown below:

```none
{
  "references": [
    {
      "description": "A copy of the asset on the web",
      "reference": {
          "uri": "https://some.storage.us/foo"
        }
    },
    {
      "description": "A copy of the asset on IPFS",
      "reference": {
          "uri": "ipfs://cid"
        }
    }
  ]
}
```

<a id="_repository_receipt"></a>
