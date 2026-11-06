---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s752-g-6-3-time-stamp
section_title: "G.6.3. Time Stamp"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 15780-15792
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.6.3. Time Stamp

```cddl
; The data structures used to store an array of
; manifest URNs to time stamp "blobs"
$time-stamp-map /= {
  * $time-stamp-entry => bstr
}

$time-stamp-entry /= tstr .regexp "^urn:c2pa:[\\da-zA-Z_-]+$"
```

<a id="cddl_annex_rvals"></a>
