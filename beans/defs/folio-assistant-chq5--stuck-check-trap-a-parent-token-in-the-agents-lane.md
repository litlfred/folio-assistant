---
# folio-assistant-chq5
title: 'STUCK-CHECK TRAP: a parent token in the agent''s lane, a live position two lanes away — and one instance commits an absolute path'
status: todo
type: task
priority: normal
created_at: 2026-09-21T11:10:26Z
updated_at: 2026-09-21T11:12:15Z
parent: folio-assistant-yj32
---

Found 2026-09-21 while measuring `v49e`'s join. **This bean was written once
with the opposite conclusion and rewritten after a roast.** The wrong version
is kept below as the worked example, because the mistake it made is precisely
the mistake the check this bean asks for would make.

## What is actually true

Two `running` CRDM instances. **Both are waiting on a human, correctly.**

| instance | parent token | LIVE position | lane | last step |
|---|---|---|---|---|
| `crdm--folio-assistant-6lb8` | `Call_Signoff` | `Call_Signoff` → **`BA_Signoff`** | BA / Feature Requestor | 13.4h |
| `crdm--issue-607-kg-to-cdn-portal` | `Call_Needs` | `Call_Needs` → **`S_ConfirmNeeds`** | Stakeholders | 5.0h |

Instance 1's agent finished `A_CreateBeans` and handed off. Instance 2's
`BA_ReviewNeeds` was taken 5h ago, so it is moving — on the human side.

**Nothing is stalled. Nothing is abandoned.** The process is doing exactly what
its diagram says.

## THE FINDING: a stuck-check keyed on the parent token gets this exactly backwards

That is not hypothetical — it is what I did, in full, before the roast:

1. Read the parent's `tokens`: `["Call_Signoff"]`, `["Call_Needs"]`.
2. Read the parent's lanes: both call activities sit in **`Lane_Agent`**.
3. Concluded: *the agent is sitting on an enabled step; this is an agent-side
   stall of 13.6 hours.*

Every step was true. The conclusion was **the opposite of the truth**, because
a call activity's lane says who *invokes* the subprocess, not who holds the
token once inside it. The live position was two lanes away, in
`BA / Feature Requestor` and `Stakeholders`.

> **A "where is this process breaking down" check MUST recurse into `children`.
> The parent token is the name of a door, not a location.**

`v49e` names *"a step enabled but not taken"* as its first interesting state.
On this corpus, the naive reading of that phrase produces a false positive on
**2 of 2** instances — every instance there is.

## And the second-order error, which is about method not BPMN

I established "the subprocess was never entered" from `children` — having
printed it with `json.dumps(ch)[:600]`. The truncation cut after `Call_Issue`.
Instance 1 in fact carries **five** children including a running `Call_Signoff`.

**Concluding absence from truncated output.** The fix is not "be careful"; it
is that a check must assert over parsed structure, never over a rendered
prefix of it.

## Facts worth keeping, all independent of the wrong conclusion

### `updatedAt` and last-step-taken are two different facts

Instance 2: last *parent* history entry 13.6h ago, `updatedAt` **5.0h** ago.
Neither is wrong — the child advanced and the parent was rewritten. A finding
keyed on either alone misreads it, in opposite directions.

### A committed instance carries a MACHINE-SPECIFIC absolute path

| instance | `source` |
|---|---|
| `crdm--folio-assistant-6lb8` | `cat-harness/methodologies/…` — relative |
| `crdm--issue-607-kg-to-cdn-portal` | **`/home/user/folio-assistant/cat-harness/…`** — absolute |

Its children carry it too. `beans/workflows/` is committed **precisely so a
sibling session sees the same position**; an absolute path resolves on one
container and nowhere else, which defeats the reason the graph is committed.
Unrelated to everything above, and the clearest defect here.

### `beanFindings`' premise is timestamped; its conclusion is not

`scripts/beans.ts` documents why two of `v49e`'s three stuck states are
missing: the store *"was **empty** when this was written"*. That is correctly
scoped past tense and is **not** stale — an earlier draft of this bean accused
it of being so, wrongly. What no longer holds is the present-tense sentence
after it: *"their absence is the honest answer rather than an oversight."*
There is data on both sides of the join now.

### The clock trap, already paid for in that same file

> `emit(..., "data")` gates the projection on EXACT CONTENT, so anything
> computed against the clock changes the file on every run and the staleness
> gate fires forever.

