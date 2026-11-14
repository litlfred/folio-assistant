---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s768-h-3-2-schema-and-example
section_title: "H.3.2. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 16138-16156
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### H.3.2. Schema and Example

The schema for this type is defined by the `data-box-map` rule in the [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) in [CDDL for data box](#cddl_for_data_box).:

CDDL for data box

```cddl
; box allowing for the storage of arbitrary data

data-box-map = {
  "dc:format": format-string, ; IANA media type of the data
  "data" : bstr, ; arbitrary text/binary data

  ; additional information about the data's type
  ? "data_types": [1* asset-type-map],
}
```

<a id="_data_box_store"></a>
