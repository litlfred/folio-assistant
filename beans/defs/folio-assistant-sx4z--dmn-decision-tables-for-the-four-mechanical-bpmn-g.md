---
# folio-assistant-sx4z
title: DMN decision tables for the four mechanical BPMN gateways
status: completed
type: task
priority: normal
created_at: 2026-08-26T15:29:15Z
updated_at: 2026-08-26T15:43:38Z
---

Follow-up to fq0b. Of the 10 decision points across the six diagrams, four have purely mechanical inputs and should be computed rather than judged: 'Build green, no sorries?' (lean_status), 'Draft QA green?' (publication QA), 'QC clean?' (IG Publisher QC), 'FHIR valid?' (validator). The repo already ships a dmn-authoring skill and schema. The other six ('Judgement call?', 'Accept, revise or discard?', 'Approved?', 'Clinically accurate?') stay human on purpose. Highest determinism per unit of work, and independent of the gating decision. See docs/proposals/workflow-orchestration.md §6.

## Summary of Changes

A gateway carrying `<folio:decision ref="file.dmn#Decision_Id"/>` now has its
outcome **computed** rather than chosen. The caller passes facts, the table
returns the branch, and `workflow_complete` **refuses a hand-supplied outcome**
on such a gateway — being able to assert the answer would defeat the mechanism.
The rule that fired goes into the instance history, so the trail says which
table decided and why.

`src/workflow/decision-table.ts` parses and evaluates DMN via `dmn-moddle` (the
bpmn.io parser, same family as the `bpmn-moddle` already in use). Hit policies
UNIQUE and FIRST; a deliberate FEEL subset (`-`, literals, comparisons,
comma-lists) that **throws on anything else naming the expression** rather than
treating it as a non-match — an unimplemented test evaluating to `false` looks
exactly like a rule that legitimately did not apply.

Tables shipped, under `docs/workflows/decisions/`:

- `lean-build-gate.dmn` — `Build green, no sorries?` from `buildOk`
  (`lean_build`) and `deferredSorries` (`proof_status`).
- `draft-qa-gate.dmn` — `Draft QA green?` from `failCritical` / `failMajor`
  (`qa_sweep` totals).

## Two corrections to my own proposal, both found by building it

**It named the wrong tool.** §6 said the Lean gate reads `lean_status`.
`lean_status` checks whether the *toolchain* is installed; the sorry counts come
from `proof_status` (`proof-axis-dashboard --json`). Had I not gone looking at
the real output shape I would have written a table against a name no tool emits.

**It claimed four tables; only two are possible.** `QC clean?` and `FHIR valid?`
are just as mechanical, but this repo ships no WHO/FHIR adapter, so their inputs
would have been invented. A table keyed to facts nothing produces is worse than
no table — it looks authoritative. They land when the adapter does.

## Three things the work turned up

- **The Lean gate is not "no sorries".** `proof-axis-dashboard` separates a
  sorry standing in for an open conjecture from a proof nobody closed. Counting
  both would block on the conjectures the paper is about, so the table reads
  `deferredSorries` only.
- **Authoring the table fixed the diagram.** The branch was labelled
  `sorries remain`, but a red build routes there too and is not a sorry.
  Renamed to `not yet`. The label was wrong before the table existed; making the
  decision explicit is what exposed it.
- **A validator that had a bug in its first cut.** Every outcome a table can
  return must name a real branch of its gateway, checked at process *load*. My
  first version evaluated each rule with blank facts to read its output, which
  cannot work — a rule with a real test never matches blank facts. Replaced with
  `possibleOutcomes`, which reads the rules directly. Typecheck passed on the
  broken version; only thinking through the semantics caught it.

Also fixed: an XML comment cannot contain a double hyphen, so `--json` inside
the `.dmn` header comments made both files unparseable on first write.

## Still open

`QC clean?` and `FHIR valid?`, blocked on a WHO/FHIR adapter rather than on any
decision. Not worth its own bean until that adapter is on someone's plan.
