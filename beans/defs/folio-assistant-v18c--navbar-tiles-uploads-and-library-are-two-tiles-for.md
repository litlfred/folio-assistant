---
# folio-assistant-v18c
title: 'Navbar tiles: uploads and library are two tiles for ONE page, and cat-harness''s library is empty'
status: todo
type: task
priority: normal
created_at: 2026-09-21T21:09:01Z
updated_at: 2026-09-21T21:09:01Z
parent: folio-assistant-vke6
---

Found 2026-09-21 while fixing the library viewers' parse error (the owner:
*"way too many tiles (non functional) on LHS explode menu"*). **The parse error
is fixed and shipped separately**; this is what is left after it.

## Measured in a browser, after the fix — 12 navbar tiles

| tile | renders |
|---|---|
| `schemas` (cat-harness) | 773 declarations |
| `detangle-schemas` / `large-datasets-schemas` / `cat-bootstrap-tools-schemas` / `folio-assist-core-schemas` | 9 / 11 / — / — declarations |
| `who-iris-library` | 3 entries, 84,292 words |
| `agent-skills-library` | 2 entries |
| `folio-assistant-sci-library` | 1 entry |
| `beans`, `todos` | populated |
| **`library`** (cat-harness) | **0 entries** |
| **`uploads`** | **0 entries — and the SAME page as `library`** |

## The two findings

**1. One page, two tiles.** `cat-harness.json` declares the same
`visualiser` for both:

```
uploads  -> cat-harness/docs/cat-harness/library/cat-harness/index.html
library  -> cat-harness/docs/cat-harness/library/cat-harness/index.html
```

That is deliberate — the library viewer carries an **Uploads** tab, and bean
`flh4` is on record against reporting `uploads` as having no viewer. But the
viewer has **no tab deep-linking**: no `location.hash` handling, no
`data-tab`, no `#uploads`. So both tiles land on the *Listing* tab, and the
`uploads` tile shows the library's 0 entries rather than the queue's **27
uningested**.

**2. `cat-harness`'s own library is empty.** 0 entries, and the tile is
indistinguishable from the populated ones until it is opened.

## Three ways out, none of them mine to pick

- **Deep-link the tab.** Give the viewer `#uploads` handling and point the
  `uploads` visualiser at it. Both tiles become true; costs a viewer feature.
- **Drop the `uploads` tile.** One declaration edit. But it re-opens `flh4`,
  which fixed the opposite error — `uploads` reported as unrendered while a
  working page existed.
- **Hide an empty viewer.** A tile whose projection has 0 entries becomes a
  reported gap rather than a link. That is the module's own
  *declared-vs-published* rule one step further — **published is not
  non-empty** — and it would hide `library` today and restore it when the
  corpus grows. It also changes what a missing tile MEANS, which is the part
  that needs a decision.

## Done when

- [ ] One of the three chosen and recorded, with the reason.
- [ ] `uploads` either shows its own queue or stops claiming to.
- [ ] If the empty rule lands: a test that an empty projection yields a gap,
      and a guard that a populated one still yields a link.

*Not started. Recorded by session_01AYHimvYMmf8h8e9fFN6dW5, which measured it
and fixed only the parse error.*
