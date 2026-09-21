---
# folio-assistant-hso8
title: 'BLOCKER: main and this branch name the core instance differently — folio-assist-core vs folio-assistant-core'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T16:36:01Z
updated_at: 2026-09-21T07:52:20Z
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

## RE-MEASURED 2026-09-21 ON MAIN (`519e8c01`) — THE BLOCKER IS GONE

Everything above was measured 2026-09-20 and its premise no longer holds.
**Main adopted the owner's name.** Measured, not read from this bean:

| | 2026-09-20 (this bean) | 2026-09-21 (main) |
|---|---|---|
| directory | `folio-assistant-core/` here, `folio-assist-core/` on main | **`folio-assistant-core/`** |
| declared `name` | disagreed | **`folio-assistant-core`** |
| sibling | — | `folio-assistant-sci/`, long form too |

`folio-assistant-core/harness.json` records the fix against itself, dated
2026-09-20: *"the DIRECTORY and the declared NAME are BOTH spelled out in
full … Corrected"*. So the fourteen-conflict merge this bean blocks cannot
recur: there is one spelling, and it is the one the owner named.

**115 files still say `folio-assist-core`, and almost none of it matters.**
Checked rather than swept: 42 are `beans/defs` — historical record, which is
never rewritten — and every one of the five `harness.json` hits is prose in a
`_comment` or `description`. **No `dependencies` field names the short form**,
so nothing resolves through it. The rest is docs, translations and generated
pages.

## What the settlement left behind, and it cost the instance its face

**`AVATARS["folio-assist-core"]` was a live keyed lookup on a name nothing
carries.** `harness-tiles.ts:223` calls `avatarFor(decl.name)` — the DECLARED
INSTANCE NAME — so measured on 2026-09-21:

    avatarFor("folio-assistant-core")  ->  GENERIC   (the question mark)
    avatarFor("folio-assist-core")     ->  the leaf of paper, unreachable

The instance rendered "no avatar is declared for this" while its own
hand-drawn art sat in the table under the dead spelling. **A key nobody can
reach is worse than a missing one**: `check-avatar-coverage` counted it as
declared, so coverage read clean over it.

The comment explaining the entry had gone stale in the same direction — *"the
split (#223) has not happened, so `cat-bootstrap` and `folio-assist-core`
exist as layers in the namespace and as nothing in `harness.json`"*. Both
halves false: both files exist and both declare a `name`. The test asserting
it repeated the claim verbatim.

Fixed: the key, the comment, the test, and an asset `title` reading
`AGENTS.md — folio-assist-core`. A new test states the property rather than
the spelling — **every instance-keyed avatar must match a real declared
name** — so the next drift fails instead of rendering a question mark.

**The table serves two key spaces and only one is checked.** `kind-fan` and
`gen-avatars-css` key by GRAPH KIND; `harness-tiles` keys by INSTANCE NAME.
`check-avatar-coverage` asks only about kinds, which is why it reports these
two as orphans — correct about its own axis, silent about the other. Instance
coverage is bean `4kj4`'s and is deliberately **not** taken here.

## Done when — restated against what is actually left

- [x] The conflict is settled: main declares `folio-assistant-core`, directory
      and name, and `folio-assistant-sci` alongside it.
- [x] The namespace constant moved with the directory — one spelling in the
      tree, no half-published IRI.
- [x] `bootstrap` vs `cat-bootstrap` settled in the same direction:
      `cat-bootstrap/` declares `name: "cat-bootstrap"`.
- [x] The rename's live leftovers are gone, verified by `check:instance-render`
      and `bun run gates` 80 of 80.
- [ ] **STILL THE OWNER'S, and the only thing left:** does the `cat-` prefix
      extend to the core instance? The trunk's state is not a ruling — it
      carries `cat-harness` and `cat-bootstrap` with the prefix,
      `folio-assistant-core` and `folio-assistant-sci` without. Nobody said
      that was the intended line; it is where things landed. Nothing is
      blocked on the answer, so this is a question and no longer a BLOCKER.

**The bean is not closed**, because one box is a decision only the owner can
make. It is no longer `high`/blocking: what it blocked has already happened.

## Not a naming quibble

`instanceRoots` is keyed on the declared NAME. Two spellings is not two
labels for one thing — it is two instances as far as every declaration-driven
consumer is concerned, which is how the stub won last time.
