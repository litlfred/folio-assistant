---
# folio-assistant-1rta
title: 'BADGE: the >1 threshold, and a test that fails if the count stops being the panel''s cardinality'
status: todo
type: task
priority: high
created_at: 2026-09-20T21:46:31Z
updated_at: 2026-09-20T21:46:31Z
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

- [ ] one note -> icon, no count; two -> icon with "2"; `aria-label` exact in both
- [ ] a test that FAILS if the count is computed from anything but the rendered set
- [ ] secondaries (`alsoAbout`) do not inflate the badge — asserted
