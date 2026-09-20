---
# folio-assistant-6lb8
title: 'FOLIO BOARD: a resizable Miro-style board, notes that move and attach, and semantic zoom to avatars'
status: todo
type: feature
priority: normal
created_at: 2026-09-20T10:37:35Z
updated_at: 2026-09-20T10:38:04Z
parent: folio-assistant-yj32
---

## The ask, owner 2026-09-20 (verbatim, in the order it arrived)

> landing folio should really be resizable, switchiing over to content avatars
> if content no longer lgeible. liek miro board. content vieweing panes are
> resizzble. but ALWAYS collapsable to linearly rendablee/just the docs. the
> todos/miro board is a static content overlays, so new content type that sits
> under todos/ but scema and behavhoir of folio=miro board is in cat-harness.
> carefull separte tools and schema.

> notes can mvoe aroundin board. be attached to nothing or show attachment to
> content nodes based on relationships

> stickies are icon on content (or its avatars) with badge of # if > 1. can
> click to open sticky/sticky panel

> sticky panel is to see all the stickes attached to the content node....

Kept verbatim because the layering instruction is precise and a paraphrase
would lose it. Three of these sentences are constraints, not preferences.

## What is being asked for

1. **A board, not a page.** The landing folio is pannable/zoomable like Miro.
2. **Semantic zoom.** As it shrinks, a card stops rendering its words and
   becomes its **avatar** — because text below a certain size is not small
   text, it is noise.
3. **Resizable content panes**, and the whole thing **ALWAYS collapsible to a
   linear, just-the-docs rendering.** That is an accessibility floor, not a
   fallback: a board that cannot be read linearly cannot be read by a screen
   reader, or printed, or translated.
4. **Notes move.** A note has a position on the board, and it may be attached
   to **nothing**, or show its attachment to content nodes **by relationship**.
5. **Stickies collapse onto their subject.** A note attached to content renders
   as an **icon on that content (or on its avatar)**, badged with a count when
   more than one, and clicking opens the sticky or a sticky panel.
6. **The sticky panel is per-content-node**: it shows **every** sticky attached
   to that node. So the badge count and the panel are two readings of one query
   — *what is attached here* — and the badge is that query's cardinality rather
   than a separate number somebody maintains. A badge that could disagree with
   its own panel is the defect to design out.

## The layering, which the owner stated and which is the hard part

| where | what |
|---|---|
| **`todos/`** | a NEW CONTENT TYPE — the board's own content: the overlay, the positions, the attachments |
| **`cat-harness/`** | the SCHEMA and the BEHAVIOUR of `folio = miro board` |
| separately | **tools** and **schema** — *"carefull separte tools and schema"* |

So the board is not a feature of the landing page. It is a content type whose
instances live under `todos/`, described by a schema that cat-harness owns, and
operated by tools that are kept distinct from that schema.

## Why this is a CRDM feature request rather than a change

It is a platform capability: a new content type, a new schema, a rendering mode,
and an interaction model. `crdm-detect` says that goes through the requirements
workflow rather than being implemented directly, and this bean exists so the
requirements have somewhere to land.

## What already exists and should NOT be rebuilt

Measured, so the requirements start from what is there:

- **A sticky note node**: `CarriedNote`, and `LandingSticky` extending it with
  a narrowed page anchor, a theme, links, `contributedBy` and `initiation`.
- **An anchor with three states**: `note-anchor.ts` — page-global, a block, or
  none. *"Attached to nothing"* is already a declared state, not a new one.
- **A live, interactive sticky board**: `docs-ui.js` `mountTodoBoard` — stickies
  with toggle, Edit, Pin and discard, a floating layer, and dock/undock. It is
  now mounted inside the landing board. **Pinning already moves a sticky out of
  the grid**, which is the nearest thing to a free position that exists.
- **Per-page attachment**: `mountPageStickies` renders a todo beside the block
  its `targetLabel` names, and reports a dangling one rather than dropping it.
