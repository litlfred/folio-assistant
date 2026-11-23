---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s248-14-10-5-3-1-permitted-schemes-and-identifiers
section_title: "14.10.5.3.1. Permitted schemes and identifiers"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3447-3456
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.10.5.3.1. Permitted schemes and identifiers

A validator may limit automated retrieval performed under this procedure to the `https` URI scheme, and may decline to dereference other schemes (such as `file` or `ftp`) and non-network identifiers.

> **NOTE:**
> Unencrypted `http` is discouraged by standard industry practice.

A validator may reject a URI whose authority component contains a `userinfo` subcomponent (i.e. `user:password@host`) before a retrieval attempt is made.

<a id="_credential_handling"></a>
