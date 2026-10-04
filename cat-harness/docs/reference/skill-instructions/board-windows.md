---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Start in the avatar, open into a window'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/ui/ui-core/board-windows.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/ui/ui-core/board-windows.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/ui/ui-core/board-windows.md){: .fa-edit-source }

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

### Semantic zoom is the GLASS's, not the board's — since 2026-10-02

The owner, 2026-10-02, on the stickies panel (#1925), verbatim:

> dont treat stickies differently. combine best of each. lower faded
> avatar/theme looks nicer. upper smaller same size closed looks niceer. icons
> are a mess on both. make compact underneath. [x] is what? send to fsh-guts?
> make sure confirmed by user

So every board slot — a landing sticky and a todo sticky alike — is **one
component**: the same closed square tile (`--fa-sticky-tile-size`) with the
theme's faded art, and the same compact icon row underneath it. A slot is its
closed tile at **every** width, so there is no width at which a board slot
shows more words, and **semantic zoom no longer runs on the board**. It still
decides what a card shows **on the folio glass**, where a card is resized
freely. Opening a tile is still the other mechanism — `[x]` closes the window,
nothing automatic does.

Do not re-add a width observer to the board grid: it would be a zoom with
nothing to change, and the next agent would read it as the card's state.

## One sticky, one icon row, in one order

Under every sticky, on every panel: **view, edit, pin, send to fsh-guts**, as
icon buttons. An icon-only control carries `aria-label` (what a screen reader
announces) AND `title` (the same words on hover); they are not
interchangeable. No control sits inside the card body. The open window's bar
uses the same icons for the same acts — a reader who learned the row has
learned the bar. A link the sticky cannot serve is absent, never dead (`pb04`).

## Pin is a toggle onto the FOLIO glass

The owner, 2026-10-02, verbatim: *"pin to glass should pin to folio glass. its
not working right."*

It was not working because Pin wrote a **second store** and cloned the card
into the layer as a page-level floating copy, which was never a folio-glass
item: no glass tools, no folio geometry, no shelve, special-cased by the glass
filter and count. Two stores answering *"what is on my glass"* is the defect.

So:

- **Pin makes the sticky a folio asset** — `todo/<id>` (the key the glass's own
  Todos panel pulls a todo out under, so the two ways onto the glass agree) or
  `landing/<slot>` — with `shown: true`, drawn by the glass's own card path and
  placed by `placeOnGlass`. A landing sticky's theme, picture URL and text
  travel in the entry as data, never as stored markup.
- **Unpin is `shelveFromGlass`** — the middle of the three states below. The
  entry stays; the same pin puts it back, where the reader left it.
- **The pressed state is the store's answer** (`folioStateOf(key) ===
  "glass"`), never the button's memory. The glass's own × shelves too, and the
  row's pin follows it.
- The old pin store is migrated into the folio once, so no reader's pin is
  lost; nothing writes it any more.

## Send to fsh-guts asks first

*"[x] is what? send to fsh-guts? make sure confirmed by user"* — a control a
reader has to ask about has not said what it does. So discard is named for
where it goes (**Send to fsh-guts**, the trashcan that is kept) and opens a
confirmation that names the sticky, says it is restorable and per-browser, and
says **where** it is restored from — the fish in the navbar's icon row. Focus
starts on Cancel; Cancel and Escape do nothing but close it. A dialog whose
dismissal performs the act did not ask. The window bar's send is the same act
and takes the same confirmation. The inverse is Restore in fsh-guts (`l4zi`).

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

**A default of "hidden" is allowed only with the inverse on screen.** The
glass's tile strip starts slid away (owner, 2026-10-01), and that is
acceptable for one reason: its "Show tiles (N)" tab stays in view, in the
strip's own position, and the same tab hides the tiles again. A hidden default
whose way back is anywhere else is this section's defect. See
[`harness-tiles`](harness-tiles.md) §"The glass strip".

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

## A tile, or an avatar?

**Who declared it** — a tile is what the HARNESS declares, an avatar is what
the FOLIO holds, and a theme is how either one looks rather than a third kind.
The test, the case that settles it and the two rules it kills are in
[`harness-tiles`](harness-tiles.md) §"A tile, or an avatar?", because the tile
side already owned *"a tile is the harness's, not the node's"* and one rule
with two homes is one rule free to drift.

## An asset has THREE states, not two

Pulling the folio down gives a **glass** — a surface over whatever is being
browsed, carrying sticky notes and the avatars of materialised assets,
including materialised KG like `cat-bootstrap` or `cat-harness` themselves.

A thing on that glass can be closed. **What closing does is the rule:**

| state | where the asset is | how it got there |
|---|---|---|
| **in the library** | not the reader's at all | the default |
| **in the folio, not displayed** | materialised into the folio's own `reproduce` directories — `library/` for the bytes, `uploads/` for a source — off the glass | the reader closed it, *"back in library"* |
| **on the glass** | displayed in the pulled-down folio | the reader pulled it out of the library |

**"In the folio" is not `folio/`, and the difference is load-bearing.** R27
says *"materialized should live in folio"*, and the folio is the reader's
REPOSITORY, of which `library/` and `uploads/` are already declared parts —
both carry `dependents: "reproduce"`, which is the schema saying *this is the
reader's own copy*. `folio/` is a different graph kind: **renderable** authored
content.

Reading it as the directory would break a consumer that exists.
`schemas/materialization.ts` states the dependency outright — ***`corpus-grep`
searches `library/` only***, so a node materialised anywhere else reads as
ABSENT to every consumer. That is the same defect the schema already forbids
one state up, where collapsing `referenced` into `materialized` hides a node
nobody holds.

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

**So close says where the way back is, at the moment of closing** (issue
#1900, owner 2026-10-02: *"[x] should confirm returning back to library and
tell them which library in case they need again"*). The glass's `[x]` opens a
confirm that names the instance's library and links it, Escape and Cancel
leave the card where it is, and only the confirm shelves it — after which the
glass says, with the same link, where the asset went. Naming the library is
not politeness: a reader holding assets from several libraries otherwise has
to remember which one each came from to get it back.

**The place is the card's own, so there are three.** A library card goes back
to its instance's library, a todo to the Todos board, and a landing sticky
pinned to the glass to the page it was pinned from. Calling a sticky "your
Todos" sends the reader to a list it was never on. One function answers
"where does this card go back to", and the confirm, the status after it and
the `[x]` button's own label all read it, so the three cannot disagree. The
confirm is the page's one confirm dialog, shared with sending a sticky to
fsh-guts, so focus-on-Cancel and Escape-cancels are stated once.

A card's other controls follow the floor below. Opening a library card goes to
the asset's visualizer when its index entry declares one, else to its entry
page; resizing is a corner drag, with `+`/`−` in move mode and the move bar's
buttons as the non-drag path, so the drag is never the only way in.

## Two settings panels, two names, each points to the other

The glass has its own settings (theme, avatars, opacity, blur), and the page
has its own under ▦ Actions (scheme, reading preferences, the Discarded fish,
Declared kinds). These are two different things, so they get **two names:
"Glass settings" and "Page settings"**. Each panel also opens with a link to
the other, as its first control. Owner, 2026-10-01, choosing option 2 of 4 on
bean `ob3m` finding 12.

**Why the link and not just the rename.** Before the ruling, both panels were
called "Settings" and both wore a gear. Renaming only one fixed the
**collision**: a screen reader no longer read two controls identically. It did
not fix the **search**. A reader who wants the Discarded items and opens the
glass panel is in the wrong place, and only a pointer gets them to the right
one. An earlier attempt renamed the glass panel alone. It rejected the links
on the grounds that site chrome and board state are unrelated. That is true of
the settings and false of the places, and a reader moves between places.

Three rules follow, and each one has already been broken once:

- **The names are declared once** (`SETTINGS_NAMES` in `docs-ui.js`), because
  each panel's link prints the OTHER panel's name. If a panel is renamed in
  one place only, the other panel's link names something that no longer
  exists.
- **The link must OPEN its target, not toggle it, and not open it
  underneath.** The glass's `openPanel` closes a panel that is already open.
  The Page settings panel lives in the sidebar, and the open glass covers the
  sidebar. So the glass-to-page link shuts the glass first, and the
  page-to-glass link shuts the launcher first. In both cases focus lands on
  the target panel's heading.
- **No link to nothing.** A page with a glass and no sidebar has no launcher,
  for example a replica or the harness page. There, Glass settings draws no
  Page settings link. Each panel registers an opener, and the link is drawn
  only when its target registered one.

The same holds for any future pair of panels that share a word, such as two
"Filters": name each one for what it acts on, and point each one at the other.
`scripts/tests/settings-labels-distinct.test.ts` checks the source.
`test/settings-crosslinks.e2e.ts` checks the rendered page at 1280×800 and at
390×844. It covers the mouse and the keyboard, and checks that each link opens
the other panel and that focus lands on its heading.

## Not this skill

The layout layer and why a note carries no coordinates:
[`board-diagram-interchange`](board-diagram-interchange.md). Relocating content
out of a folio is `deletion-requires-confirmation`, applied by
`folio-assistant-core/processes/ui/board-relocate.bpmn` rather than restated here.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Board: open and close content](../../processes/board-open-close.html) | Render every card as its avatar; Project a window onto the board; Raise the window the reader selected; Close the window back to its avatar; Leave a reachable way back; Resolve the kind's zoom threshold; Swap cards below the threshold; leave open windows alone |
| [Board: relocate content to the trashcan](../../processes/board-relocate.html) | Leave the content exactly where it is |

