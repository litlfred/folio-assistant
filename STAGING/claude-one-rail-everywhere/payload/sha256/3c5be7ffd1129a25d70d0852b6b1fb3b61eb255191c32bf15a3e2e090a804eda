---
# folio-assistant-sp0e
$schema: bean/1.0.0
title: 'state:push commits an empty mount as a deletion'
status: todo
type: bug
priority: high
created_at: 2026-10-15T17:59:55Z
updated_at: 2026-10-15T17:59:55Z
---
## What happened (2026-10-15, measured)

An agent cleared and remounted the instance directories in an index worktree
(`mount-from-lock.sh`) and then ran `bun run cat state:push` to push one bean
edit. The instance remount had replaced every mounted state graph under an
instance (`<instance>/health`, `<instance>/test/health/results`,
`cat-harness-tools/beans/marks`) with nothing, and `state:push` committed those
empty directories to five branches at 17:49Z:

| branch | emptied commit | restored by |
|---|---|---|
| cat-harness-tools `cat/cat-harness-tools/health` | 2fba7961c0cb | 2e833c8dfac3 |
| cat-harness `cat/cat-harness/health` | 294128d08c45 | e35a4fbd1307 |
| folio-assistant-core `cat/folio-assistant-core/health` | 6d786ccf1371 | 32d77ae3530c |
| who-iris `cat/who-iris/health` | d2c55d0061cd | b54727d11db5 |
| cat-harness-tools `cat/cat-harness-tools/marks` | 21f15c478184 | 7f04e6b9c0db |

Each restore is a fast-forward commit carrying the previous tree; no history
was rewritten. The next docs-site publish (run 38780347504) failed at
`state:mount` because the graph's path was no longer on its branch, and
opened issue #2574.

## The defect

`state:push` cannot tell "this graph was not mounted" from "every file in it
was deleted". A whole-graph deletion is pushed like any edit.

## Done when

`state:push` refuses to push a graph whose mounted tree is empty (or lacks
the graph's declared path) while its branch tip holds files, unless an
explicit flag says the deletion is meant; with a test that reproduces the
remount-then-push sequence.
