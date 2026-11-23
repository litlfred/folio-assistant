---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s077-8-8-redaction-of-assertions
section_title: "8.8. Redaction of Assertions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 905-925
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 8.8. Redaction of Assertions

Assertions that are present in an asset-embedded manifest may be removed from that asset’s manifest when the asset is [used as an ingredient](#_ingredient_storage). This process is called redaction.

Redaction shall be performed either by removing the entire assertion from the manifest’s assertion store or by replacing its content, as described in [Section 14.10.3, “Redacted Assertion Representation”](#_redacted_assertion_representation).

In addition, a record that something was removed shall be added to the [claim](#_claims) in the form of a [URI reference](#_uri_references) to the redacted assertion in the `redacted_assertions` field of the claim. It is also strongly recommended that the claim generator should add a `c2pa.redacted` [action](#_actions) with a `redacted` field as described in [Section 16.4.1.4.8, “Parameters”](#_parameters).

When redacting an ingredient assertion that references a C2PA Manifest, the associated manifest shall be removed from the C2PA Manifest Store if no other references to it remain after redacting.

> **NOTE:**
> Because each assertion’s [URI reference](#_uri_references) includes the assertion label, it is also known what type of information (e.g., thumbnail, metadata, etc.) was removed. This enables both humans and machines to apply rules to determine if the removal was acceptable.

Unless the assertion redaction is accompanied by changes to the data covered by [content bindings](#_binding_to_content), an [update manifest](#_update_manifests) should be used to document the redaction, to indicate that [digital content](#_digital_content) was not changed.

Claim generators shall not redact assertions with a label of `c2pa.actions` or `c2pa.actions.v2` as this assertion type represents essential information in understanding the history of an asset. When creating an [update manifest](#_update_manifests), the claim generator shall not redact the [hard binding to content](#_binding_to_content) assertion that applies to the current asset.

> **NOTE:**
> How a validator handles redacted assertions, including the representation described in [Section 14.10.3, “Redacted Assertion Representation”](#_redacted_assertion_representation), is described in [Section 14.10, “Validate the Assertions”](#_validate_the_assertions).

<a id="_specifications_of_time_in_assertions"></a>
