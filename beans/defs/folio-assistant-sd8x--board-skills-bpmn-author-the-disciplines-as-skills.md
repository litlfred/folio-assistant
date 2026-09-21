---
# folio-assistant-sd8x
title: 'BOARD SKILLS + BPMN: author the disciplines as skills and the processes as executable diagrams'
status: todo
type: task
priority: high
created_at: 2026-09-20T21:47:28Z
updated_at: 2026-09-20T21:47:28Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — the owner's *"do all the skills and bpmn workflows"*.

Nine implementation units above carry the code. This one carries the part that is
easy to skip and is the reason the others will still make sense in a month: **every
process here is BPMN, and the diagrams are executable.** A behaviour that exists
only in `docs-ui.js` is a behaviour nobody can review, run, or find.

What is owed:

- **Skills** for the board's own disciplines — the DI split (relationship first,
  visualisation later), the window/z-order model, the tile contract, the
  per-kind rendering contract, the fsh-guts confirm. Each one authored where
  skills live, not as a section in `AGENTS.md`: a rule stated only in the pointer
  is a rule with no generated reference, no published page and no test.
- **BPMN** for the processes that have actors and decisions: opening and closing
  content, relocating to fsh-guts (a confirm is a gateway), placing a note. Each
  activity carries `<folio:skill ref>` and `<folio:bean>`, both required, and the
  diagrams render through `bun run render:bpmn`.

`bpmn-processes` and `bean-coordination` govern this; this bean exists so the work
is claimed rather than assumed.

## Done when

- [ ] one skill per discipline above, in the `kg` graph, reachable by `skill_fetch`
- [ ] BPMN for open/close, relocate-to-fsh-guts and place-a-note, each executable
- [ ] `render:bpmn:check` green
- [ ] `AGENTS.md` gains POINTERS only — the discipline lives in the skill