So an age must be the **client's** arithmetic over published timestamps, never
a build-time `Date.now()`.

## Done when

- [ ] Any stuck-state check recurses into `children` and reports the LIVE
      position, with the lane that actually holds the token
- [ ] Waiting-on-a-human is a first-class outcome, not a stall — on this corpus
      it is 2 of 2, so a check that cannot say it is useless here
- [ ] `updatedAt` and last-step-taken are reported as two facts
- [ ] Age is the client's arithmetic, never build-time
- [x] `source` is instance-relative in committed state; the absolute path in
      `crdm--issue-607-kg-to-cdn-portal` and its children is repaired, and
      whatever wrote it stops doing so — **done**, see §"FIXED 2026-09-21"

## Not in scope

The `v49e` visualiser. The owner beaned that up explicitly rather than starting
it.

---

## FIXED 2026-09-21 — the absolute path, at the writer and in the data

`relativiseSource(repoRoot, state)` in `src/workflow/store.ts`, applied inside
`saveInstance`.

**Normalised on WRITE, not by a migration** — the same principle `$schema`
already follows two lines above it: *"written on every save rather than only on
create, so a file from before the tag existed gains it the next time it is
touched."* A file carrying an absolute path is repaired by anything that saves
it.

**Recursive, because `children` are instances too.** The corpus had the defect
in three places on one instance — the parent and both children — so a
top-level-only fix would have left two of three, one field deeper where a
reader is less likely to look.

**A path OUTSIDE the repository is left alone.** `relative()` would turn it
into a run of `../`: a path that resolves somewhere, differently on every
machine, and *looks deliberate*. An absolute path at least fails honestly and
says whose checkout it came from. Nothing can make a diagram outside the
repository portable, and pretending otherwise is the worse answer.

### The data, repaired by the fix rather than by hand

Loaded and re-saved every instance through the fixed path:

| instance | outcome |
|---|---|
| `crdm--issue-607-kg-to-cdn-portal` | **REPAIRED** — parent + 2 children |
| `crdm--folio-assistant-6lb8` | unchanged, byte-identical |

`grep -c /home/user beans/workflows/*.json` → **0**. The diff is exactly three
lines, all of them a `source`. The already-correct instance is not in it at
all, which is the blast radius a repair should have.

### Falsified

Reverting `relativiseSource` from `saveInstance`: **3 of the 5 new tests fail**
— absolute-inside-repo, children, and repair-on-write. The other two
(already-relative, outside-repo) stay green, correctly: they assert behaviour
the fix does not provide.

### The checklist stays in ONE place

This section originally ended with a second `## Done when` restating the list
with this item ticked. `check:bean-bodies` failed it as a **shadow checklist**,
and was right to: two lists disagreeing about the same item means the one a
reader consults says not-done while another says done. The canonical list above
is ticked instead, and there is no second copy.

---

## 2026-09-22 — the four open items are CONSTRAINTS ON `v49e`, not work of their own

Re-entered today expecting the `blv9` shape — instance repaired, guard
missing. **Both halves were wrong**, and recording that is the point of this
section:

- The data is clean: no `"/home/`, `"/Users/` or drive-letter path in any
  committed instance.
- The guard exists: `relativiseSource` in `src/workflow/store.ts`, applied
  inside `saveInstance`, recursive into `children`.
- It is tested: five cases via `saveInstance`/`loadInstance` in
  `scripts/tests/workflow-interpreter.test.ts` — absolute-inside-repo,
  children, repair-on-write, already-relative, outside-repo.

An intermediate reading here was that `relativiseSource` **had no test**,
because grepping the helper's name across the repo returns only its own
module. That was wrong and the grep was the wrong instrument: the tests
exercise it through the **public path** that actually writes files, which is
the better test and the reason its name does not appear.

### Why the remaining four boxes cannot be ticked by anyone working on THIS bean

Every one of them constrains a stuck-state check:

- recurse into `children`, report the LIVE position
- waiting-on-a-human is a first-class outcome, not a stall
- `updatedAt` and last-step-taken are two facts
- age is the client's arithmetic, never build-time

**No such check exists.** It is `v49e`'s, and `v49e` is a bean the owner
explicitly asked be written up rather than started (*"do not do this, just
bean up"*). So these are requirements waiting for their subject, and this bean
is a **specification** for work not yet begun — not a queue item anybody can
pick up.

Leaving them unticked is correct. Leaving them *unexplained* is what cost the
re-entry, so the explanation is here rather than in a session log.
