---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s125-11-5-3-1-processing-rules
section_title: "11.5.3.1. Processing Rules"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1671-1678
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 11.5.3.1. Processing Rules

A C2PA Manifest Consumer shall never process an assertion, assertion store, claim, claim signature or C2PA Manifest that is not contained inside of a C2PA Manifest Store. Additionally, when a C2PA Manifest Consumer encounters a JUMBF box or superbox whose JUMBF type UUID it does not recognize, it shall skip over (and ignore) its contents.

> **NOTE:**
> This means that the C2PA Manifest Consumer can process private boxes that it knows about, but ignore ones of which it is unaware.

<a id="_toggles"></a>
