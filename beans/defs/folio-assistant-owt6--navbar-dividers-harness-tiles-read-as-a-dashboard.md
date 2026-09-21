---
# folio-assistant-owt6
title: 'NAVBAR DIVIDERS: harness tiles read as a dashboard; they should read as the tabbed dividers of one giant folio'
status: todo
type: task
priority: high
created_at: 2026-09-21T10:50:42Z
updated_at: 2026-09-21T10:50:42Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — owner feedback, 2026-09-21, on the deployed staging preview, with a screenshot of the sidebar and a reference photo of a ring-bound notebook with coloured index dividers.

> those are too much like a dashboard, i want them to be more like diverders. as
> if you are opening a giant tabbed folio, but the tabs are oriented hoizontally.

## What is wrong, as a design statement rather than a list of tweaks

The tiles currently answer *"what is the state of this harness"* — an icon, three
counts with glyphs, a row of viewer links. That is a **dashboard card**: a thing
you READ.

A divider is a thing you **reach for**. In the reference photo the dividers carry
almost no information: a colour, a position in the stack, and at most a short
label. Their whole job is to say *there is a section here and this is where it
starts*. The stack itself — several of them, offset, in a fixed order — is what
makes it legible.

So the ask is not "smaller tiles". It is a different object:

- a **tab**, horizontally oriented, one per instantiated harness;
- carrying its theme's colour as the primary signal, its name as the label;
- the stack ORDERED as it already is (bootstrap at the bottom, folio-assistant on
  top) — which is what makes it read as one folio opened at a section rather than
  as four unrelated cards;
- the counts and viewer links are NOT the tab. Where they go is the open
  question: inside the section the tab opens, on hover/focus, or nowhere.

## Done when

- [ ] one horizontal tab per instantiated harness, themed, in reverse dependency order
- [ ] the stack reads as sections of one folio — measured by looking at it, not by a class name
- [ ] the counts/viewers are relocated rather than deleted, or a reason is recorded for dropping them
- [ ] still full width, still clickable to the folio view, still collapsible (the four fixes already shipped)
