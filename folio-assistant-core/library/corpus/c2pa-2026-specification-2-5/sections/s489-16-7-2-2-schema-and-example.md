---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s489-16-7-2-2-schema-and-example
section_title: "16.7.2.2. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9694-9717
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.7.2.2. Schema and Example

The schema for this type is defined by the `time-stamp-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.6.3, “Time Stamp”](#cddl_annex_time_stamp) for the complete normative schema):

```cddl
; The data structures used to store an array of
; manifest URNs to time stamp "blobs"
$time-stamp-map /= {
  * $time-stamp-entry => bstr
}

$time-stamp-entry /= tstr .regexp "^urn:c2pa:[\\da-zA-Z_-]+$"
```

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) is shown below:

```none
{
  "urn:c2pa:d61c74e0-ce26-4439-b92d-690dcce6b58e" : h'...',
  "urn:c2pa:ab8c2751-8711-455a-9a8b-37143bfc92c2" : h'...'
}
```

<a id="_requirements_3"></a>
