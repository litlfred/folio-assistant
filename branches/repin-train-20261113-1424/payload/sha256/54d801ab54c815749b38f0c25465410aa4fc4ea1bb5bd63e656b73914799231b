---
# folio-assistant-kjea
$schema: bean/1.0.0
title: 'smart-base: move 21 skill I/O contracts from schemas/skills/ into their L1..L4 subgraphs'
status: todo
type: task
priority: normal
tags:
    - smart-base
    - subgraphs
    - skill-contracts
created_at: 2026-11-13T12:07:20Z
updated_at: 2026-11-13T12:07:20Z
parent: folio-assistant-95e7
---

## Why

Parent: `folio-assistant-95e7`. Owner, 2026-11-13: `smart-base/schemas/skills/l2-dependency-choice/input.schema.json` was meant to be in the L2 subgraph. The skill `.md` files moved (issue #359); their contracts did not.

Blocked on bean `cat-tools-st4q`: until it lands, a moved contract is not published and gets no IRI.

| subgraph | contracts → `L<n>/schemas/skills/<id>/` |
|---|---|
| L1 | classify-and-code-content, dak-l1-library, indicator-extraction, recommendation-candidates, recommendation-extraction, transcription-verbatim |
| L2 | l2-dak-authoring, l2-dependency-choice, recommendation-scenarios |
| L3 | l3-dependency-choice, l3-readiness |
| L4 | activate-accepted-guidance, apply-decision-support, complete-sdc-questionnaire, extract-questionnaire-response, inform-client, l4-application-brief, l4-application-build, record-decision-rationale, review-client-history, review-decision-support-guidance |
| stay at root | guideline-use-case, smart-guideline-end-to-end (their skills span L1–L4) |

## Done when

- [ ] `git mv` of the 21 directories; `L4/graph.json` declares an `L4-schemas` directory (L4 has none today).
- [ ] `input:`/`output:` front matter of the 21 skill `.md` files updated.
- [ ] `L3/tools/terminology-lookup/terminology-lookup.ts:59` and `schemas/dak-kinds.ts:44` updated; the `smart-base-schemas` description in `smart-base.json` updated.
- [ ] `bun run cat split:baseline --check` unchanged; the contract IRIs are as `cat-tools-st4q` specifies.
