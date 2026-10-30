---
# folio-assistant-96y4
title: 'smart-immunizations has no BPMN: IMMZ.A-I exist only as SVG images, and its personas only as HTML'
status: completed
type: task
priority: normal
created_at: 2026-10-10T14:06:52Z
updated_at: 2026-10-23T13:45:00Z
parent: folio-assistant-uhkv
---

Measured 2026-10-10 on litlfred/smart-immunizations main (86898e6): its nine processes IMMZ.A–I exist only as SVG images (`input/images/immz-*-business-process.svg`) and a pagecontent table. `input/business-processes/` is empty and there are no `.bpmn` files. The personas are HTML tables only; `input/fsh/actors/` is empty.

So the recommendation-scenario extraction can reference a process only by its id and title, not by a BPMN task or lane.

## Done when

- [ ] IMMZ.A–I as BPMN, with lanes matching the personas, from the DAK document (WHO IRIS 9789240099456) and the SVGs
- [ ] personas as ActorDefinition FSH (smart-base `SGPersona`)

_2026-10-16T10:45:00Z_ — Parented to `uhkv` (SMART STACK) by subject: it had no parent, so it sat under no epic or goal and failed the parent check on main (https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP).

_2026-10-23T13:45:00Z_ — Status synced from `todo` to `completed` to match the folio-assistant copy of this bean, which is newer and records the work as done there. Only the status changed; the body here is kept as it was. Owner OK in thread "FHIR beans and WHO migration" (https://claude.ai/code/session_01Bye99WLJxQpyCxh2eMgW19).

## Summary of Changes

Merged as litlfred/smart-immunizations#65 (1f5b81d, merged by the owner 2026-10-21).

- `input/business-processes/IMMZ.A-I.bpmn`: the nine IMMZ processes A–I as BPMN, converted from the DAK's Visio SVG exports by smart-base's `smart-base/scripts/visio-svg-bpmn.ts` (litlfred/smart-base#116). Each process carries the objective its DAK page states as its documentation. Lanes are named `IMMZ.Lane.<Persona>` and documented with the personas they bind, or with the reason a system lane is not a persona. Expanded sub-processes, groups and link events are kept. Every file imports into bpmn-moddle and bpmn-js with no warnings.
- `input/business-processes/swimlanes.json`: the lane-to-persona map the converter reads.
- `input/fsh/actors/IMMZ.Persona.*.fsh`: the 8 personas as ActorDefinition FSH on smart-base's `SGPersona`.

The platform gates that had kept #65 red, also red on main, were fixed upstream (cat-harness-tools#498 and the stale cat-harness pin), and a re-run went green without #65 changing. The re-pin of smart-immunizations' own platform layers continues separately in smart-immunizations#66 (bean `cat-tools-x5e0`).

## Merged from the folio-assistant copy (bean dedupe, 2026-10-30)

These lines differed from the kept copy and could not be merged automatically (cat-harness-tools#459). They are kept here so nothing is lost.

Where: ## Done when

```text
- [x] IMMZ.A–I as BPMN, with lanes matching the personas, from the DAK document (WHO IRIS 9789240099456) and the SVGs
- [x] personas as ActorDefinition FSH (smart-base `SGPersona`)

_2026-10-16T10:45:00Z_ — Parented to `uhkv` (SMART STACK) by subject: it had no parent, so it sat under no epic or goal and failed the parent check on main (https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP).

_2026-10-20T17:56:44Z_ — Claimed by main — pushed to cat/cat-harness/beans so sibling sessions see it before this branch has a PR (bean 35nj).
```