- **Avatars**: `schemas/avatars.ts`, one per declared kind — the thing a card
  should become when it is too small to read.
- **Themes with three layouts and a measured scrim**, and a fixed-shape card
  whose aspect is its crop's.

## Open questions the requirements must answer

1. **What is the board's persistence?** A position is state. `todos/` is
   committed, so two sessions moving the same note is a merge conflict in a
   generated file — the shape that just cost this branch a conflict in
   `translations/fr/status.json`.
2. **What relationship attaches a note to content?** `uses[]` is EDITORIAL and
   must not be borrowed; `KgRef` on the note is the candidate.
3. **At what size does a card become its avatar**, and is that measured or
   chosen? A threshold with no basis is the thing `test/health` refuses.
4. **What is the linear rendering?** Not "the board with CSS off" — an order
   has to be decided, and the declared `order` is the obvious candidate.

## Done when

- [ ] the requirements are agreed through CRDM, not inferred from this bean
- [ ] the content type is declared under `todos/`, and the schema is
      cat-harness's, with the tools separate from the schema
- [ ] a note carries a position and an attachment, both optional
- [ ] the board collapses to a linear rendering that is complete, not degraded
- [ ] a note attached to content renders as a badged icon on it, and opens

---

## RULED, 2026-09-20 — board positions are COMMITTED, in one file per board

Put to the owner with four options and the merge hazard stated; they chose:

> **Committed, one positions file per board.**

So a note's position is **shared, publishable and survives a fresh clone** —
not `localStorage`, which the discard control already demonstrates the limits
of ("this browser only"), and not a field on each note, which would put a
rendering coordinate into the work plan and make every move its own file's
conflict.

### Why one file rather than per-note, in the owner's own precedent

The merge hazard is real and was not waved away — it is **contained**, using a
fix this repository proved on 2026-09-20 in `gen-docs-pages.ts`:

> Minified, this file is ONE LINE of ~12 KB. Git merges text by line, so a
> single line means any change on both sides of a merge is a whole-file
> conflict — two branches adding two different todos cannot both win. That is
> not hypothetical: it conflicted on three consecutive merges of one branch on
> 2026-09-20, every time.

Indented, one note per line, sorted by id, two sessions moving **different**
notes merge untouched. **It is a partial fix and the limit is known**: two
notes that sort ADJACENT still conflict, because the inserted lines overlap.
That was measured on a scratch repository rather than reasoned about, and the
same limit applies here — so this removes the guaranteed conflict, not every
conflict.

### What follows, and none of it is optional

- **The ordering must be deterministic**, or every save reshuffles and
  conflicts anyway. The todo index earns its mergeability only because
  `readTodoFiles` sorts; a positions file needs the same guarantee stated and
  tested, not assumed.
- **It is a new declared artefact**, so it owes a graph kind, a directory
  declaration, and — under `2krx` — a visualiser and a documentation entry. The
  kind's LAYER is the question to settle first: this is `state` (written by a
  running process), which puts it beside `beans/workflows/` rather than beside
  `folio/`. See `content-context-and-state-graphs`.
- **Writing it needs a writable datastore**, which `harness-instances.md`
  still lists as an open owner question — gh-pages is static. So the board is
  READABLE everywhere and writable only where there is a git path, which is the
  same conditional that page already states rather than a new one.
- **A position for a note that no longer exists is an orphan**, and orphans are
  reported rather than silently dropped. Same rule `gen-docs-pages` applies to
  QA projections.

### This unblocks `ivfw`'s move half

`ivfw`'s theme half shipped 2026-09-20; its *"you cant move around dispaly"*
half was left explicitly because the two must agree rather than ship two
notions of position. They now can. The movement model must stay
keyboard-driven — `docs-ui.js` ~2006 records the Pin button as a deliberate
choice over a drag, and this instance's declared interaction profile is
low-dexterity. **Drag may be added ON TOP as an accelerator; it must not be the
only way in.**
