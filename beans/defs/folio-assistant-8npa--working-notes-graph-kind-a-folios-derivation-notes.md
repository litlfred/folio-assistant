---
# folio-assistant-8npa
title: 'Working-notes graph kind: a folio''s derivation notes, scoping docs and ledgers as declared context, not rendered content'
status: todo
type: task
tags:
    - graph-kind
    - from-qou
created_at: 2026-10-04T16:54:09Z
updated_at: 2026-10-04T16:54:09Z
parent: folio-assistant-8jt6
---

Downstream need from litlfred/qou (migration story S-REST-1, qou bean qou-pjfi; analysis docs/audits/2026-10-04-workplan-and-migration/REST_report.md in qou).

qou has 512 non-audit docs/ files: 117 math-heavy derivation notes, cheat sheets, scoping docs and recorded refutations, none named by a block. No existing kind fits:
- `docs` is renderable and would publish working notes as site pages;
- `todos` is a person's OUTSTANDING work (holds: state, recordsWork) and would count finished derivations as open items;
- `uploads` is an intake queue; `library` is external source material.

Proposed: a `notes` kind, holds: context (read by agents, never written by a process), renderable: false, perInstance: true, plus a promote-to-block process (a note becomes a folio block only by an owner-approved, verbatim move). Owner ruling in qou 2026-10-04: split docs/ so outstanding-work docs go to todos/beans and math notes wait for this kind.

Done when: the kind is in graph-kind-registry.ts with holds/renderable decided, check:kind-validators and audit:coverage cover it, and a downstream folio can declare docs/notes without the check:layout-norms or render pipeline treating it as docs.
