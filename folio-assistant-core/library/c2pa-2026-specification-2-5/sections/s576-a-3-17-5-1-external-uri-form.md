---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s576-a-3-17-5-1-external-uri-form
section_title: "A.3.17.5.1. External URI form"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11353-11377
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### A.3.17.5.1. External URI form

Before writing, the claim generator shall choose the URI at which this checkpoint’s manifest will be stored. The URI need not resolve until after signing.

1.  Record _S_ = the current byte offset of the end of the file (the start of the new segment, and the value of `segmentStart`).
    
2.  Append the new segment content to the file.
    
3.  Record _E_ = the current byte offset of the end of the file (the start of the sentinel, and the value of `segmentEnd`).
    
4.  If this is not the first checkpoint, record _P_ = the byte offset of the first byte of the preceding checkpoint’s sentinel line and _PL_ = the byte length of that line including its terminating line ending, then read the bytes `[P, P + PL)` and compute their hash using the chosen `alg`. These three values become `predecessorSentinel.start`, `predecessorSentinel.length` and `predecessorSentinel.hash` respectively.
    
5.  Format the complete sentinel line, in the form defined in [Section A.3.17.2, “Sentinel line”](#_append_only_sentinel_line) for the file’s format, followed by the file’s line ending. Record _L_ = the byte length of that line, which is the value of `sentinelLength`.
    
6.  Append the complete sentinel line to the file in a single write operation. The file shall not be modified again for the purposes of this checkpoint.
    
7.  Build the `c2pa.hash.segment` assertion with `version` of `1`, `segmentStart` of _S_, `segmentEnd` of _E_, `sentinelLength` of _L_, `hash` of the hash of the bytes `[S, E)` computed using `alg`, and `predecessorSentinel` where applicable.
    
8.  Build and sign the complete C2PA Manifest Store, then store it at the URI chosen before step 1.
    

> **NOTE:**
> Step 6 is the only write to the file. The manifest is constructed and signed after the sentinel has been appended, so the procedure is compatible with write-once, read-many (WORM) storage and with append-only object storage APIs.

<a id="_inline_form"></a>
