---
# folio-assistant-bp4x
title: 'STICKIES: each initiator contributes its own sticky, rather than one list owning them all'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-20T06:23:14Z
updated_at: 2026-09-20T08:27:01Z
parent: folio-assistant-o3xy
---

## The ask, owner 2026-09-20 (verbatim)

> each intiator should create its own sticky. bootstrap sticky will have link
> back to the source code + ghpaghes for boot strrap. boot streap avatar
> forthcoming.

## Why this is a real change of shape, not an addition

`mggs` built the landing stickies as a **fixed set of three**, returned by
`landingStickies()` in `schemas/landing-sticky.ts` and written by
`scripts/ensure-landing-sticky.ts`. That is a list this repository owns.

This ask inverts the ownership: **each initiator contributes its own sticky**,
so the set is composed from the layers present rather than enumerated in one
place. `bootstrap` contributes one, `cat-harness` contributes one, a downstream
folio contributes one. The list stops being a constant and becomes a
**contribution**, exactly like `registerFolioGraphKind` contributes a graph kind
— and `folio-graph-kind.ts` already states the principle it would follow: a
layer owns what it can serve, and the layer above does not enumerate it.

## What this makes possible, and what it costs

Possible: a bare bootstrap instance gets a bootstrap sticky and **no cat**,
which is the owner's earlier ruling (*"i want the grumpy cat moved out of
bootstrap and into cat harness"*) satisfied structurally rather than by
remembering not to.

Cost, and it is the part to design carefully: the ORDER of a composed set. The
current order is meaningful — the description first, because a reader needs to
know what the instance is before anything else means anything. A contributed
set needs a declared order or it renders in dependency-resolution order, which
is `resolveDirectories`' deepest-dependency-first and would put bootstrap's
sticky above the instance's own.

## Measured, so the bootstrap half is not started blind

- `bootstrap/harness.json` declares `name: "bootstrap"`, `description: "The
  graph an agent reads before it knows what this repository is."` and two
  assets (`AGENTS.md`, `README.md`). It declares **no `images[]`** and no
  `canonicalUrl`, so a bootstrap sticky has a description to carry but **no art
  and no site URL** yet.
- *"link back to the source code + ghpages for bootstrap"* therefore needs both
  to be decided. The source link is composable from the repository; the gh-pages
  URL for bootstrap **does not exist** — this instance's `canonicalUrl` is
  `https://litlfred.github.io/folio-assistant`, which is cat-harness's site, not
  bootstrap's.
- *"boot streap avatar forthcoming"* — `schemas/avatars.ts` already declares a
  `bootstrap` avatar among its 19 kinds, so an avatar exists; the ask is
  presumably for new art rather than a first one. Worth confirming.

## Done when

- [ ] a sticky is a CONTRIBUTION from a layer rather than an entry in one list
- [ ] order is declared rather than inherited from dependency resolution
- [ ] bootstrap contributes its own, with its source link and its gh-pages link
      once that URL exists
- [ ] a bare bootstrap instance gets no cat, proved by a test rather than by
      convention
- [ ] `ensure-landing-sticky.ts` writes the composed set, still idempotently and
      still under the same `--check` gate
