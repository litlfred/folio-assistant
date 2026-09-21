---
# folio-assistant-hso8
title: 'BLOCKER: main and this branch name the core instance differently — folio-assist-core vs folio-assistant-core'
status: completed
type: task
priority: normal
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
| directory | `folio-assistant-core/` | `folio-assist-core/` |
| contents | **14 files** — `library-ref`, `dublin-core`, `catalogue`, `materialization`, `extraction`, `external-schema`, `folios/` | **2 files** — `README.md`, `harness.json` |
| `CORE_NS` | `…/folio-assistant-core/ns#` | `…/folio-assist-core/ns#` |
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

That ruling was given while `main` carried a `folio-assist-core/` stub, and
this branch renamed to match it. Main has since built 80 files' worth of work
on the short name and never adopted the long one. So the minority spelling is
the one with the explicit instruction behind it, and the majority spelling is
the one the trunk is actually built on.

Both resolutions destroy something real:

- **Take main's `folio-assist-core`** — reverses an explicit instruction, and
  moves a **published IRI** (`CORE_NS`) for the second time in two days.
- **Keep `folio-assistant-core`** — renames 80 files of main's work from a
  feature branch, including the namespace constants three other instances
  resolve against.

Merging without deciding gives the worst outcome and is the one thing that
must not happen: TWO directories for ONE instance, a populated
`folio-assistant-core/` beside main's empty `folio-assist-core/`. That is the
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


## RESOLVED — and it was resolved on 2026-09-20, not today

Re-measured 2026-09-21 rather than re-diagnosed, because a stale `!BLOCKER`
at the top of GOAL 1 draws a session in to solve something already settled.

### The premise is gone

This bean's first line is *"merging **main** into PR #477 is blocked on
this."* **[#477](https://github.com/litlfred/folio-assistant/pull/477) merged
at 2026-09-20T18:18:43Z** — 1,937 files, 65 commits. There is nothing left to
block.

### The owner's ruling is what landed

| | today on `main` |
|---|---|
| `folio-assistant-core/` | **exists** |
| `folio-assist-core/` | **does not exist** |

So the long name won, which is what the owner said twice (*"use
folio-assistant-core/"*). This bean's worry — *"the minority spelling is the
one with the explicit instruction behind it, and the majority spelling is the
one the trunk is actually built on"* — resolved in favour of the instruction,
and #477's own body records the collision being fixed rather than merged into.

### The 115 remaining references are deliberate, not debris

The short name still appears in 115 files, which looks alarming and is not.
Categorised rather than swept:

- **Prose documenting the rename** — the sentences bean `8xtj` warns a sweep
  turns into *"X became X"*.
- **The landing card id**, which is `folio-assist-core` **on purpose**:
  a card id is a PUBLISHED IDENTIFIER and does not move with a directory.
  `folio-assistant-core/harness.json` says so in its own `_comment`,
  `landing-sticky.test.ts:135` says so, and `8xtj` records the cost of
  assuming the two are one string — a session swept every spelling at once,
  renamed the card by accident, and had to put it back.

**No `harness.json` declares the dead name as a directory**, and no path
reference resolves to nothing. Checked, because that is the only version of
this that would still be a defect.

### What is genuinely still open, and it is not a blocker

The second done-when asks whether the `cat-` prefix extends to the core
instance. Today `cat-harness` and `cat-bootstrap` carry it and
`folio-assistant-core` does not. That is a naming question with nothing
waiting on it, so it belongs in whatever bean owns the prefix convention
rather than in a blocker. **Not swept, not assumed either way** — the last
thing this instance needs is a third rename of a published IRI in two days.

## Done when

- [x] The owner names the core instance, ONCE — done 2026-09-20, and
      `folio-assistant-core/` is what is on `main`
- [x] Whichever loses is renamed — done in #477, which merged
