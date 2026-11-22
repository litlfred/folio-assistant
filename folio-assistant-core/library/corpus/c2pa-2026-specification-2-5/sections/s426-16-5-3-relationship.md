---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s426-16-5-3-relationship
section_title: "16.5.3. Relationship"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8111-8137
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 16.5.3. Relationship

When adding an ingredient, its relationship to the current asset shall be described. The possible values of the `relationship` field and their meanings are shown in [Table 6, “Ingredient Relationships”](#ingredient-relationships).

**Table 6. Ingredient Relationships**

| Value | Meaning |
| --- | --- |
| `parentOf` | The current asset is a derived asset or asset rendition of this ingredient. This relationship value is also used with [update manifests](#_update_manifests). |
| `componentOf` | The current asset is composed of multiple parts, this ingredient being one of them. |
| `inputTo` | This ingredient was used as input to a computational process, such as an AI/ML model, that led to the creation or modification of this asset. |

When adding an ingredient assertion, a claim generator shall add a `c2pa.actions` assertion (see [Section 16.4.1, “Actions”](#_actions)), if one does not already exist in the active manifest. Depending on the type of ingredient, one of the following new entries shall be added to the `actions` array of a `c2pa.actions` assertion.

*   When adding an ingredient with a `parentOf` relationship, a `c2pa.opened` action shall be added to the `actions` array.
    
*   When adding an ingredient with a `componentOf` relationship, a `c2pa.placed` action shall be added to the `actions` array.
    

This requirement only applies to [Standard Manifests](#_standard_manifests), since recording actions is only supported in that manifest type.

> **NOTE:**
> See [Section 16.4.1.12, “Relationship Between Actions and Ingredients”](#actions_ingredients_relationship) for a summary of the requirements linking actions and ingredients, including the use of `digitalSourceType`.

An ingredient assertion with a `parentOf` or `componentOf` relationship shall be listed in the same field of the claim (`created_assertions` or `gathered_assertions`, see [Section 10.3.2.1, “Adding Assertions and Redactions”](#_adding_assertions_and_redactions)) as the actions assertion that refers to it (see [Section 16.4.1.4.8, “Parameters”](#_parameters)). For example, since the actions assertion containing the mandatory `c2pa.opened` action is required to be listed in `created_assertions` (see [Section 16.4.1.2, “Mandatory presence of at least one actions assertion”](#mandatory-inception-actions)), and its associated `parentOf` ingredient assertion shall likewise only be listed in `created_assertions`.

<a id="_title"></a>
