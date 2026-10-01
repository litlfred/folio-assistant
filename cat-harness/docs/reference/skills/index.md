---
layout: default
generated: scripts/gen-schema-docs.ts — do not hand-edit; edit the schema
title: Skill schema reference
nav_order: 7
has_children: true
---

# Skill schema reference

Every folio-assistant skill declares a typed **input** and **output** contract as
JSON Schema (draft-07). These pages are generated from those schemas so the
published reference can never drift from what the framework actually validates.

| Skill | Id | Description |
|-------|----|-------------|
| [BPMN Authoring](bpmn-authoring.html) | `bpmn-authoring` | Input schema for BPMN 2.0 business process authoring. |
| [Content Author](content-author.html) | `content-author` | Input schema for general content authoring. |
| [Content Feedback](content-feedback.html) | `content-feedback` | Input schema for feedback collection and triage. |
| [Content Plan](content-plan.html) | `content-plan` | Input schema for content planning — scope, team, timeline, governance. |
| [Content Publish](content-publish.html) | `content-publish` | Input schema for content publication. |
| [Content Review](content-review.html) | `content-review` | Input schema for formal content review and approval workflow. |
| [Content Test](content-test.html) | `content-test` | Input schema for end-to-end content testing. |
| [Content Validate](content-validate.html) | `content-validate` | Input schema for content validation. |
| [CRDM Detect](crdm-detect.html) | `crdm-detect` | One user request to classify: is it a feature request (a platform capability change, which enters the CRDM requirements workflow) or a content request? |
| [DMN Authoring](dmn-authoring.html) | `dmn-authoring` | Input schema for DMN (Decision Model and Notation) decision table authoring. |

See also the [Skill instructions](../skill-instructions/) (the prose how-to
bodies the LLM loads) and the [TypeScript API reference](../../api/) for the
content-object model (`Block`, `Chapter`, `Paper`, builders, and Zod constraints).
