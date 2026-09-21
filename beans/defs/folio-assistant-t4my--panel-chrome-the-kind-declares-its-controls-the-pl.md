---
# folio-assistant-t4my
title: 'PANEL CHROME: the kind declares its controls, the platform fixes the frame, badges ride the avatar'
status: completed
type: task
priority: normal
created_at: 2026-09-20T21:46:57Z
updated_at: 2026-09-21T12:44:47Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — R10 + R7. Unit 6 of 10.

The owner: *"each content type controls its own avatar, visualtion/rendering. but
assume they can open a full screen panel w/ fixed controls like [x] or [linksrc] or
[edit] or what not depedning on conent."*

**CRDM Q7, answered: the kind declares its controls; the platform fixes the chrome.**
`[x]` is always present and always in the same place — a reader learns the frame
once — and each content type declares which of the known controls it offers. The
platform VALIDATES that a declared control exists, so a typo is a finding rather
than a missing button.

This extends Q4 rather than contradicting it: Kind already owned the avatar and the
zoom threshold; it now owns its whole rendering, under a fixed frame.

**And R7 falls out of it**: a node rendered as its avatar carries the same badge,
from the same query as R6. Nothing renders content as an avatar today, so there is
nowhere to put one until unit 4 lands.

**Carry the capability lesson from `pb04`**: an `[edit]` that the pipeline cannot
perform is worse than no button — on a private repository it 404s for exactly the
reader who cannot edit, which reads as "this page is broken". A declared control
that the environment cannot serve is HIDDEN, and the reason is reported.

## Done when

- [x] a declared control set per kind, validated against a known list
- [x] `[x]` fixed: same place, same behaviour, every kind
- [x] a control the pipeline cannot perform is hidden, with the reason reported rather than swallowed
- [x] the same badge on the avatar and on the open window, from one query

## Summary of Changes

`schemas/panel-chrome.ts` carries the line CRDM Q7 drew. `PANEL_CONTROLS` is the
known list, `FIXED_CONTROLS` is what the platform supplies on every panel
(`close`, today, and a list rather than a literal because the rule is *the
platform fixes the chrome*, not *the platform fixes close*), and `KIND_CONTROLS`
is what each kind adds. A kind absent from that table is **complete rather than
invalid** — the frame alone is a usable panel, and requiring an empty list would
make silence look like an oversight.

**`validateControls` is what makes declaring the set worth anything.** Without a
known list, `edti` is a control that never appears and nothing says so — which is
indistinguishable from a kind that chose not to offer it. Two things can be wrong
and they are reported as two: naming something that does not exist, and
re-declaring something the platform fixes. Neither throws: the panel renders what
it can and the finding says what it could not, because a renderer that threw would
lose a board over one button.

**Three states, and the third is the one that gets lost.** Not declared / declared
and servable / declared and unservable. `servableControls` returns `hidden` WITH
reasons rather than dropping it, because *"this kind does not offer edit"* and
*"this deployment cannot serve edit"* are different facts and only one is
somebody's to fix. Gated per NODE, not per deployment — `viewHref` and `editHref`
are absent from the published record for a node whose source nothing can reach, so
one board serves `edit` on one card and not on another.

**R7 fell out of `51wf` landing.** `nodeBadge` is called once per card and both the
avatar and the open window render its answer, so the two surfaces cannot disagree
for the same reason the badge and its panel cannot (`1rta`). R5's threshold applies
on both alike: the chip takes `showCount`, the accessible name takes the exact
count.

## Two bugs the tests found

**An attribute collision that a selector would have hidden.** The avatar first
carried `data-fa-todo`, which the linear floor already uses for a listing entry.
`linear-floor.e2e.ts` failed on "the listing is not duplicated" — and it was not
duplicated; it had been joined by a control from another surface. Renamed to
`data-fa-opens`, which also says what the control does.

**A test helper addressing by position.** `openCard` used `.nth(i)` over the
fixture's order, and the board stacks by BPMN subprocess depth — so it opened the
wrong card every time. Addressed by id now, which is why the avatar needed an id
attribute at all.

## The limit, same as its siblings

`docs-ui.js` cannot import `panel-chrome.ts`, so the model is mirrored there and
the two can drift. `test/panel-chrome.e2e.ts` runs one fixture through both and
asserts the browser's shown AND hidden sets against the model's, case for case.

`bun run gates --all` — 88/88, 254 e2e.
