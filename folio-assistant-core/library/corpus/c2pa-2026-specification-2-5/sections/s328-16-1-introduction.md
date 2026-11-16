---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s328-16-1-introduction
section_title: "16.1. Introduction"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4569-4583
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 16.1. Introduction

This section of the document lists the standard set of assertions for use by C2PA implementations, describing their syntax, usage, etc. To keep things simple, all example JUMBF URIs have been shortened for illustrative purposes - full URIs are necessary in the actual data.

All assertions shall have a label as described in [Section 8.2, “Labels”](#assertion_labels) and shall be versioned as described in [Chapter 5, _Versioning_](#_versioning).

All C2PA standardized assertions use the JSON JUMBF content type, the CBOR JUMBF content type, or the Embedded File content type from ISO 19566-5:2023. Entity-specific assertions can be any of those, any of the other JUMBF content types from ISO 19566-5:2023, Annex B (such as XML) or may create its own (as per the instructions in ISO 19566-5:2023, Table B.1). The Codestream content type shall not be used for a C2PA assertion.

Unless otherwise mentioned, all assertions documented in this standard set of assertions shall be serialized as CBOR. All assertions that are serialized as CBOR shall comply with the Core Deterministic Encoding Requirements of CBOR (see [RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 4.2.1) with their schemas defined using a [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610).

For those defined using JSON, their schemas are defined using the latest version of [JSON Schema](https://json-schema.org/specification-links.html).

To make the standard assertions easier to navigate, they are grouped below into functional clusters rather than being presented as a single flat list. Two structures described in this section are used _by_ assertions rather than being assertions in their own right: [Metadata About Assertions](#_metadata_about_assertions), which describes optional metadata that may be attached to an assertion, and [Regions of Interest](#_regions_of_interest), which identifies the spatial, temporal or other regions of an asset that an assertion refers to. Both are defined in [Assertion-Supporting Structures](#_assertion_supporting_structures) at the end of this section.

<a id="_standard_c2pa_assertion_summary"></a>
