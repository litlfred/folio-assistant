---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s581-a-3-17-6-3-first-checkpoint-lf-line-endings-inli
section_title: "A.3.17.6.3. First checkpoint, LF line endings, inline manifest"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11433-11447
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### A.3.17.6.3. First checkpoint, LF line endings, inline manifest

The file content is the same 12 bytes as the first example, but the C2PA Manifest Store is embedded inline in the sentinel line. The `sentinelLength` field is absent, because the length of the sentinel line is not known when the manifest is signed, and the `hash` value is therefore identical to that of the first example:

```none
{
  "version": 1,
  "alg": "sha256",
  "hash": b64'Hsg2fWyLWendDHpPRyFNuNLnbr0s1b9BVVCMsnJj3S8=',
  "segmentStart": 0,
  "segmentEnd": 12
}
```

<a id="_embedding_manifests_into_pdfs"></a>
