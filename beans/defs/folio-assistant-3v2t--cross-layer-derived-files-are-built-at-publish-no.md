---
# folio-assistant-3v2t
$schema: bean/1.0.0
title: 'Cross-layer derived files are built at publish, not committed in one layer (owner option b, 2026-11-05)'
status: todo
type: task
priority: high
tags:
    - ci-speed
    - built-at-publish
created_at: 2026-11-05T00:00:00Z
updated_at: 2026-11-05T00:00:00Z
parent: folio-assistant-4j43
---

## Why

A file committed in one layer but derived from several layers goes stale whenever ANOTHER layer is re-pinned. The layer that holds it changed nothing; its own CI is green at the index's pins; and the next re-pin train turns red on it. The re-pin train work of 2026-11-03/04 hit this repeatedly:

- `docs/prov-qaqc/index.md` (cat-harness), from the workflow-instance records on the index's state branch (cat-harness#1022, #1023);
- `library/**/keywords.json` in every library, from log-entropy weights pooled over EVERY library in the checkout (core#635 judged 38 new stale files although it changed no library);
- BPMN drawings and checklists, and the kind JSON schemas, regenerated in cat-harness#1018, core#633, sci#174 and who-iris#177 for the same reason.

The owner was offered (a) the train opens regeneration PRs in each affected layer, which needs a cross-repository token, or (b) build these at publish instead of committing them. **Owner, 2026-11-05: "Yes on all"**, to the recommendation (b). This extends bean `p7mb` (whole-repository derived files built at publish, 2026-10-23) from one repository to across layers.

## Done when

- [ ] Each cross-layer derived writer is classified, with its reason: a RENDERING that can be declared `builtAtPublish`, or an INPUT that something gated reads from the checkout and so must stay committed (as `p7mb` classified glossary/generated, detangle and lsi:skills).
- [ ] Every rendering is declared `builtAtPublish` in its owning instance, gitignored and untracked, and its `:check` is satisfied by `isBuiltAtPublish` or retired with the reason.
- [ ] Whatever must stay committed is listed, with how it is kept current without the train going red on another layer's change.
- [ ] Two re-pin trains in a row move a library or a process-instance record without any of these files failing a gate (negative control).

## First candidates (to classify)

| writer | output | derived from |
|---|---|---|
| `prov:qaqc` | cat-harness `docs/prov-qaqc/index.md`, PROV logs | the index state branch's workflow records |
| `library:keywords` | `library/<slug>/keywords.json` in each library | every library in the checkout |
| `render:bpmn` | diagram SVGs under `docs/assets/img/workflows/` | diagrams that call across layers |
| `bpmn:checklist` | `<stem>.checklist.md` | committed by the owner's 2026-10-14 ruling; check whether cross-layer calls make it stale |
| `kind:json-schemas` | per-kind JSON Schemas | kinds registered by several layers |
| `libraries:derive` | `libraries/held/<layer>/` in cat-harness-tools | the pins of the layers below |

_2026-11-05_ — Filed by the re-pin train session, https://claude.ai/code/session_01EucfRp9ycxtZrrBKaipNy5, on the owner's "Yes on all".
