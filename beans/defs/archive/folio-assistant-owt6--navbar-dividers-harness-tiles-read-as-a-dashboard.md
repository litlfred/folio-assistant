---
# folio-assistant-owt6
title: 'NAVBAR DIVIDERS: harness tiles read as a dashboard; they should read as the tabbed dividers of one giant folio'
status: completed
type: task
priority: high
created_at: 2026-09-21T10:50:42Z
updated_at: 2026-09-21T11:12:46Z
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

- [x] one horizontal tab per instantiated harness, themed, in reverse dependency order
- [x] the stack reads as sections of one folio — measured by looking at it, not by a class name
- [x] the counts/viewers are relocated rather than deleted, or a reason is recorded for dropping them
- [x] still full width, still clickable to the folio view, still collapsible (the four fixes already shipped)

## What landed, 2026-09-21

The owner settled the one open question — where the counts and the viewer
links go — by choosing **inside the section it opens**. So this is two changes
that only make sense together:

**The sidebar became purely navigational.** `.fa-harness-tab` is a horizontal
tab: a themed left edge, a label, and a position. No counts, no glyphs, no
viewer sub-list. The STAGGER is what makes it a stack rather than four coloured
bars — each tab is inset a little further from the right than the one above,
capped at five steps, and `--fa-tab-i` comes from the GENERATED order so the
offsetting presents a fact rather than inventing one. The floor carries a
dashed edge, which is `bootstrap`'s own declared render exemption being
styled rather than asserted.

**`harness_details.html` is where the data went.** One anchored section per
instantiated harness — `#harness-<name>` — carrying the description, the stats
as a real `<dl>`, the viewer links, and the FINDINGS, which the tiles had been
computing and nothing had been showing. It is included from `index.md` because
both instantiated harnesses here resolve their folio view to the site root.

**The limit, and it is the falsifier named in the opening brief.** An instance
that generates its own docs — `who-iris` — publishes a page this build does not
write, so the section cannot follow its tab there. That is reported by
`harness-tiles.ts` as a finding rather than papered over with an invented page.

`bun run gates --all` — 86/86, 209 e2e.
