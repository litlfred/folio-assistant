---
layout: default
title: The folio board — requirements as agreed
parent: Architecture
nav_order: 8
---

# The folio board — requirements as agreed
{: .no_toc }

1. TOC
{:toc}

---

## What this is, and what it is not

**A design record.** It states what was agreed for the folio board, in the CRDM
run on [issue #602](https://github.com/litlfred/folio-assistant/issues/602)
between 2026-09-20 and 2026-09-21, and it exists so that a person asking *why
is the board shaped like this* has one place to look.

It is **history, not instruction**, and that is the line the owner drew: a
skill carries what a competent practitioner needs *in order to do* the task,
and everything past that — the reasoning, the options not taken, the
measurements behind a threshold — is documentation. Every sentence below describes what was
agreed on a date, against a repository in a state. Where the implementation has
since diverged, the divergence is stated rather than smoothed. Nothing here
tells an agent what to do — the rules an agent follows live in the
`cat-harness` skills this set produced, and the processes live in the three
executable BPMN diagrams beside them.

**Filed here on the owner's ruling, 2026-09-21:**

> this is a memory asset as part of design, so it goes into docs/ […] this was
> an asset as part of building a feature […] but it is not the content we want
> displayed itself.

**And why it is in `cat-harness/docs/` specifically**, sharpened the same day:
*"if it is realated to some harness/feature/tool that detailed infromation/
design/planning/etc go into that harness' docs/"*. The board's schema and
behaviour live in `cat-harness` by the requester's own layering, so the record
of why they are shaped that way lives in that instance's `docs/` — not in the
repository root's, and not in a folio's.

The class, and why `fsh-guts` was the tempting wrong answer for it, is in
[`kg-contribution-offer`](https://litlfred.github.io/folio-assistant/reference/skill-instructions/kg-contribution-offer.html);
where inside `docs/` such a record files is in
[`placement`](https://litlfred.github.io/folio-assistant/reference/skill-instructions/placement.html).

---

## The need, in the requester's words

The whole set derives from this, kept verbatim because the layering sentence is
precise and a paraphrase loses it:

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

Two things in it are **constraints rather than preferences**, and both shaped
everything after:

- **the `todos/` ↔ `cat-harness` split** — content under `todos/`, schema and
  behaviour in `cat-harness`, tools kept distinct from schema;
- **"ALWAYS collapsable to linearly rendablee"** — an accessibility floor. A
  board that cannot be read linearly cannot be read by a screen reader, printed
  or translated.

---

## Round one — R1 to R7

Agreed in Phase 3. Of the seven, **exactly one introduced a genuinely new
mechanism**; that finding is why the implementation was ten small units rather
than one large one.

| | requirement | new mechanism? |
|---|---|---|
| **R1** | the board renders content, not only notes | no — a second rendering of an existing relation |
| **R2** | semantic zoom, with the threshold **declared** rather than a literal | **yes — the only one** |
| **R3** | `targetLabel` publishes its parts | no — a bug fix |
| **R4** | linear collapse, reachable without JavaScript | no, but it constrains R1 |
| **R5** | the badge counts only when `> 1` | no — two lines |
| **R6** | badge and panel stay **one** query | no — a regression test for something already true |
| **R7** | badges on avatars | no — R2 plus R6 |

### R1 — the board renders content, not only notes

The board SHALL render content nodes alongside notes, and a note attached to a
content node SHALL render **at that node** rather than at an independent
position.

*Accepted when* a board with one note attached to a block and one attached to
nothing renders **both** — the first at its block, the second at its declared
position. Removing the attachment moves the note to its position rather than
hiding it: "attached to nothing" is an existing declared state, not a new one.

### R2 — semantic zoom, with a declared threshold

As the board shrinks, a card SHALL stop rendering its words and render its
**avatar** instead. The threshold SHALL be **declared data**, not a literal in
the renderer.

*Accepted when* the card renders text at a declared size and its avatar below
it, a kind with no avatar takes `GENERIC` rather than rendering blank, and the
behaviour is **falsified in both directions** — a test that only checks the
shrunk case passes for a board that is always avatars.

*Consumer burden:* the threshold is **emitted**, never documented. *"We don't
need to emit it — the renderer knows"* is the smell this phase names.

### R3 — `targetLabel` SHALL publish its parts

The published todo index SHALL emit a note's **page and node as separate
fields**, not only the composite `targetLabel`.

This one was a **defect in something already published**. The value is
`sec:<page>-<node>`, page-qualified for a good reason — the bare node id
`what-is-not-built-yet` existed on two pages. But any consumer asking *which
page is this note on* had to string-manipulate: know the `sec:` prefix, know
the separator is `-`, and know node ids themselves contain `-`, so the split is
not unambiguous without already holding the page list.

**Our own client escaped it by accident**, matching on the whole string and
never parsing, which is exactly why it went unnoticed.

### R4 — the linear floor

The board SHALL always be collapsible to a linear rendering that works without
JavaScript. Movement SHALL be **keyboard-operable**; drag MAY be an accelerator
and SHALL NOT be the only way in — this instance's declared interaction profile
is low-dexterity.

### R5 to R7 — the badge

The badge SHALL show a count only when more than one note is attached (R5); the
badge and its panel SHALL be **two readings of one query** rather than a number
somebody maintains (R6); and an avatar carries the same badge from the same
query as the card it replaced (R7).

**A badge that can disagree with its own panel is the defect designed out**,
and it is designed out by derivation rather than by discipline.

---

## Round two — R8 to R14

These arrived **after** the requirements gateway had closed, and were checked
against the declared model rather than assumed compatible. They are additive:
nothing already agreed was invalidated.

| | requirement | relation to round one |
|---|---|---|
| **R8** | the dynamic board is an **overlay**; the standard rendering is a simple tile listing | **sharpens R4** — the floor is a tile listing, and movement is additive over it |
| **R9** | **everything starts as an avatar**; opening is an explicit act, `[x]` closes back | **splits R2** into two mechanisms — an explicit open/close a person performs, and automatic zoom by size. Conflating them is the defect to design out |
| **R10** | an open card is a panel with **fixed controls**, plus others depending on content; each content type controls its own rendering | the kind owned the zoom threshold; it now owns its whole rendering, under a chrome contract it cannot reach |
| **R11** | `fsh-guts` is a tile, and `[fishbones]` puts content into it as a **confirmed** action | new; reuses the declared non-rendered trashcan, whose founding rule is *do not delete unless explicit confirm* |
| **R12** | create a new sticky note — itself a tile | new |
| **R13** | filter the board by kind properties, **interactively** | a *reader's* filter at view time, distinct from the board document's *declared* filter. Two things that must not become one field |
| **R14** | resize open content, move it, drag and drop | rides R4's floor: drag is an accelerator, keyboard operation is not optional |

Recorded alongside them as scope rather than as a requirement: **"do all the
skills and bpmn workflows"** — each of these gets its skill and its diagram,
not only its schema.

---

## R15 and R16 are REFERENCED BUT NEVER DEFINED

Stated plainly because a design record that fills its own gaps with plausible
sentences is worse than one that names them — invented text reads exactly like
agreed text.

Bean `51wf` is assigned *"R2, R9, R15"* and bean `zsah` *"R12, R16"*. **No
comment on #602 states either requirement.** What they appear to mean is
recoverable only by inference, and is recorded here as inference:

| | what it appears to mean | evidence |
|---|---|---|
| **R15** | z-order — selecting any part of an open window raises it | `51wf`'s unit description, *"z-order with raise-on-select"* |
| **R16** | a tile opens the **existing** visualisation; nothing builds a second viewer | a later aside on the issue, *"R12/R16 said a tile opens the existing visualisation"* |

Both were implemented to that reading. If either is wrong, the code is what
needs re-checking, not this page.

---

## R17 — render safety

The last instruction became its own requirement: *"skill tool hints for XSS…
lazy load… assume assets in KG accessible, dynamic render where can"*.

**Only part of it has a subject.** The `Url` half shipped as
`schemas/safe-url.ts`, default-deny, with a source-level check that a renderer
ignoring it fails a test rather than shipping. The Tool-output render
vocabulary did **not**, and the reason is recorded rather than deferred
silently: nothing renders a *tool's* output even now, so choosing the terms
would be choosing them with no consumer to constrain them — a declared safety
property whose check does not answer its claim is worse than prose, because
prose is honestly unchecked.

---

## What the set produced

Each requirement's artefacts, so the record points at the code rather than
describing it:

| graph | what landed |
|---|---|
| `cat-harness` (BPMN) | `board-open-close`, `board-relocate`, `board-place-note` — executable diagrams with hand-authored Diagram Interchange |
| `cat-harness` (skills) | `board-windows`, `board-diagram-interchange`, `harness-tiles`, plus the `board-renderer` role and actor |
| `schemas` | `board-positions`, `window-stack`, `panel-chrome`, `reader-filter`, `semantic-zoom`, `safe-url` |

### One framing worth keeping

A **board is a diagram OF a folio**, in the OMG sense that a `BPMNDiagram` is a
diagram of a `bpmn:process`. The folio carries what is true; the layout layer
carries where it was drawn; the arrow runs `folio → board → position → note`
and never back.

Two consequences follow, and both are load-bearing: `board-positions` may not
put `x`/`y` on a note, for the same reason BPMN does not put coordinates on a
task — and **a folio is complete with no board.** Deleting every board loses
layout and no content.

---

## Where this diverged from what was agreed

One place, and it is recorded on the bean as well.

`51wf`'s checklist said *"every card starts as its avatar, at any size"*, which
cannot be literal alongside R2 — if cards are avatars at every width, R2 has
nothing to do. It was read as **"starts closed"**: a closed card shows its words
above the declared threshold and its avatar below it, with the avatar present at
every width as the control that opens the window. Flagged rather than silently
chosen, and **confirmed by the owner on 2026-09-21**.
