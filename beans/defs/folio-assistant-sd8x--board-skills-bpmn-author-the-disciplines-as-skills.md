---
# folio-assistant-sd8x
title: 'BOARD SKILLS + BPMN: author the disciplines as skills and the processes as executable diagrams'
status: completed
type: task
priority: high
created_at: 2026-09-20T21:47:28Z
updated_at: 2026-09-21T10:34:27Z
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

- [x] one skill per discipline above, in the `kg` graph, reachable by `skill_fetch`
- [x] BPMN for open/close, relocate-to-fsh-guts and place-a-note, each executable
- [x] `render:bpmn:check` green
- [x] `AGENTS.md` gains POINTERS only — the discipline lives in the skill

## What landed, 2026-09-21

Three skills — `board-diagram-interchange`, `board-windows`, `harness-tiles` —
registered in `folio-core`'s package manifest, so `skill_list` and `skill_fetch`
serve them.

Three diagrams — `board-open-close.bpmn` (advisory), `board-relocate.bpmn`
(**strict**: it edits the folio), `board-place-note.bpmn` (advisory) — every
activity carrying `<folio:skill ref>`, all three indexed on the
publication-workflow page and rendering through `render:bpmn`.

Two things the gates forced, and both are better than what was written first:

- **A lane must bind a declared role.** The first draft drew the reader
  *performing* the render tasks. `workflow-roles.test.ts` caught it, and the
  fix is the honest model: the reader's lane holds the gateway and nothing
  else — every task is the renderer's, and the renderer decides nothing. That
  needed a new role, `board-renderer`, and a new mechanical actor of the same
  name. It is deliberately NOT `ci-pipeline`: that publishes and never reacts
  to a reader, and folding them together would put a person's click behind a
  build.
- **An exported label may not name the trashcan directory.** Owner,
  2026-09-19: *"NEVER include fsh-guts, references to fsh-guts stripped out of
  KG before sending to publication."* Task names are published nodes; XML
  comments are not. The labels say "the trashcan" and the comment says where,
  with `fsh-guts-unpublished.test.ts` as the thing that catches a rename back.

`bun run gates` — 83/83.
