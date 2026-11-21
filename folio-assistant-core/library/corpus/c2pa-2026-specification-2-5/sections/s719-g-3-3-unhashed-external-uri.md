---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s719-g-3-3-unhashed-external-uri
section_title: "G.3.3. Unhashed External URI"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14098-14114
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.3.3. Unhashed External URI

```cddl
; The data structure used to store a reference to an external URI WITHOUT a
; hash. This might include, for example, http/https reference or URI reference
; to a smart contract under CAIP-10 convention
unhashed-ext-uri-map = {
  "url": tstr, ; URI reference
  ? "dc:format": format-string, ; IANA media type of the data
  ? "size": size-type, ; Number of bytes of data

  ; additional information about the data's type
  ? "data_types": [1* asset-type-map],
}
```

<a id="cddl_annex_uri_hashed_data"></a>
