---
# folio-assistant-hw9g
title: 'MOUNTED PAGES HAVE NO LHS RAIL: a collapsed icon-width harness nav for every mounted instance, opening on hover or click'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T18:40:00Z
updated_at: 2026-09-21T19:05:00Z
parent: folio-assistant-yj32
---

## What

Owner, 2026-09-21, looking at the published `/who-iris/`:

> *"i see no LHS navbar. It still should be there in this harness, but it can
> start collapsed (so only icon width wide), hovering/clicking on it will
> open"*

and earlier, on the same subject:

> *"f-a navbar should still be on the left, with who-iris and then link to docs
> on side in navbar"*

## Measured, not assumed

On the published site:

| page | LHS nav markup |
|---|---|
| root `index.html` | `side-bar`, `nav-list`, `nav-list-item` — just-the-docs' |
| `/who-iris/index.html` | `main` only — **none** |
| `/smart-trust/index.html` | **none** |

**Every mounted instance, not one of them.**

## Why — and it is deliberate, not an oversight

`mount-instance-docs.ts` copies finished HTML and does not run Jekyll over it.
Its own note says why: handing these to Jekyll *"would ask for front matter
they do not have and **a layout they do not want**"*. That is right —
`who-iris/` is a replica of IRIS, and just-the-docs' layout would replace
IRIS's chrome with folio-assistant's, which is the opposite of what a replica
is for.

So the bypass stays and the harness gets its navigation back another way: a
rail injected **at mount time**, the harness's frame *around* the instance's
page rather than instead of it.

## Why the mount layer and not `gen-iris-pages`

`smart-trust` has the identical gap. Put it in a folio's generator and every
instance needs its own copy of the platform's navbar — the boundary `AGENTS.md`
opens with. One implementation, and a new instance gets it by being mounted.

## Not this bean

`603s` — the LANDING page's navbar, instances as themed sections in dependency
order. **Another session's, in-progress.** Adjacent and not the same: `603s`
redesigns the navbar's content model for Jekyll pages, and a non-Jekyll page
would still have none after it lands. Put to the owner before starting rather
than assumed, because three sibling duplications had already cost real work
today.

## Done when

- [x] A collapsed icon-width rail on every mounted instance page, opening on
      hover, on keyboard focus, and on a click that pins it
- [x] No script injected into a document the harness does not own
- [x] Links derived from the mount table, so a new renderable kind needs no
      edit here
- [x] Every emitted href resolves against the built tree
- [x] Falsified, and the falsification found a weakness in the test itself
- [ ] `bun run gates` green
- [ ] Merged, and verified on `main`

## The depth bug, and the test that did not catch it

The first version computed `toRoot` from the mount's **route depth alone** and
argued for it in a comment. True of a mount's `index.html`, false of every page
beneath: `smart-trust/` mounts one segment deep and holds `artifact/*.html` one
deeper, so **57 of 188 rail links pointed at a directory that does not exist**.
Caught by resolving every emitted href against the built tree.

Then the falsification found the second defect. Planting the bug back left all
twelve unit tests **green** — the test had restated the expression locally "so
it would not share the buggy one", and a restated expression guards nothing at
the call site. `toRootFor` is exported now and the test binds to it; planting
the bug fails exactly the two nested cases.
