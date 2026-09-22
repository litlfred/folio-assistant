---
# folio-assistant-itka
title: 'check:bean-parents asserts two rules it cannot reach: roots are filtered out before the epic-under-epic test, and task->feature is refused while beans prime declares feature a tier'
status: completed
type: task
priority: normal
created_at: 2026-09-21T21:59:36Z
updated_at: 2026-09-22T15:17:51Z
parent: folio-assistant-1xhc
---

Found 2026-09-21 by tripping it: a new epic was parented to another epic, and
`check:bean-parents` printed *"✓ every open bean is placed under an epic or a
milestone, **and no epic hangs from another**"* over it.

## Finding 1 — the epic-under-epic rule is structurally unreachable

The rule exists, at `check-bean-parents.ts`:

```ts
} else if (b.type === "epic" && p.type === "epic") {
```

The set it runs over does not:

```ts
const open = beans.filter((b) => OPEN_STATUSES.has(b.status) && !ROOT_TYPES.has(b.type ?? ""));
```

`ROOT_TYPES` is `{milestone, epic}`, so **no `b` in the loop is ever an epic**
and the branch cannot be taken. The summary line asserts the rule as verified.

The exclusion's intent is right and is documented on the constant — a root is
not *required* to carry a parent. It is applied one scope too wide: it should
excuse a root from the **has-a-parent** rule only, not remove it from the rules
about the parent it does have.

Measured across the whole store, all statuses: **2** epics hang from an epic —
`d308 -> zzmr`, and the one that found this, since re-homed as a root. So the
fix surfaces exactly one outstanding defect, which belongs to `d308`'s owner,
not to whoever runs the check. `check:bean-bodies` and `check:bean-front-matter`
already carry the "no NEW defect / outstanding is the owner's" shape to copy.

## Finding 2 — a decision, not a defect

`PARENT_TYPES` is `{milestone, epic}`, so a task parented to a **feature** is
refused. `beans prime` states this store's hierarchy as
`milestone -> epic -> feature -> task/bug`, which makes `feature` a tier that
may hold tasks. The check's own header quotes that same hierarchy to justify
`ROOT_TYPES`, so it cites the sentence and then contradicts it.

Two readings, and they are not equivalent:

- `feature` is a real tier — then `PARENT_TYPES` is missing it, and features
  holding tasks are being pushed up into epics to satisfy a check.
- `feature` is a label rather than a tier — then `beans prime`'s hierarchy
  sentence is wrong and the store has three levels, not four.

**Not settled here.** Which one is true changes where existing beans belong, so
it is the owner's call rather than a checker's.

## Done when

- [x] The root exclusion is narrowed to the has-a-parent rule; the
      epic-under-epic branch is reachable
- [x] Falsified: an epic parented to an epic turns it red, and did not before
- [x] `d308` is reported as **outstanding** for its owner, not failed on
- [x] Finding 2 is put to the owner as a question and its answer recorded here
      before `PARENT_TYPES` is touched — **asked with the numbers, answered
      2026-09-22: a feature IS a tier**. See the ruling below.

---

## Finding 1 shipped 2026-09-22 — #941, PR #942, merged `fc36f70429`

The rule is reachable. The root exclusion now lives on the has-a-parent
branch alone; `open` still counts what sits below the roots, so no historical
reading of this report changes meaning. `d308 -> zzmr` is recorded in
`cat-harness/scripts/bean-parents-baseline.json` — listed, never failed, and
the file can only shrink because an entry nothing matches is reported stale
and does fail.

Falsified five ways, each restored. The one worth keeping: restoring the old
filter with a live epic-under-epic present makes the check print
*"✓ … and no epic hangs from another"* verbatim. Recorded honestly — that run
also exits 1, but from the NEW stale-detection rather than from the rule, so
the evidence is the line and not the status.

**This bean's own count was stale**: it says 2 epics hang from an epic and the
store holds 1. The other was re-homed as a root after this was written.

## Finding 2 MEASURED 2026-09-22, and it is still the owner's call

The question was *"is `feature` a tier that may hold tasks, or a label?"*
Nobody had said what it would cost to answer either way. Measured across the
whole store, all statuses:

| | |
|---|---|
| beans typed `feature` | **51** (25 open) |
| beans parented to a feature | **2**, and **0 of them open** |
| open `feature` beans' own parents | 25 of 25 are epics |

**So the check refuses nothing today.** `PARENT_TYPES` omitting `feature` has
no live victim: not one open bean hangs from a feature, and every open feature
hangs from an epic. The corpus behaves as three tiers
(`milestone -> epic -> everything else`) while `beans prime` states four.

