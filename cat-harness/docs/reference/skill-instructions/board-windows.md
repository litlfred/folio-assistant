---
layout: default
title: 'Start in the avatar, open into a window'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/board-windows.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/board-windows.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/board-windows.md){: .fa-edit-source }

{% raw %}
# Start in the avatar, open into a window

The owner, 2026-09-20 and 2026-09-21:

> start everyrting in avatar … `[x]` closes to avatar

> open is like window, avatar/tiles project open panels onto window. sum
> funcitonality, need to handle z-order.. selecting any part raises

> each content type controls its own avatar, visualtion/rendering. but assume
> they can open a full screen panel w/ fixed controls like `[x]` or `[linksrc]`
> or `[edit]` or what not depedning on conent.

## TWO mechanisms, and conflating them is the defect

| | trigger | who |
|---|---|---|
| **semantic zoom** | the card's rendered width crosses a declared threshold | automatic |
| **open / close** | `[x]`, or opening a card | a person |

They look alike on screen and they are not the same fact. **An open window is
not a zoom state**: it is projected *onto* the board rather than being the card
grown large, so it survives zooming out. Only `[x]` closes it.

Collapsing them gives a board where a card can close itself with no action
taken, and where `[x]` and a zoom-out are indistinguishable to the reader.

## The threshold is declared, inherited, and traceable

`schemas/semantic-zoom.ts`: a **folio default** with a **per-kind override** —
this repository's inheritance rule applied unchanged (*inherit everything,
override anything; a variant states only what it CHANGES*). So:

- the folio always has a number, and every kind resolves to one;
- a kind that states nothing is **complete, not invalid** — requiredness is
  checked after resolution, never on the declaration;
- an override carries a required `because`, and the resolver returns the
  **source** alongside the value.

That last pair is one rule, not two: *an inherited value is still a fact
somebody must be able to trace.* A reviewer looking at a card that flipped too
early needs to know whether somebody decided that or whether the folio's
default landed somewhere it does not fit — different bugs, different fixes.

**The boundary is stated once.** Strictly below the number, so the declared
width is the last one that still shows words. A boundary written one way in a
comment and the other way in the renderer is what makes a card flicker.

## Z-order: selecting any part raises

Windows stack, and **selecting any part of one raises it** — not a title bar,
any part, because a reader who clicks into a window's content has already said
which one they mean.

**Z-order is session-only**, by stated default and not by omission. The DI
layer carries no `z`: a committed stacking order would make every raise a file
write and every two sessions a conflict, on the most concurrently-edited state
a folio has. It is one optional field in the positions document if that turns
out to be wrong, and the reason it is not there is recorded rather than left to
be rediscovered.

## The chrome is fixed; the kind fills it in

A content kind **declares which controls it offers**, and the platform fixes
the frame:

- `[x]` is always present and always in the same place — a reader learns the
  frame once;
- a declared control that names nothing known is a **finding**, not a missing
  button;
- a control the environment cannot perform is **hidden, and the reason
  reported**. `pb04` is why: a dead `[edit]` 404s for exactly the reader who
  cannot edit, which reads as *"this page is broken"* rather than *"you cannot
  do this"*.

## Closing must have a reachable inverse

**An action whose inverse is not reachable is not a toggle.** Bean `l4zi`: the
landing board's close set `hidden` and stopped. On an overlay that is right —
the board was covering what you were reading, and the launcher tile re-opens
it. On a board that IS page content it removes a section of the page.

The tile existed, which is why the report read *"no place to get it back"*
rather than *"broken"*: **a control two clicks deep inside a collapsed launcher
is a place a reader has to already know about.** So the inline board collapses
to a control in its own position, and focus follows it — left alone, focus
lands on `<body>` and the keyboard position is gone.

## The floor, which is not negotiable

This instance's declared interaction profile is **low-dexterity**. Every board
action is keyboard-operable; drag is an accelerator and never the only way in.
Targets are at least the tile size. And the board is ALWAYS collapsible to a
linear, tile-based listing — a board that cannot be read linearly cannot be
read by a screen reader, printed, or translated.

### The listing is the ARTEFACT and the board is the overlay

