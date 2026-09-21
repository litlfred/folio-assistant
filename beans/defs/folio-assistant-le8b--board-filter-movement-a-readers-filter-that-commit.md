---
# folio-assistant-le8b
title: 'BOARD FILTER + MOVEMENT: a reader''s filter that commits nothing, and keyboard-first move/resize'
status: todo
type: task
priority: normal
created_at: 2026-09-20T21:46:57Z
updated_at: 2026-09-20T21:46:57Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — R13 + R14. Unit 8 of 10.

**Two filters, and they must not become one field.** CRDM Q3 gave the board a
DECLARED filter (`schemas/board.ts`: `pages`, `kinds`; OR within an axis, AND
across them; absent means the whole folio). The owner's later *"be able to filter
out by kind properties things on miror board"* is the READER's filter, applied at
view time and belonging to nobody's document.

Conflating them would make a reader's temporary view edit the board everyone else
opens.

**Movement** — *"can resize open content, move around. drag and drop moving.."* —
rides R4's floor. Drag is an ACCELERATOR. Every move must also be keyboard
operable, which is why the existing Pin control is a button: the declared
interaction profile here is low-dexterity, and a board whose only affordance is
drag excludes its own owner.

A move writes the DI layer (`place`/`unplace`), never the note.

## Done when

- [ ] a view-time filter by kind and by kind properties, affecting nothing committed
- [ ] the declared board filter and the reader's filter stay separate, asserted
- [ ] resize and move, both keyboard-operable, drag as an accelerator
- [ ] a move writes `board-positions.json` and touches no note
