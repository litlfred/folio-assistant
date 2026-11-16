---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s406-16-4-1-12-relationship-between-actions-and-ingre
section_title: "16.4.1.12. Relationship Between Actions and Ingredients"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 7117-7133
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.1.12. Relationship Between Actions and Ingredients

Actions and ingredients are closely related concepts: an actions assertion records _what_ happened to an asset, while an ingredient assertion records the other asset(s) or data involved in that history. The requirements linking the two are described throughout this section and [Section 16.5, “Ingredient”](#ingredient_assertion); this section summarizes them for ease of reference.

In many cases, adding an ingredient to a C2PA Manifest requires a corresponding entry in the `actions` array, and vice versa. For example, a `c2pa.opened` or `c2pa.placed` action is required to reference the ingredient assertion(s) it was recorded for, as described in [Section 16.5.3, “Relationship”](#_relationship) and [Section 16.4.1.4.8, “Parameters”](#_parameters).

> **NOTE:**
> The referenced ingredient assertion could be one whose C2PA Manifest was located via a soft binding lookup, as described in [Section 16.4.1.10, “Soft Binding Lookup”](#_soft_binding_lookup).

Other actions can reference ingredients for other purposes, such as:

*   A `c2pa.created` action for an asset produced from other assets or data, such as via a Generative AI model, may reference one or more `inputTo` ingredients describing those inputs (see [Example 5, “Example of an action for Generative AI”](#generative_example)).
    
*   A `c2pa.deleted` action may reference a `componentOf` ingredient assertion when the deletion covers all of that ingredient’s content, and should be paired with a `c2pa.redacted` action when that ingredient assertion is also redacted, as described in [Section 16.4.1.11, “Removing Previous Ingredients”](#_removing_previous_ingredients).
    

<a id="_digital_source_type_2"></a>
