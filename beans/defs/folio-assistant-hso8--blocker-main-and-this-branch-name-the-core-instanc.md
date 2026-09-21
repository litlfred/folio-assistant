---
# folio-assistant-hso8
title: 'BLOCKER: main and this branch name the core instance differently — folio-assist-core vs folio-assistant-core'
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

---

*2026-09-21, session_01AYHimvYMmf8h8e9fFN6dW5 — **this blocker now gates more
than it did, and `cjtm` may already answer it.***

The owner ruled REPLACE on `b5f0` (one `<name>.config.json` per instantiation
root) and widened it to the `folio-assistant-*` instances. **The filename
derives from the declared `name`**, so those two cannot be migrated until this
bean is answered — `folio-assist-core` on main against `folio-assistant-core`
on disk and on the branch. One spelling, two files, two instances to every
declaration-driven reader.

Worth checking before asking again: `cjtm` records a ruling — *"cat- prefix
does not extend to folio-assistant-\*"* — and states it settled this live merge
conflict, naming `folio-assistant-core`. If that is the answer, this bean is
blocked on nothing and says so; if it is not, the two beans disagree and that
is the thing to put to the owner.

**Not edited here** — a sibling's bean.

### Re-derived the same day: **the blocker is VOID**

The note above said `cjtm` *may* already answer this. It does better than that
— the declarations themselves agree, on both refs:

```
$ grep -o '"name": "[^"]*"' folio-assistant-core/harness.json | head -1
"name": "folio-assistant-core"
$ git show origin/main:folio-assistant-core/harness.json | grep -o '"name": "[^"]*"' | head -1
"name": "folio-assistant-core"
```

This bean's title asserts *"main and this branch name the core instance
differently — folio-assist-core vs folio-assistant-core"*. **Neither side says
`folio-assist-core` any more.** `folio-assistant-core/harness.json`'s own
`_comment` records the owner's ruling — *"use folio-assistant-core/"*,
2026-09-20 — and states that the directory and the declared name are both
spelled out in full, after exactly this contradiction was found and corrected.

So nothing downstream waits on this. The `folio-assistant-*` half of the
REPLACE ruling (`b5f0`, 2026-09-21) can proceed: the filename derives from the
declared `name`, and the declared name is settled at `folio-assistant-core`.

**Not closed, and not tagged `ready-to-close`.** That tag is for a bean a
session judged finished but *could not re-derive*; this one re-derives in two
commands, which is the evidence `bean-coordination` asks for rather than a
reason to park it. Closing a sibling's bean remains the collision `bbbl`
names and the owner has not ruled on it — so the evidence is recorded here and
the close stays theirs.

What is left on this bean, if anything, is the residue its owner can see and I
cannot: whether any *reader* still keys on the short spelling. `8xtj` tracks
that residue and says a sweep must not touch it blindly.
