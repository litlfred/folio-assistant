---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s577-a-3-17-5-2-inline-form
section_title: "A.3.17.5.2. Inline form"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11378-11398
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### A.3.17.5.2. Inline form

1.  Record _S_ = the current byte offset of the end of the file (the start of the new segment, and the value of `segmentStart`).
    
2.  Append the new segment content to the file.
    
3.  Record _E_ = the current byte offset of the end of the file (the start of the sentinel, and the value of `segmentEnd`).
    
4.  If this is not the first checkpoint, record _P_ = the byte offset of the first byte of the preceding checkpoint’s sentinel line and _PL_ = the byte length of that line including its terminating line ending, then read the bytes `[P, P + PL)` and compute their hash using the chosen `alg`. These three values become `predecessorSentinel.start`, `predecessorSentinel.length` and `predecessorSentinel.hash` respectively.
    
5.  Build the `c2pa.hash.segment` assertion with `version` of `1`, `segmentStart` of _S_, `segmentEnd` of _E_, `hash` of the hash of the bytes `[S, E)` computed using `alg`, and `predecessorSentinel` where applicable. The `sentinelLength` field shall not be present.
    
6.  Build and sign the complete C2PA Manifest Store.
    
7.  Base64-encode the signed C2PA Manifest Store, format the complete sentinel line embedding the result, and append it to the file in a single write operation. The file shall not be modified again for the purposes of this checkpoint.
    

> **NOTE:**
> Because `sentinelLength` is absent from the assertion, the manifest can be fully constructed and signed before the length of the sentinel line is known, which removes the circular dependency between the two and allows the sentinel to be appended in a single write. As with the external URI form, this procedure is compatible with WORM storage and with append-only object storage APIs.

<a id="_append_only_text_test_vectors"></a>
