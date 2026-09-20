---
# folio-assistant-hso8
title: 'BLOCKER: main and this branch name the core instance differently — folio-assistant-core vs folio-assistant-core'
status: todo
type: task
priority: high
created_at: 2026-09-20T16:36:01Z
updated_at: 2026-09-20T16:36:22Z
parent: folio-assistant-vke6
---


**Merging `main` into PR #477 is blocked on this.** The merge was started,
produced 14 conflicts, and was aborted rather than resolved: eight of them are
this one disagreement wearing different clothes, and resolving it either way
is a decision about somebody else's work.

## The two names, measured 2026-09-20

| | this branch | `main` |
|---|---|---|
| directory | `folio-assistant-core/` | `folio-assistant-core/` |
| contents | **14 files** — `library-ref`, `dublin-core`, `catalogue`, `materialization`, `extraction`, `external-schema`, `folios/` | **2 files** — `README.md`, `harness.json` |
| `CORE_NS` | `…/folio-assistant-core/ns#` | `…/folio-assistant-core/ns#` |
| files naming it | 48 | 80 |
| the other name appears | — | **nowhere** |

The bootstrap layer diverged the same way and in the same direction:
`bootstrap/` here, `cat-bootstrap/` on main, with `CAT_BOOTSTRAP_NS` and a
`cat-bootstrap` theme id to match. Main is consolidating on a `cat-` prefix
for harness-layer instances.

## Why an agent should not pick

**The owner already ruled, and main went the other way.** 2026-09-20, in this
session, twice:

> use folio-assistant-core/

> cat-harness, folio-assistant-core, folio-assistant are distinct
> instances/schemas

That ruling was given while `main` carried a `folio-assistant-core/` stub, and
this branch renamed to match it. Main has since built 80 files' worth of work
on the short name and never adopted the long one. So the minority spelling is
the one with the explicit instruction behind it, and the majority spelling is
the one the trunk is actually built on.

Both resolutions destroy something real:

- **Take main's `folio-assistant-core`** — reverses an explicit instruction, and
  moves a **published IRI** (`CORE_NS`) for the second time in two days.
- **Keep `folio-assistant-core`** — renames 80 files of main's work from a
  feature branch, including the namespace constants three other instances
  resolve against.

Merging without deciding gives the worst outcome and is the one thing that
must not happen: TWO directories for ONE instance, a populated
`folio-assistant-core/` beside main's empty `folio-assistant-core/`. That is the
exact defect this PR already recorded hitting once — *"one instance, two
directories … `instanceRoots` is keyed on the declared name, so the stub and
the populated one were one key, and the stub won."*

## Done when

- [ ] The owner names the core instance, ONCE, and says whether the `cat-`
      prefix extends to it.
- [ ] Whichever loses is renamed in one commit that moves the directory AND
      the namespace constant together — `CORE_NS` is published, so a rename
      that lands in two commits publishes a broken IRI in between.
- [ ] `bootstrap` vs `cat-bootstrap` is settled in the same breath; it is the
      same question about the same layer and splitting it guarantees a third
      round.
- [ ] `instanceRootsIn` and the two committed instance lists
      (`cat-harness.test.ts`, `instance-render.test.ts`) are updated, and the
      rename is verified by `check:instance-render` rendering every instance.

## Not a naming quibble

`instanceRoots` is keyed on the declared NAME. Two spellings is not two
labels for one thing — it is two instances as far as every declaration-driven
consumer is concerned, which is how the stub won last time.
