---
# folio-assistant-5y4b
title: 'TODO STICKIES: carry theme art chosen by judgement from content, like every other sticky on the board'
status: todo
type: task
priority: normal
created_at: 2026-09-20T15:03:35Z
updated_at: 2026-09-20T15:09:14Z
parent: folio-assistant-o3xy
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

- [x] A todo carries its theme as declared data, with a default —
      `TodoItemSchema.theme` / `TodoItem.theme`, shipped 2026-09-20. Optional
      (absent = the instance's own theme), an OPEN string rather than an enum
      of theme ids, and empty string refused because absent and blank are
      different claims. Four tests, including that an unknown theme parses:
      it is a rendering finding, not a parse error.

      **Why an open string.** Closing the enum means building it at module
      load and importing the theme table into the CONTENT model, which would
      give every consumer of a todo a dependency on the palette. Same
      precedent as `GraphNodeDirectorySchema.graphs`, checked against a
      registry later rather than at parse.

## Still open: the RENDER half

The declaration exists; nothing applies it yet. A todo sticky still renders as
a flat card, because `mountTodoBoard` (`docs-ui.js`) has no art to reach for —
the landing stickies get theirs from generated landing data
(`gen-landing-data.ts`), and there is no equivalent for todos. So the render
half is: get per-theme art paths to the board, and apply
`fa-sticky--backdrop` plus the measured scrim.

Two constraints from above still bind it, and neither is solved by the field:
a theme with no `card` crop cannot back a sticky, and a todo sticky gaining
art inherits the AAA-over-pure-black measurement every other sticky pays.
- [ ] Todo stickies render with backdrop art and a measured scrim, at AAA over
      pure black like every other sticky
- [ ] Themes assigned by judgement from content, reviewable because the
      assignment is visible rather than computed
