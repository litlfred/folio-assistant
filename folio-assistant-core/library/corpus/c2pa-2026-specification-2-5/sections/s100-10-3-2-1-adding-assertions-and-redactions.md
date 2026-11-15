---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s100-10-3-2-1-adding-assertions-and-redactions
section_title: "10.3.2.1. Adding Assertions and Redactions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1403-1409
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 10.3.2.1. Adding Assertions and Redactions

The claim shall contain a `created_assertions` field and may contain a `gathered_assertions` field. The combined values from those two fields represent a list of all of the URI references for all assertions that were added to the assertion store that are being "claimed" by this claim. In a standard manifest, the `created_assertions` field’s value shall include at least one assertion that represents a [hard binding](#_hard_bindings).

If any assertions in ingredient claims are being redacted, their URI references shall be added to list which is the value of the `redacted_assertions` field.

<a id="_adding_ingredients"></a>
