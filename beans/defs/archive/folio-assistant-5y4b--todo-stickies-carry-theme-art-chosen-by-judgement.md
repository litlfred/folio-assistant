---
# folio-assistant-5y4b
title: 'TODO STICKIES: carry theme art chosen by judgement from content, like every other sticky on the board'
status: completed
type: task
priority: normal
created_at: 2026-09-20T15:03:35Z
updated_at: 2026-09-20T19:10:29Z
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

---

## Done, 2026-09-20 — declared, defaulted, rendered, and looked at

### The theme is DATA, and the default makes no claim

`TodoNodeSchema` now carries `theme` — spread from `ThemedTodoFieldsSchema`
rather than restated, because two spellings of one field is the drift this
repository keeps paying for. That schema had declared the shape all along and
nothing merged it in, so the field was authorable in principle and dropped in
practice.

The DEFAULT is declared on the GRAPH — `defaultTheme` in `todos/todos.json`,
set to `grumpy-cat` — not in the generator. A literal in shared code would be
this repository's answer imposed on every downstream folio; a folio's own
theme is the folio's to choose. Absent is a determined state: no default means
flat cards, which is the behaviour before this bean and stays correct for a
folio that wants it.

**`grumpy-cat` is safe as a default precisely because it makes no claim.** The
bean's own warning — *a wrong theme is worse than no theme* — is the argument:
a card themed `operations` says "this is operations work" about a todo that may
be nothing of the sort, while the instance's own theme says only "this belongs
to this folio", which is true of every todo here.

**The todo's own value is kept UNRESOLVED through the parser.** The default is
applied in the generator, not in `readTodoFiles`, so "the author chose
grumpy-cat" and "nobody chose" stay distinguishable to a reviewer reading the
file — which is the whole of done-when #3.

### The judgement, and it is visible

| todo | theme | why |
|---|---|---|
| `human-todos-page-says-not-built-yet` | `library` | a DOCUMENTATION page disagreeing with the store behind it; `library` is the knowledge-graph / content / data-modelling theme |
| `subagent-roles-for-the-two-judgement-agents` | `analyst` | deciding which ROLES two agents take is a modelling decision about the role graph, not an implementation task |
| `what-kick-off-means-for-a-ci-watcher` | `operations` | CI dispatch mechanics — building the thing and running it |

Each reason is a comment above the field in the todo's own front matter, so
the assignment is reviewable where it is made rather than in a commit message.

### Art published per THEME, not per todo

`assets/todos/index.json` gains `themeArt` — one entry per theme actually used.
Fifty todos sharing a theme would otherwise carry fifty copies of three paths.

`resolveThemeBackdrop` decides, so a partial set cannot ship: it returns art or
NOTHING, never some layouts, because a phone handed the laptop crop shows the
art's quiet area in the wrong place and nothing reports it. A theme with no
backdrop is simply absent, and the client renders a flat THEMED card — correct
rather than degraded, and tested in that direction.

**A todo naming a theme nothing declares THROWS the build.** Not a flat card:
the author asked for something and got nothing, and on the page that failure is
invisible.

**The SCRIM is deliberately not in this file.** `themes.css` already emits
`--fa-sticky-scrim` per theme, so a copy here would be a second answer free to
disagree with the stylesheet that actually paints it. Done-when #2 — *"a
measured scrim, at AAA over pure black"* — is satisfied by inheriting that
value rather than by re-deriving it, and `themes.test.ts` computes the ratios.

### Rendering reuses the landing sticky's rules, entirely

`fa-sticky--backdrop` is the SAME class, so the art positioning, the clipping,
the `isolation` stacking context and the scrim all come from rules that already
exist and are already measured. The client sets no colour at all.

TWO sources, not three: `card` is the default because a todo sticky IS a board
card, with `mobile` below 30rem. The `laptop` crop is deliberately unused — it
is composed for a page-width surface.

### One duplicate removed rather than made

`siteRelative` in `gen-landing-data.ts` hardcoded `docs/` where `siteDirFor`
has a single answer. The todo board needed the same transform, so rather than
copy it, the implementation moved to `publishedAssetPath` in
`schemas/cat-harness.ts` and the old name is a one-line wrapper. A second
hardcoded copy is how an instance that moves its site directory serves one
correct path and one 404.

### Rendered, and looked at

Screenshotted against the real `docs-ui.js`, the real `themes.css` and the real
published index: **3 stickies, 3 backdrops**, art behind each with its scrim,
text legible. Not asserted from the DOM alone — done-when #2 is about what a
reader sees.

### Verified

`bun test` 4106 pass / 0 fail; 35 sticky e2e pass, including the four new ones
(art renders with the right structure, it survives a pin, an unthemed todo gets
NO backdrop, and a theme with no published art renders flat-but-themed).
`check:instance-render`, `check:skills`, `check:theme-art`, `themes:css:check`,
`kg:audit:check`, `check:undeclared-files`, `landing:data:check` all rc=0.

### Still open

**`tfo1`'s crop gap is untouched and was not widened.** `landing-architecture`
is still short its mobile crop, so no `architecture` theme is declared and no
todo could take one. The bean's warning — that this could widen an existing gap
by assigning themes faster than art exists — was avoided by assigning only
themes whose art `resolveThemeBackdrop` already accepts, and a test asserts
exactly that over the real corpus.
