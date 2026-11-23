---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s573-a-3-17-3-hard-binding
section_title: "A.3.17.3. Hard binding"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11320-11342
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.17.3. Hard binding

A claim generator creating a checkpoint shall include a [`c2pa.hash.segment`](#_segment_hash) assertion, which is the [hard binding](#_hard_bindings) for the segment that checkpoint covers. A checkpoint manifest shall not use a `c2pa.hash.data` assertion for this purpose.

An example of the assertion for a checkpoint written into a file using CRLF line endings is shown below; the values correspond to the second checkpoint in [Section A.3.17.6, “Test vectors”](#_append_only_text_test_vectors).

```none
{
  "version": 1,
  "alg": "sha256",
  "hash": b64'axfDsyQ12xTN4nWbwIPzKx/rxSLSC1UQhasygsqD4Ls=',
  "segmentStart": 127,
  "segmentEnd": 143,
  "sentinelLength": 113,
  "predecessorSentinel": {
    "start": 14,
    "length": 113,
    "hash": b64'52VROEjEl9C7I15jXoXVjuO9LzZvsBVf04bXeubHuM8='
  }
}
```

<a id="_chain_structure"></a>
