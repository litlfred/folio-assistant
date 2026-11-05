---
# folio-assistant-exrp
$schema: bean/1.0.0
title: Work plan = an epic or milestone that names the process it instantiates; approved proposals seed it
status: in-progress
type: feature
tags:
    - work-plan
created_at: 2026-11-05T06:32:47Z
updated_at: 2026-11-05T06:32:47Z
parent: folio-assistant-rwmf
---

## Asked (owner, 2026-11-05)

"Isn't there the notion of an MVP or epics or milestones.... That have beans. These are work plans, no?" and "At the beginning of a large process (like creating a new collaborative document, or adding software features,) there should / may be a work plan. Not every process needs a work plan. Docs/proposals/ once approved become workplans."

Card answered: **"Epic is the plan"**: an epic or milestone work item IS the work plan; it names the process it instantiates; the proposal stays a separate document, linked from the epic.

## What is known (analysis 2026-11-04)

- 9 epics, 1 milestone; they group work items by `parent` but name no process.
- An instance links to ONE work item (`bean`, `carriedBeans`); nothing ties instances to a plan.
- `content-lifecycle.bpmn` has "Seed the work plan" after "Plan scope, team, artifacts"; its output is not a node.
- `docs/proposals/` status is free prose; nothing marks one approved.

## Plan

1. bean/1.0.0 (minor bump): optional `process` (the BPMN process an epic/milestone instantiates) and `proposal` (repo-relative path) on a plan-type work item; a work item that has them IS a work plan.
2. Instance: optional `plan: <work item id>`; `workflow_start(process, subject, bean?, plan?)`.
3. A process declares whether it starts from a plan (optional; small processes need none).
4. Proposal lifecycle: approval of a proposal seeds (or names) its epic.
5. Skills: todo-manager / work-plan-store / glossary term "Work plan".

## Not doing

A separate work-plan node; renaming identifiers.

_2026-11-05T13:00Z_ — Picked up after stalled session (weekly limit). Blocked: add_repo for litlfred/cat-harness-tools and litlfred/cat-harness (push) was denied by the session permission classifier, so cat-harness-tools#1484 and cat-harness#1038 cannot be read, finished, or merged from this session. Awaiting owner decision.

_2026-11-05T13:08Z_ — Fixed both reds (mcp-project: workflow-start Tool node lacked `plan`; reference-direction in todo-manager). Added proposal link, "Its work items", "Work plans" filter, proposal search; renamed kind/page to "Plans and work" with schema+glossary regenerated. Verified in Chromium. Pushed cat-harness-tools#1484 f64f71d, cat-harness#1038 fae1c31c; awaiting CI, then lockstep merge.

_2026-11-05T14:00Z_ — Owner asked for the glossary term; chose "narrower Work item". Added WorkPlanKind (schemas/sdlc/work-plan.ts) found by new node-kind name rule `process-tag`; ledger mints node-kind/work-plan "Work plan". Pushed #1484 355a7fb, #1038 a65e450d.

_2026-11-05T16:55Z_ — #1038 verdict green at a65e450d; #1484 reds are the lockstep set (needs #1038 on cat-harness main) plus docs.schema.json stale from my process-tag enum — regenerated, pushed #1038 9627b1b5. Plan: merge #1038 on green, then #1484 straight after (lockstep proven composed: tests 58/58, kind check 0, glossary current).

_2026-11-05T17:58Z_ — MERGED in lockstep: cat-harness#1038 (dddd1695) then cat-harness-tools#1484 (b1a455f7). Each PR's only new reds were the other's content (kind schema docs/beans, glossary ledger, MCP surface) plus main's own regen-writers ENOENT. Verified on both new mains composed: kind:json-schemas:check 0, glossary current, mcp/glossary/work-plan tests 63/63. Remaining from Plan: (3) a process declares whether it starts from a plan; (4) proposal approval seeds/names its epic. Work item stays in-progress for those.
