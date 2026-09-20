---
# folio-assistant-ohx6
title: 'CAT-HARNESS/FOLIO: a minimal just-the-docs rendering describing folio, and folio/render for the rendering skills and tools'
status: todo
type: task
priority: normal
created_at: 2026-09-20T14:28:56Z
updated_at: 2026-09-20T15:09:14Z
parent: folio-assistant-vke6
---

Owner, 2026-09-20, verbatim:

> catharness build on that.   from there on up need to meet requirements b/c
> cat-harness hould provude it with folio, etc.   it is a minimal justthedocs
> rendering in cat-harness/folio/ describing folio and cat-harness/folio/render
> for rendeing skills/tools etc.

## What it asks for

Two directories, and they are different kinds of thing:

| path | what it holds |
|---|---|
| `cat-harness/folio/` | a **minimal just-the-docs rendering** describing what a folio IS |
| `cat-harness/folio/render/` | the **skills and tools** for rendering |

**`cat-harness` is where the requirements start applying.** Bootstrap is
exempt (`hfkl`); cat-harness builds on it and from there up every layer must
meet them, *because cat-harness is what supplies the layers above with folio*.
A layer that hands its dependents a folio and cannot render one itself is
asking of them what it did not do.

## Why "minimal" is load-bearing, not modesty

`cat-harness/folio/` describing **folio** — the concept — is the platform
documenting its own vocabulary, which is allowed. It is NOT a folio's content,
and the platform boundary still holds: the moment this directory grows a
chapter, a constant or a vocabulary, it is subject matter and belongs in a
folio repository. The [platform-boundary rule](../../AGENTS.md) is the test.

## Measured before claiming

- **`cat-harness/folio/` already exists** as a declared directory — the `folio`
  graph kind is registered by CORE as a load-time side effect
  (`schemas/folio-graph-kind.ts`), and `check-declared-assets` imports it
  precisely because this instance declares a folio graph. So this bean is about
  what goes IN it, not about creating it.
- **`hs08` is adjacent and different**: that bean is the `content/` -> `folio/`
  rename reaching the declaration and the readers. This one is the *content of*
  `cat-harness/folio/`. Check `hs08`'s state before starting — if the rename is
  unfinished, this builds on sand.
- **The rendering path is `folio-assist-core`'s, not the harness's** — per
  `cat-harness-minimum`, the just-the-docs pipeline and every renderer belong to
  core. "A minimal just-the-docs rendering in `cat-harness/folio/`" therefore
  needs the layering question answered first: does cat-harness reach up to
  core's renderer, or does it carry a minimal one of its own? **This is the
  same direction problem the docs page names and `hfkl` half-answers, and it is
  not settled by the quote above.** Ask before building.

## Done when

- [ ] `cat-harness/folio/` carries a minimal just-the-docs rendering describing
      what a folio is
- [ ] `cat-harness/folio/render/` holds the rendering skills and tools, declared
      as a subgraph
- [ ] The direction question above is answered by the owner rather than assumed
