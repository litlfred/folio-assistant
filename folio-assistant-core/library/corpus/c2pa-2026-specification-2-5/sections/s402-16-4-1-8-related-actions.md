---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s402-16-4-1-8-related-actions
section_title: "16.4.1.8. Related Actions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 7043-7047
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.1.8. Related Actions

When a series of actions are related to each other, usually taking place at the same time, it can be useful to associate them accordingly. The `related` field, in the v2 action, provides a place to list the additional actions that are related. Each related action should be a subset of the primary action, only including those fields that differ. Just as with an action template, the values are merged with those of the primary action, by a C2PA Manifest Consumer to get a full picture of each related action.

<a id="_asset_renditions"></a>
