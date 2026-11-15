---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s068-8-1-general
section_title: "8.1. General"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 802-819
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 8.1. General

It is expected that each claim generator, used by actors in the system that creates or processes an asset, will create or assemble one or more assertions about when, where, and how the asset was originated or transformed. An assertion is labelled data, typically (though not required to be) in a CBOR-based structure which represents a declaration about an asset. Some of these assertions will contain human-generated information (e.g., alternate text for accessibility) while others will come from machines (software/hardware) providing the information they generated (e.g., camera type).

Some examples of assertions are:

*   metadata (e.g., camera information such as maker or lens);
    
*   actions performed on the asset (e.g., clipping, colour correction);
    
*   thumbnail of the asset or its ingredients;
    
*   content bindings (e.g., cryptographic hashes).
    

Certain assertions may be redacted by subsequent claims (see [Section 8.8, “Redaction of Assertions”](#_redaction_of_assertions)), but they cannot be modified once made as part of a claim.

<a id="assertion_labels"></a>