That does not settle it — a rule with no current victim still decides what is
allowed NEXT — but it removes the cost argument from both sides, which is what
made this unanswerable before. Put to the owner with these numbers rather than
as an abstract choice.

## OWNER'S RULING, 2026-09-22 — `feature` is a real tier

Asked with the measurement rather than as an abstract choice, and answered:
**a feature may hold tasks.** `PARENT_TYPES` becomes
`{milestone, epic, feature}`, matching the hierarchy `beans prime` has stated
all along — so the check stops citing that sentence and contradicting it.

Nothing needed re-parenting: the omission had no live victim. What it decided
was what is allowed next, and the answer is the documented four tiers.

### The ruling opened a hole, and it is closed in the same change

Widening `PARENT_TYPES` makes `epic -> feature` pass the type check. The epic
rule read `p.type === "epic"` — testing ONE forbidden parent out of the set
rather than requiring the right one — so the two together would have allowed
**a goal's child to hang off one of its own grandchildren**. The hierarchy
inverted, by a one-word addition, with no test failing.

Stated positively now: `p.type !== "milestone"`. A requirement cannot be
holed by a later addition to a set the way a negation can.

**Falsified, and the second case is the one worth keeping:**

| injected | result |
|---|---|
| `PARENT_TYPES` reverted | 2 fail — the feature-tier tests |
| epic rule reverted to the negation, `feature` KEPT | **1 fail — the inversion guard, by name** |
| restored | 18 pass |

### Two smaller things fixed while in there

**The summary line named the wrong shape twice over.** It said *"every open
bean is placed under an epic or a milestone, and no epic hangs from another"*
— parents may be features now, and the epic rule requires a milestone rather
than merely forbidding an epic. A summary describing a rule the code no longer
has is this bean's own defect one layer up.

**"is a epic".** The message built an article into a template. It reports
`` has type `epic` `` instead, so there is no article to get wrong.

---

## Finding 2 is NOT finished by #953 — two deltas, both reproducible on `main`

_Stream 1/3 (`upgd`), 2026-09-22, on `main` at `b7f8945b`._ The consolidation
claim listed this PR as *"verify superseded by #953, then close"*. Verified by
reading both diffs and by probing the merged code — **and the premise is
false.** Both PRs implement the owner's ruling; they close the hole that
widening `PARENT_TYPES` opens **differently**, and #953's closure is narrower
in two ways that are live right now.

### Delta 1 — a `feature` nested in a `feature` passes

#953's epic rule is the positive form, `b.type === "epic" && p.type !==
"milestone"`. Stated positively is right and it is kept. But its guard is
`b.type === "epic"`, so it reaches **epics only**. §"The widening was not one
entry in a Set" named *two* inversions; #953 closes one.

Probed against merged `main` with a five-bean fixture — `m1` <- `e1` <- `f1`
<- `f2`, plus a legal `t1`:

    problems: []
    flagged f2 (feature-under-feature)? false

With `RANK` restored on top of #953:

    f2: a `feature` hangs below a `feature` in `milestone -> epic -> feature
    -> task/bug`, so `f1` cannot be its parent

### Delta 2 — the summary asserts a universal the next line refutes

#953 fixed the summary's WORDING and not its QUANTIFIER. `d308` is baselined,
so `bun run check:bean-parents` on `main` prints, verbatim, in two adjacent
lines:

    ✓ every open bean hangs from a milestone, epic or feature, and every epic from a milestone
    · outstanding (baselined): folio-assistant-d308 (...): an epic's parent is a `milestone` (a goal) — `folio-assistant-zzmr` has type `epic`

That is the defect this bean was opened FOR, surviving inside its own repair.
The fix keeps #953's wording and quantifies it: **"every NEW epic"** whenever
the baseline is non-empty, with the outstanding count named, because the check
does still guarantee that the count cannot grow and dropping the claim would
understate it as badly as the universal overstates it.

### A third, smaller one

`main`'s `parent-type` message still reads *"not an epic or a milestone"*
after `feature` became a legal parent.

### What this branch now is

`main` merged in; #953's implementation kept as canonical wherever the two
overlap. What remains is the delta above — `RANK` and its direction rule, the
baseline-aware summary, the message fix, and the tests — plus the escape hatch
that keeps `epic-under-epic` falling through to its own branch so `d308`'s
baseline key survives and the file shrinks only for the right reason.
