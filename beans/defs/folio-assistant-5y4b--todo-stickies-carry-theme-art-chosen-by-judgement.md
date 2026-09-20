---
# folio-assistant-5y4b
title: 'TODO STICKIES: carry theme art chosen by judgement from content, like every other sticky on the board'
status: todo
type: task
created_at: 2026-09-20T15:03:35Z
updated_at: 2026-09-20T15:03:35Z
parent: folio-assistant-yj32
---

Owner, 2026-09-20, verbatim:

> todos need grump cat themeing based on content too. used jugement

## What it asks for

Todo stickies carry **theme art**, the way the landing stickies do — and the
theme is chosen **by judgement from the todo's CONTENT**, not assigned by a
fixed rule.

## Measured: they are the only stickies on the board with no art

`mountTodoBoard` (`docs/assets/js/docs-ui.js:2020`) mounts the todos INSIDE
the landing board, deliberately — the owner's earlier instruction, *"i want
todo board inside of the landing folio/board"*. So on that one page there are
now two kinds of sticky side by side:

| sticky | art | theme comes from |
|---|---|---|
| landing / harness card | `fa-sticky--backdrop` with a per-theme `<picture>`, per-layout crops, measured `textRegion` and scrim | the instance's declared `theme` |
| **todo** | **none** — a flat card with a status-coloured left border | nothing |

Put on the same board they read as two different systems, which is the whole
reason this now looks wrong rather than merely plain.

## The judgement is the work, and it is the part to be careful about

"Based on content" means a todo about ingestion might take `library`, one
about deployment `operations`, one about drafting `architecture`. That is a
**classification**, and three things follow:

1. **It must be declared, not inferred at render time.** A theme picked by
   keyword-matching the title in JavaScript is a rule nobody can see, review or
   override, and it changes silently when somebody rewords a todo. The theme
   belongs on the todo as data — a field, defaulted, overridable.
2. **Every theme needs a crop for the sticky aspect.** Theme art is declared
   per layout (`mobile`, `laptop`, `card`) with a measured `textRegion`. A
   theme with no `card` crop cannot back a todo sticky, and `landing-architecture`
   is already short its mobile crop — so this bean can widen an existing gap if
   it assigns themes faster than art exists.
3. **Contrast is not optional and is already solved.** Scrims are measured over
   PURE BLACK, 9.25-9.36:1, because arbitrary art sits behind the text. A todo
   sticky gaining art inherits that requirement exactly; it must not reach the
   board by skipping the measurement the landing stickies pay.

There is also a real risk worth stating: **a wrong theme is worse than no
theme.** A plain card says nothing; a card themed `operations` says "this is
operations work". Judgement here is a claim about the todo, so a default of
the instance's own theme, overridden deliberately, is safer than a clever
guess applied to everything.

## Depends on

- `1hvo` — the theming split. The rule "which theme does this content take"
  is a *declaration*-stage fact, so it should land in that structure rather
  than beside the board.
- `603s` — the proposed `avatarRegion`, same shape of problem: art needs
  declared per-image geometry, and a sticky-sized crop is a third region
  after `textRegion` and `avatarRegion`.
- `tfo1` — the landing-architecture crop gap named above.

## Done when

- [ ] A todo carries its theme as declared data, with a default
- [ ] Todo stickies render with backdrop art and a measured scrim, at AAA over
      pure black like every other sticky
- [ ] Themes assigned by judgement from content, reviewable because the
      assignment is visible rather than computed
