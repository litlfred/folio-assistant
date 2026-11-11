---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s738-g-5-9-cloud-data
section_title: "G.5.9. Cloud Data"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 15080-15102
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.5.9. Cloud Data

```cddl
; Assertion that references the actual assertion stored in the cloud
cloud-data-map = {
  "label": tstr, ; label for the cloud-based assertion (eg.c2pa.actions)
  "size": size-type, ; Number of bytes of data

  ; http(s) URL to where the cloud-hosted assertion can be found
  "location": $hashed-ext-uri-map,

  ; media/MIME type for the data
  ? "content_type": tstr .regexp "^[-\\w.]+/[-+\\w.]+$",

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map,
}

; size is minimum 1 in multiples of 1.0
size-type = int .ge 1
```

<a id="cddl_annex_regions_of_interest"></a>
