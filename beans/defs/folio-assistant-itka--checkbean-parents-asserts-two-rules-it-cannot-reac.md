---
# folio-assistant-itka
title: 'check:bean-parents asserts two rules it cannot reach: roots are filtered out before the epic-under-epic test, and task->feature is refused while beans prime declares feature a tier'
status: todo
type: task
priority: normal
parent: folio-assistant-1xhc
created_at: 2026-09-21T21:59:36Z
updated_at: 2026-09-21T21:59:36Z
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

- [ ] The root exclusion is narrowed to the has-a-parent rule; the
      epic-under-epic branch is reachable
- [ ] Falsified: an epic parented to an epic turns it red, and did not before
- [ ] `d308` is reported as **outstanding** for its owner, not failed on
- [ ] Finding 2 is put to the owner as a question and its answer recorded here
      before `PARENT_TYPES` is touched
