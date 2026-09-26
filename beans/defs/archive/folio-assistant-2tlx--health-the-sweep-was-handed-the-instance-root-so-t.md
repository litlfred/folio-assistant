---
# folio-assistant-2tlx
title: 'HEALTH: the sweep was handed the instance root, so two checks went blind at #437'
status: completed
type: bug
created_at: 2026-09-20T06:55:03Z
updated_at: 2026-09-20T06:55:03Z
parent: folio-assistant-1xhc
---


Found 2026-09-20 while doing a cleanup sweep at the owner's request.

## What broke

`test/health/run.ts` passed `ROOT` — the INSTANCE root, since the file sits
at `<instance>/test/health/` — into a context field named `repoRoot`. Two
probes resolve their store from a declaration whose entry is
`scope: "repository"`, so `beans/` and `todos/` live at the repository root:

```
could not read the bean store at .../cat-harness/beans/defs
could not read the todo store at .../cat-harness/todos/items
```

Broken since #437 moved the instance under `cat-harness/`.

## The three-state rule worked, and was not enough

The sweep reported **"could not be evaluated. Treat this as unknown, not as
clean"** and exited non-zero — it did NOT report an empty store as healthy,
which is the `dh4f` shape those rules exist to prevent. That is the design
working.

But a check that cannot see its subject is not doing the job either. Blind,
it hid:

| | |
|---|---|
| staging previews | **11, totalling 449.4 MB** — over the 100 MB warning point (major) |
| orphaned previews | **3**, ~119 MB, no open PR for any |
| beans | **215** completed or scrapped, still inline in `beans/defs/` |

None of that was visible for the six hours between #437 and this fix.

## The fix

One line — `repoRootFor(ROOT)`, the helper #437 itself added for exactly this
question. Every other consumer runs `git(repoRoot, …)`, which resolves the
repository from any directory inside it, so the true root is correct for them
rather than merely tolerated.

Guarded by a test asserting the real tree, not a fixture: the defect was that
a real path stopped existing, and a fixture would have passed throughout.

## Not doing

Acting on the three findings. `bun run health` **reports and never acts** —
every finding's action names something a person does, and `plj1` is the
recorded case of a workflow that deleted every open PR's preview without
anybody deciding it. Put to the owner instead.
