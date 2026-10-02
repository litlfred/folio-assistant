---
# folio-assistant-rtrg
title: BPMN targetNamespace drifted three ways across the workflow corpus
status: completed
type: task
priority: normal
created_at: 2026-09-20T14:56:52Z
updated_at: 2026-09-23T18:20:53Z
parent: folio-assistant-ahvw
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

- [x] Established, from the BPMN 2.0 record already in `external-schemas/`,
      what `targetNamespace` is required to do here — in particular whether
      anything in this corpus resolves a QName against it. `loadProcessModel`
      and the `calledElement` regex in `processHierarchy` are the two readers
      to check.
- [x] ONE shape chosen, with the reason written down rather than the majority
      silently winning.
- [x] Only then, rewritten — and `bun run render:bpmn:check`, the hierarchy
      tests in `scripts/tests/todos.test.ts`, and the committed workflow state
      under `beans/workflows/` all verified after, since an instance records
      the process it is in.
- [x] A check that keeps it, in `scripts/external-schemas.ts` beside the
      own-namespace drift check `0d99` added.

## Not urgent, and say why

Latent for the same reason `0d99` was: nothing in this repository resolves a
QName against `targetNamespace` today — `processHierarchy` matches
`calledElement="..."` as a raw string and `loadProcessModel` compares ids. It
bites when a diagram is opened by a standards-conformant tool, or imported by
another document, which is exactly when nobody is watching.

---

## Re-parented off `kupb` 2026-09-23 — owner's ruling

Owner, 2026-09-22, on *"`kupb` has 12 open children and can't close, blocking
GOAL 3. Several aren't IRIS-catalogue work"*: **re-parent the non-catalogue
ones.** `kupb`'s Done-when is *"every child is closed"*, so a child that is not
about the IRIS catalogue holds GOAL 3 open for a reason unrelated to GOAL 3.

**Moved to `ahvw`.** BEYOND THE NAMED SET — see the note in this bean. BPMN targetNamespace drift across the WORKFLOW corpus is process hygiene and is not catalogue work by any reading.

**Nothing about this bean's own work changed** — not its status, not its
Done-when, not a line of its body above this note. Only the question *"whose
goal does finishing this serve?"* is answered differently.

## Summary of Changes

**Measured 2026-09-23:** 47 diagrams on `https://litlfred.github.io/folio-assistant/workflows`, 4 on `https://folio-assistant.dev/workflows`, 15 on `http://folio-assistant.dev/bpmn/<name>` (66 in `processes/`, plus smart-base's one, already canonical).

**What reads it here:** nothing. `loadProcessModel`, `kg-audit`, `render-bpmn`, `gen-docs-pages` and `gen-processes-viz` all match `calledElement` as a bare id; no `calledElement` is prefixed; `beans/workflows/` records no namespace. What it matters to is a conformant tool: `calledElement` is a QName, and 12 call edges crossed namespaces with no `<bpmn:import>`. All 8 existing imports already named the shared IRI and their targets matched it.

**Chosen (owner, 2026-09-23, option A):** one shared namespace, the one 47 diagrams and every import already used. The 12 cross-namespace calls become same-namespace. Bootstrap keeps `…/bootstrap/workflows` (another instance).

**Changed:** `WORKFLOWS_NS` in `schemas/namespaces.ts` with the reasoning; 19 diagrams' `targetNamespace` rewritten (nothing else in them); `targetNamespacesInUse` + a drift check in `scripts/external-schemas.ts` (`external-schemas:check`, a gate), reading the DECLARED workflow graph; `scripts/tests/external-schemas-target-ns.test.ts`. Verified after: `render:bpmn:check`, `todos.test.ts` (14 pass), `beans/workflows/` unchanged.
