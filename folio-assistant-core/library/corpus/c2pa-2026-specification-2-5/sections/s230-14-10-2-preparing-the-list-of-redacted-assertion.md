---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s230-14-10-2-preparing-the-list-of-redacted-assertion
section_title: "14.10.2. Preparing the list of redacted assertions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3026-3035
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.10.2. Preparing the list of redacted assertions

A validator, when processing a claim, shall gather the set of redacted assertions for each ingredient’s manifest (if present) based on each JUMBF URI listed in its `redacted_assertions` field. A claim’s `redacted_assertions` field shall never include a JUMBF URI to any of its own assertions.

> **NOTE:**
> Assertions can be redacted from ingredient assets at any point in the final asset’s provenance history, and not necessarily by the claim generator that first uses an ingredient asset as an ingredient.

For more details, refer to the [Section 14.11.3.2, “Performing explicit validation”](#_performing_explicit_validation) section.

<a id="_redacted_assertion_representation"></a>
