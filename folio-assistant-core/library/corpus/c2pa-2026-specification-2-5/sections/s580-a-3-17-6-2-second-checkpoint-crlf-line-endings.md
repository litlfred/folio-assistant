---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s580-a-3-17-6-2-second-checkpoint-crlf-line-endings
section_title: "A.3.17.6.2. Second checkpoint, CRLF line endings"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11426-11432
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### A.3.17.6.2. Second checkpoint, CRLF line endings

In a file written with CRLF line endings, the first segment is the 14 bytes `alpha\r\nbravo\r\n` and the first sentinel line, using the same URI as above, occupies the bytes `[14, 127)`, a length of 113 bytes including its CRLF terminator. The second segment occupies the bytes `[127, 143)` and is the 16 bytes `charlie\r\n` followed by `delta\r\n`.

The assertion for the second checkpoint records `segmentStart` of 127, `segmentEnd` of 143 and `sentinelLength` of 113, with `hash` being the SHA-256 of the bytes `[127, 143)`, `predecessorSentinel.start` of 14, `predecessorSentinel.length` of 113 and `predecessorSentinel.hash` being the SHA-256 of the bytes `[14, 127)`. The assertion is shown in [Section A.3.17.3, “Hard binding”](#_append_only_hard_binding).

<a id="_first_checkpoint_lf_line_endings_inline_manifest"></a>