Which is stronger than "collapsible to", and the difference is measurable.
Owner: *"this dymanic moving state is overlayed, its an 'extra'. on stndard
folio just simple tile based listing."*

So the floor must be correct **with no JavaScript at all**, not merely correct
when the board is toggled off. Those are different claims and the second one
was true here while the first was false: measured 2026-09-21, every note on an
ordinary page was built by `docs-ui.js` from a `fetch` of
`assets/todos/index.json`, so a reader with JavaScript off got no note, no
count, and no hint that notes existed. That is not a degraded board — it is an
absent artefact.

Three things follow, and each one is a thing to check rather than to intend:

**Document order, never the board's order.** The board may stack by BPMN
subprocess depth; the floor does not, because document order is the property a
screen reader and a printout depend on. A floor that reordered would be a
second answer to "what comes next".

**Collapsed, never removed.** When the board mounts it moves the listing into a
disclosure so the page is not showing the same notes twice. It does not delete
it, hide it from assistive technology, or `display: none` it — bean `l4zi`
again, one layer out: a listing the board removed would have no way back while
the board is open.

**Assert against the SERVED HTML.** A test that reads the DOM passes in exactly
the case this rule exists to catch, because the board built that DOM. The
assertion has to be on bytes the server sent — in this instance, a browser
context with `javaScriptEnabled: false` over the same renderer the generator
writes with.

## The folio belongs to the HARNESS, not to the library

A **content library** is something a reader browses — `who-iris`, the `smart-*`
instances, any folio published as a site. A **folio** is the reader's own
surface: their notes, the assets they have materialised, the documents they
created or linked. The library is the place; the folio is what they carry into
it.

So the folio visualisation is `cat-harness`'s, **available by convention on
any harness**, and a library never implements its own. A library may implement
its own landing page and may have its own harness — `who-iris` does — and
neither of those is licence to build a second folio.

**Consistency is the requirement, not quality.** Two harnesses that each build
a good folio have failed this: a reader moving between libraries must find the
same surface, because the point of carrying a folio is that it does not change
underneath them. The test is not *"is this folio good"* but *"is this the same
folio"*.

One consequence worth stating, because it is the one a library author trips
over: a note or a todo MAY reference nodes in **another** KG library. The
folio is not scoped to the library it is currently pulled down over, so a
reference that leaves the library is ordinary rather than exceptional, and a
renderer that assumes local resolution will break on the reader's own data.

## An asset has THREE states, not two

Pulling the folio down gives a **glass** — a surface over whatever is being
browsed, carrying sticky notes and the avatars of materialised assets,
including materialised KG like `cat-bootstrap` or `cat-harness` themselves.

A thing on that glass can be closed. **What closing does is the rule:**

| state | where the asset is | how it got there |
|---|---|---|
| **in the library** | not the reader's at all | the default |
| **in the folio, not displayed** | materialised under `folio/`, off the glass | the reader closed it, *"back in library"* |
| **on the glass** | displayed in the pulled-down folio | the reader pulled it out of the library |

**Closing returns an asset to the middle state and NEVER to the first.** The
asset stays in `folio/`; only its display goes. Putting it back on the glass is
a separate act performed **from the library** — *"need to go back to the
library and pull it out to folio display window"* — not from the glass it just
left.

**Why three rather than two, which is the whole point.** A two-state model —
in the folio, or not — makes *closing a sticky* and *un-materialising an asset*
the same gesture. A reader tidying their glass would then silently discard
work, and would have no way to tell that they had. The middle state is what
makes closing cheap enough to do freely.

This is `l4zi` one level out, and the shape is easy to miss because no single
screen looks wrong: the inverse of **close** must be reachable, and here it is
reachable from a **different surface** than the one that closed it. When you
implement close, the thing to check is that the library offers the way back —
not that the glass does.

## Not this skill

The layout layer and why a note carries no coordinates:
[`board-diagram-interchange`](board-diagram-interchange.md). Relocating content
out of a folio is `deletion-requires-confirmation`, applied by
`processes/board-relocate.bpmn` rather than restated here.
{% endraw %}
