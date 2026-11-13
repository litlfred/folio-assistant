---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s476-16-6-7-2-schema-and-example
section_title: "16.6.7.2. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9507-9545
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.6.7.2. Schema and Example

The schema for this type is defined by the `cloud-data-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.5.9, “Cloud Data”](#cddl_annex_cloud_data) for the complete normative schema):

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

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) is shown below:

```none
{
  "size": 4321,
  "label": "c2pa.metadata",
  "location": {
    "alg": "sha256",
    "url": "https://some.storage.us/foo",
    "hash": b64'zP84FPSremIrAQHlhw+hRYQdZp/+KggnD0W8opXlIQQ='
  },
}
```

<a id="_metadata"></a>
