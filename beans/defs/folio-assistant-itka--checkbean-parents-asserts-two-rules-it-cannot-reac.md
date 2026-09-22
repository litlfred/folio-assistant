---
# folio-assistant-itka
title: 'check:bean-parents asserts two rules it cannot reach: roots are filtered out before the epic-under-epic test, and task->feature is refused while beans prime declares feature a tier'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T21:59:36Z
updated_at: 2026-09-22T10:56:22Z
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
      epic-under-epic branch is reachable. The loop now runs over EVERY open
      bean and roots `continue` only on the missing-parent case
- [x] Falsified: an epic parented to an epic turns it red, and did not before.
      Restoring the old one-line filter turns **4** of the 12 new tests red —
      the epic-under-epic case plus the two dangling/wrong-type cases that also
      never reached a root — and restoring the fix turns them green
- [x] `d308` is reported as **outstanding** for its owner, not failed on.
      `bean-parents-baseline.json` carries the single pair; a NEW one fails, and
      a **stale** entry fails too, so the file can only shrink (verified by
      adding a bogus entry and watching it exit 1)
- [ ] Finding 2 is put to the owner as a question and its answer recorded here
      before `PARENT_TYPES` is touched

## Finding 1 — fixed 2026-09-22

**The branch was provably dead, and the summary asserted it.** Measured before
touching anything: **0 epics** among the **179** open beans the loop ran over,
because `ROOT_TYPES` was applied to the whole filter rather than to the
has-a-parent rule alone.

The fix is the scope, not the rule. The loop now runs over every open bean;
a root `continue`s only on the missing-parent case, and the three rules about
the parent a bean **actually declares** — exists, right type, not an epic under
an epic — reach roots like everything else.

**That turned out to matter for more than the one branch.** Narrowing the scope
also made two other rules reachable for roots, which the bean had not noticed:
an epic with a **dangling** parent, and an epic parented to a **task**. Both now
have tests. Neither has a live instance today, so the fix surfaces nothing new
there — but they were as unreachable as the branch this bean was opened for.

**What it surfaces: exactly one pair,** `d308 -> zzmr`, which is what the bean
predicted. Baselined rather than fixed: re-homing it moves somebody else's work
in the roadmap, and `bean-coordination` is explicit that an outstanding defect
is the bean **owner's** to repair.

**The summary line was the last trap.** With the baseline in place the check
went green while still printing *"no epic hangs from another"* over a known
pair — reproducing this bean's own defect one line further down. It now reads
*"no **NEW** epic hangs from another"* whenever the baseline is non-empty, and
lists each outstanding pair **whether or not anything failed**: a backlog that
only prints on a red run is invisible on exactly the days somebody would act on
it.

`bun run gates` — 122 of 122. 12 new tests.

## Finding 2 — still the owner's, and still not touched

`PARENT_TYPES` is unchanged. Whether `feature` is a real tier or a label
changes where existing beans belong, and a checker does not get to decide that
by being edited.
