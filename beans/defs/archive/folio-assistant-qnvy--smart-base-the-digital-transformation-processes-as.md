---
# folio-assistant-qnvy
title: 'smart-base: the digital-transformation processes as executable BPMN'
status: completed
type: task
priority: normal
created_at: 2026-09-22T08:35:28Z
updated_at: 2026-09-22T09:54:44Z
parent: folio-assistant-2yyh
---

Issue #877. The owner asked for *"methodlolgies subgraphs for project management, digital trasnform processes"* — the prose half is the methodology node `diig.md`, this is the executable half.

## Summary of Changes

`smart-base/methodologies/processes/diig-investment-path.bpmn` — DIIG's own nine chapters as a process. Chapter 1 is the start event's documentation rather than an activity, because nothing is performed there: it is scope, key terms and when the Guide applies.

The two exclusive gateways are **the Guide's own progress checks** at 4.5 and 8.5, not gates invented here. A "no" at 8.5 returns to Chapter 8 rather than failing, because adaptive management IS the Guide's answer — 8.4 is "use data to optimize interventions", so iterating there is the method working rather than stalling.

`enforcement="advisory"`. DIIG is somebody else's method: the engine can report where a programme has got to, but what counts as an adequate answer to "have we identified the bottlenecks" belongs to the programme and its stakeholders. The four unrelaxable steps of the base editorial gate are untouched.

**No DMN, deliberately.** DIIG Table 3.3.1 sums three 1–3 scores into a ranking, and `methodology-adoption` refuses the arithmetic. A computed gateway would assert a repeatability the question does not have, so `A_PrioritizeBottlenecks` records each criterion's answer and its reason and orders by argument. There is no computed score anywhere in the process.

All 9 activities carry `<folio:skill ref>` and `<folio:bean op>`; `check:workflow-refs` reports 9/9, 100%.

## The lane I got wrong, and what caught it

The first draft had a third lane, `Stakeholders`, holding Chapter 9 — reasoning that "the audience is the point". `kg:audit` reported `role-carries-activity-skill`: the stakeholder role carries no skills at all, which is the shape of a role that acts on nothing.

It was right and the model was wrong. **A lane is who PERFORMS the task, not who receives its output.** The value proposition is made BY the implementing team TO whoever pays, so the activity belongs in the programme manager's lane and the stakeholder is its audience. The lane is gone and the programme-manager lane documents why, where the next author will look.

One declaration changed as a result: `programme-manager` now carries `methodology-adoption` in `scenarios/roles.json`. It already sat on `business-analyst`; a programme manager applying DIIG across chapters 2, 5, 7 and 8 is using the same skill, and the audit asked for exactly that.

Indexed in `content/docs/publication-workflow/every-workflow-in-the-repo.md` — the SOURCE page, not the generated one. The first attempt edited `docs/publication-workflow.md`, which is generated output; the checker reads `content/docs/publication-workflow/`, so the edit did nothing and the finding stood.

`render:bpmn` and `render:bpmn:check` pass. The SVG was read rather than assumed: two lanes, nine activities, both loops routed, every label inside its lane's bounds.

## Done when
- [x] each process renders through `bun run render:bpmn`
- [x] `render:bpmn:check` is not stale
- [x] every activity carries `<folio:skill ref>` and `<folio:bean>`
- [x] the diagram is indexed where a reader can find it

## Deliberately out of scope

Bean `u4hs` carries the open design question for a methodology subprocess generally — **what triggers it** — with the proposal that it should be opening-brief's own trigger, irreversibility and surprise rather than size. This process does not settle that, and no call activity was added to invoke it from `crdm-requirements-workflow`, `content-change-review` or the other callers `u4hs` lists. That is `u4hs`'s to decide.
