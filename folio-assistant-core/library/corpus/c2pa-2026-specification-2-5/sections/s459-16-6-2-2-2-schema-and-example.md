---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s459-16-6-2-2-2-schema-and-example
section_title: "16.6.2.2.2. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8873-8941
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.6.2.2.2. Schema and Example

The schema for this assertion is defined by the `original-preservation-image-representation` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.5.17, “Alternative Content Representation”](#cddl_annex_alt_content_rep) for the complete normative schema):

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

The schema for the `c2pa.alternative-content-representation` assertion is defined by the following abstract rule, which permits the inclusion of either an `original-preservation-image-representation` or a `generic-representation structure`. The `type` field within the alternative content representation assertion shall be set to `exif.originalPreservationImage`. The `parameters` field shall be the `original-preservation-image-params` structure. The `original-preservation-image-params` structure shall use either the `multiAssetPartIndex` field to reference OPI data located within the asset in MPF, or the `embeddedOriginalPreservationImage` field to record the OPI inside the manifest, but shall not use both.

An example in CBOR Diagnostic Format (`.cbordiag`) is shown below:

```none
// The case for reference Original Preservation Image(OPI) data located within the asset in MPF. //
{
  "type": "exif.originalPreservationImage",
  "parameters": {
    "multiAssetPartIndex": 1
  }
}

// The case for recording the OPI inside the manifest. //
{
  "type": "exif.originalPreservationImage",
  "parameters": {
    "embeddedOriginalPreservationImage" : {
       "url" : "self#jumbf=c2pa.assertions/c2pa.embedded-data",
       "hash": b64'Hf0IgeqbL0m+FTTLpUWwsDGR8pvhUR1AlwvaXjQ0qGY='
   }
  }
}
```

<a id="_asset_type"></a>
