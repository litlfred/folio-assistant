---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s385-16-4-1-3-all-actions-included
section_title: "16.4.1.3. All actions included"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6694-6706
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.1.3. All actions included

The generator shall set the `actions-map-v2` field, `allActionsIncluded`, which has a boolean value. If `allActionsIncluded` has a value of true, then the claim generator is stating that all actions performed on the asset are described in the actions assertion(s). If `allActionsIncluded` has a value of false, then the claim generator is stating that additional, unrecorded actions may have been performed. Manifest consumers should interpret an omitted `allActionsIncluded` field as indicating that additional, unrecorded actions may have been performed.

> **NOTE:**
> In previous versions of this specification, this field was optional.

In the situation where a claim generator is opening an asset strictly for the purposes of recording its `c2pa.opened` action and then immediately re-saving it without making any other changes, the claim generator shall set `allActionsIncluded` to true to assert that no other actions were performed on the asset.

> **NOTE:**
> An actions assertion declares _what_ was done to an asset. One use of an [external reference](#external_reference_assertion) assertion with a hashed location is to provide a cryptographically bound reference to data about the process. When using them in this way, these assertions can be linked to actions via [`relatedAssertions`](#related_assertions).

<a id="_fields_in_the_actions_assertion"></a>
