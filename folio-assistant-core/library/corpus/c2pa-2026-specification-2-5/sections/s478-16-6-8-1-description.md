---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s478-16-6-8-1-description
section_title: "16.6.8.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9549-9556
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.6.8.1. Description

In earlier versions of this specification, there were individual assertions for each metadata standard (e.g., IPTC, EXIF). In this version, there now exists a category of assertions that shall be used to represent metadata, in a standardized serialization. Having the metadata in an assertion establishes that the metadata in that assertion is significant, because it has been explicitly included in the C2PA Manifest, and signed by a specific signer - thus enabling cryptographic validation and attribution of the data. In addition, by using a common serialization, it enables manifest consumers to process it in a consistent manner.

> **NOTE:**
> These assertions can represent existing standards or they can be private specifications.

<a id="_common_requirements"></a>
