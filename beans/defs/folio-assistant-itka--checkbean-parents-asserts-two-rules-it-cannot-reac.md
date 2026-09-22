---
# folio-assistant-itka
title: 'check:bean-parents asserts two rules it cannot reach: roots are filtered out before the epic-under-epic test, and task->feature is refused while beans prime declares feature a tier'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T21:59:36Z
updated_at: 2026-09-22T11:46:10Z
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
- [ ] Finding 2 is put to the owner as a question and its answer recorded here
      before `PARENT_TYPES` is touched

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
