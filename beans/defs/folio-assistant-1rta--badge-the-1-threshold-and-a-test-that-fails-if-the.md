---
# folio-assistant-1rta
title: 'BADGE: the >1 threshold, and a test that fails if the count stops being the panel''s cardinality'
status: completed
type: task
priority: high
created_at: 2026-09-20T21:46:31Z
updated_at: 2026-09-21T12:21:00Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — R5 + R6. Unit 3 of 10.

Two lines of behaviour and one test, and the test is the valuable half.

**R5**: the badge renders whenever `mine.length > 0`, so a single note shows a "1".
The owner's ask is *"badge of # if > 1"*. `badgeAt()` in `note-anchor.ts` already
returns `{count, showCount}` — `showCount` is what the chip renders, `count` is what
`aria-label` says, and they differ ON PURPOSE: the visual threshold is a density
decision and a screen-reader user should not be told less.

**R6**: the badge's count SHALL be the cardinality of the query the panel renders.
This is ALREADY TRUE in `mountPageStickies` (both come off one `mine` array) and
protected by NOTHING. So it is a regression requirement: it needs a test, not an
implementation. *A badge that can disagree with its own panel is the defect to
design out* — designed out already, currently unguarded.

`notesAt()` returns both relations from one pass precisely so they cannot be built
apart; `docs-ui.js` should call it rather than filtering twice.

## Done when

- [x] one note -> icon, no count; two -> icon with "2"; `aria-label` exact in both
- [x] a test that FAILS if the count is computed from anything but the rendered set
- [x] secondaries (`alsoAbout`) do not inflate the badge — asserted

## Summary of Changes

**R5 was not implemented at all** — `mountPageStickies` rendered
`String(mine.length)` unconditionally, so a single note showed a "1". It now
renders the chip only above one, and the `aria-label` carries the exact number
in BOTH cases: the threshold is a density decision about the visual, and a
screen-reader user must not be told less than a sighted one. The label also
stopped saying "todo(s)" — a reader HEARS it, and "(s)" is a written
convention.

**R6 went one step past what it asked.** It asked for a test; the count is now
read off the panel's own `children.length` after the panel is built, so there
is no second number that could go out of step. Stated as a requirement it was a
property somebody had to keep true; built this way it is one the code cannot
break. `placed` follows the same rule for the same reason.

**The client grew the `alsoAbout` relation**, mirroring `notesAt()` including
the overlap rule: a note both attached here and also-about here counts once, as
attached, so a self-referential declaration cannot inflate a badge past the
length of the list it labels. The secondary count is published on the host as
`data-fa-also-about` — not for the reader, but so a test can prove the
secondaries were PRESENT and still did not count.

## The test is the valuable half, and here is why it is not vacuous

*"A test that FAILS if the count is computed from anything but the rendered
set"* is a different test from *"the badge says 2 and the panel has 2 items"* —
the second passes for two independent computations that happen to agree, and
agreeing is what they do until the day they do not.

So `test/note-badge.e2e.ts` builds a page where a DECOUPLED implementation
gives different numbers, and names them: a union over "notes mentioning this
label" would say **3, 2, 4** where the panels render **2, 1, 3**. Every block
carries a secondary, because a page with none would pass for an implementation
that counted them.

It also joins the two implementations: the same fixture is run through
`badgeAt` and `notesAt` and checked against what the browser rendered, which is
the only guard there can be against `docs-ui.js` drifting from
`schemas/note-anchor.ts` — the client cannot import it.

One existing assertion in `sticky-todos.e2e.ts` was UPDATED rather than added
to: it asserted a rendered "1" on a single-note block, which is exactly the
behaviour R5 removes.

`bun run gates --all` — 88/88, 243 e2e.
