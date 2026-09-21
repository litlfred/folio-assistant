---
# folio-assistant-qefk
title: 'STICKY CHROME: four buttons per sticky and three rows of board furniture is more control than content'
status: completed
type: bug
priority: normal
created_at: 2026-09-21T17:11:38Z
updated_at: 2026-09-21T19:32:23Z
parent: folio-assistant-6lb8
---

Issue https://github.com/litlfred/folio-assistant/issues/756 item 3. Owner: "the todos controls are too clunky / take up too much real estate."


## Built 2026-09-21 — "3+1", split by what the gesture DOES

Asked how far to cut and the owner answered **"3+1"** — not one of the offered
options, so the reading is recorded here rather than assumed away: three
controls on the face, one affordance holding the rest.

**The split is by what the gesture does, not by how often it is used:**

| | face | behind the one |
|---|---|---|
| board card | Pin, Discard, `⋯` | View, Edit |
| floated card | Pin, Discard, Move, `⋯` | View, Edit |

**`pb04` is intact, and this is the part worth being careful about.** Its rule
was that View and Edit are two acts and **both must be present** — *"a reader
checking what a card says should not land in a text box, and one who wants to
fix it should not have to find the button"*. Present is what it asked for.
Competing with a one-line summary is not, and nothing in `pb04` asked for that.
Both are still here, still keyboard-reachable, one keystroke further away.

### A `<details>`, not a scripted menu

The disclosure, the keyboard path, Escape, and the expanded state are the
browser's. A hand-rolled popup is four affordances to reimplement and four ways
to get them wrong — and this instance's declared interaction profile is
low-dexterity, which is exactly where a bespoke menu fails first. It also
degrades to everything-visible with no JavaScript, which is R4's floor rather
than a nicety.

### Three things the build turned up

- **The drawer is built only when it has something to hold.** With no forge,
  `sourceLinks` is empty and there is no `⋯` — an affordance opening an empty
  drawer is `pb04`'s own failure in a new costume.
- **NOT on an inline sticky.** A compact card carries no Pin and no Discard, so
  collapsing its only two controls would leave a card whose entire chrome is a
  `⋯`: more clicks for less, the opposite of what this bean asked for. The
  drawer exists to make room for board gestures; where there are none it earns
  nothing.
- **Move was going in at `firstChild`**, which put it ahead of Pin and
  reordered the row every time a card floated. It now lands before the drawer,
  because it is a board gesture and belongs on the face.

### Done when

- [x] the face carries board gestures only, and the drawer is LAST
- [x] View and Edit remain present and keyboard-reachable — `pb04` unbroken
- [x] the drawer names its contents (*"Source links for … — 2 links"*) rather
      than its shape; "More" tells a screen-reader user nothing
- [x] the summary is a 24px target (SC 2.5.8), which is the floor this
      instance's interaction profile makes the point rather than the minimum
- [x] the open drawer is OPAQUE and inherits the card's surface, so a themed
      sticky's drawer is themed — `ivfw`'s round-trip lesson applied before it
      could bite
- [x] 87 e2e pass (46 sticky + 41 a11y), 3 of them new; gates 93/93

### Deliberately NOT done

Nothing was **removed**. The owner's second option — dropping View/Edit from the
card entirely — would have re-opened `pb04`, and "3+1" does not ask for it. The
board furniture's *three rows*, which this bean's title also names, is
untouched: it is `v0jv`'s and `z1ug`'s subject, and cutting rows here would be
deciding their layout from inside a different bean.
