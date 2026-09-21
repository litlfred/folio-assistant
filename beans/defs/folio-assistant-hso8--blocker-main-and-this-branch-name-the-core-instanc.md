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
`bootstrap/` here, `bootstrap/` on main, with `CAT_BOOTSTRAP_NS` and a
`bootstrap` theme id to match. Main is consolidating on a `cat-` prefix
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
- [ ] `bootstrap` vs `bootstrap` is settled in the same breath; it is the
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

---

*2026-09-21, session_017MEZnJxx7WeekiNCabx4hx — **reached the same verdict
independently, from the other end.** The section above works forward from the
declarations and `cjtm`'s ruling; the one below works backward from #477
having merged. Two sessions, two routes, one answer — kept side by side
rather than deduplicated, because agreement reached twice by different
evidence is worth more than either half.*


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
instance. Today `cat-harness` and `bootstrap` carry it and
`folio-assistant-core` does not. That is a naming question with nothing
waiting on it, so it belongs in whatever bean owns the prefix convention
rather than in a blocker. **Not swept, not assumed either way** — the last
thing this instance needs is a third rename of a published IRI in two days.

## Done when

- [x] The owner names the core instance, ONCE — done 2026-09-20, and
      `folio-assistant-core/` is what is on `main`
- [x] Whichever loses is renamed — done in #477, which merged

## REOPENED FINDING, 2026-09-21: one path reference DID resolve to nothing

This bean was closed with *"No `harness.json` declares the dead name as a
directory, and no path reference resolves to nothing. Checked."* That sweep
looked at DIRECTORY and PATH references. The dead name also survived as a
**live keyed lookup**, which is neither, and it cost the instance its face:

    avatarFor("folio-assistant-core")  ->  GENERIC   (the question mark)
    avatarFor("folio-assist-core")     ->  the leaf of paper, unreachable

`harness-tiles.ts:223` calls `avatarFor(decl.name)` — the DECLARED INSTANCE
NAME — so `folio-assistant-core` rendered *"no avatar is declared for this"*
while its own hand-drawn art sat in `AVATARS` under a spelling nothing
carries. **A key nobody can reach is worse than a missing one**:
`check-avatar-coverage` counted it as declared, so coverage read clean over
it — which is also why the closing sweep did not see it.

The comment beside the entry had gone stale the same way (*"the split has not
happened, so `bootstrap` and `folio-assist-core` exist … as nothing in
`harness.json`"* — both files exist and both declare a `name`), and the test
asserting it repeated the claim verbatim. One stale premise, load-bearing in
three places.

**The landing card id is UNTOUCHED.** This bean is explicit that
`folio-assist-core` is deliberate there — a published identifier does not move
with a directory, and `8xtj` records the cost of sweeping every spelling at
once. The avatar key is a different string answering a different question:
`avatarFor` is keyed on the DECLARED NAME. `landing-sticky.test.ts` still
passes.

Fixed in PR #677 (issue #676), with a test that states the PROPERTY rather
than a spelling — every instance-keyed avatar must match a real declared name
— so the next drift fails instead of rendering a question mark.

**Left completed**, because the blocker this bean is about really is settled;
this is a missed leftover recorded where the next reader will find it, not a
reason to reopen.

## THE PREFIX QUESTION WAS ALREADY ANSWERED, 2026-09-21

This bean's last genuinely-open item asked whether the `cat-` prefix extends
to the core instance, and said it *"belongs in whatever bean owns the prefix
convention"*. It needed no new ruling: **the owner had already given one, and
it is recorded in `cat-harness.config.json`'s own `_comment`**:

> the owner ruled that the `cat-` prefix reaches the harness layer and stops
> before `folio-assistant-*`

So the answer for `folio-assistant-core` is **no** — it is `folio-assistant-*`,
and the prefix stops before it.

**The trunk already matches the ruling**, measured across all thirteen declared
instances on main:

| carries `cat-` | does not |
|---|---|
| `bootstrap`, `bootstrap-tools`, `cat-harness` | `agent-skills`, `detangle`, `folio-assistant`, `folio-assistant-core`, `folio-assistant-sci`, `kg-navigation`, `large-datasets`, `smart-trust`, `who-iris`, `who-style-guide` |

Three carry it and all three are the harness layer; ten do not, and none of
them is. There is nothing to rename and nothing to decide.

**Provenance, stated rather than glossed:** the ruling reaches us as a dated
quotation inside a declaration's `_comment`, written by an agent, not as a
message from the owner in this bean. That is the same class of evidence this
bean's own closure rested on, and it agrees with the independently measured
state of all thirteen instances — but it is a record of a ruling, not the
ruling itself. If the owner remembers it differently, the file is wrong and
this note is wrong with it.

Left completed. This closes the loop rather than reopening it.

