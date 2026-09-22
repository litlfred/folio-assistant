---
# folio-assistant-rtrg
title: BPMN targetNamespace drifted three ways across the workflow corpus
status: todo
type: task
priority: normal
created_at: 2026-09-20T14:56:52Z
updated_at: 2026-09-20T14:57:07Z
parent: folio-assistant-kupb
---


Split out of `0d99` when that one was fixed, and **measured, not assumed** —
`grep -rho 'targetNamespace="[^"]*"'` over `processes/`, 2026-09-20:

| targetNamespace | diagrams |
|---|---|
| `https://litlfred.github.io/folio-assistant/workflows` | 30 |
| `https://folio-assistant.dev/workflows` | 4 |
| `http://folio-assistant.dev/bpmn/<diagram-name>` | 8 |

Three shapes, two of them on a domain this project does not own, and the
third gives each diagram its **own** namespace rather than sharing one.

## Why this is NOT the same defect as `0d99`

`0d99` was the `xmlns:folio` extension vocabulary — one vocabulary, so two
spellings is unambiguously wrong and the fix was mechanical.

`targetNamespace` is the diagram's **identity**. Whether 42 diagrams should
share one namespace or carry one each is a modelling question with a real
answer either way, and BPMN says `calledElement` is a QName resolved against
the *importing* document's namespace bindings. So a rewrite can change which
process a call edge resolves to — the opposite of cosmetic.

## Done when

- [ ] Established, from the BPMN 2.0 record already in `external-schemas/`,
      what `targetNamespace` is required to do here — in particular whether
      anything in this corpus resolves a QName against it. `loadProcessModel`
      and the `calledElement` regex in `processHierarchy` are the two readers
      to check.
- [ ] ONE shape chosen, with the reason written down rather than the majority
      silently winning.
- [ ] Only then, rewritten — and `bun run render:bpmn:check`, the hierarchy
      tests in `scripts/tests/todos.test.ts`, and the committed workflow state
      under `beans/workflows/` all verified after, since an instance records
      the process it is in.
- [ ] A check that keeps it, in `scripts/external-schemas.ts` beside the
      own-namespace drift check `0d99` added.

## Not urgent, and say why

Latent for the same reason `0d99` was: nothing in this repository resolves a
QName against `targetNamespace` today — `processHierarchy` matches
`calledElement="..."` as a raw string and `loadProcessModel` compares ids. It
bites when a diagram is opened by a standards-conformant tool, or imported by
another document, which is exactly when nobody is watching.
