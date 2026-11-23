---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s579-a-3-17-6-1-first-checkpoint-lf-line-endings
section_title: "A.3.17.6.1. First checkpoint, LF line endings"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11404-11425
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### A.3.17.6.1. First checkpoint, LF line endings

The segment is the 12 bytes `61 6C 70 68 61 0A 62 72 61 76 6F 0A`, which is `alpha` and `bravo`, each terminated by LF. The sentinel line occupies the bytes `[12, 124)`, a length of 112 bytes including its LF terminator:

```none
-----BEGIN C2PA CHECKPOINT----- https://northwindtraders.com/provenance/chk1.c2pa -----END C2PA CHECKPOINT-----
```

The assertion records `segmentStart` of 0, `segmentEnd` of 12 and `sentinelLength` of 112, with `hash` being the SHA-256 of the bytes `[0, 12)`:

```none
{
  "version": 1,
  "alg": "sha256",
  "hash": b64'Hsg2fWyLWendDHpPRyFNuNLnbr0s1b9BVVCMsnJj3S8=',
  "segmentStart": 0,
  "segmentEnd": 12,
  "sentinelLength": 112
}
```

<a id="_second_checkpoint_crlf_line_endings"></a>
