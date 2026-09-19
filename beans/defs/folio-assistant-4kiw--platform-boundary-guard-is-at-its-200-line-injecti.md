---
# folio-assistant-4kiw
title: platform-boundary-guard is at its 200-line injection budget, so a 14th entry evicts three TRAPs
status: todo
type: bug
priority: high
created_at: 2026-09-19T09:29:50Z
updated_at: 2026-09-19T09:29:50Z
---

Found 2026-09-19 while adding the memory node for the owner's rule
"dont encode rules against a working setup".

## Measured, this session

```
bun run agent-memory
  ci-health-watcher         8 entries, 154 lines
  platform-boundary-guard  13 entries, 204 lines
      ⚠ 4 line(s) over the harness's 200-line budget, and nothing past it
        is a memory entry — only the hand-written tail
```

So `platform-boundary-guard` is **exactly full**: its last entry ends at the
line the harness truncates at, and the only thing overflowing is the
hand-written `## Session log` tail, which is not injected anyway.

Adding one 70-line entry took it to **259 lines and pushed three TRAPs past
the cutoff** — *the schema cannot catch a profile violation*, *the README
generator that replaced the whole file*, and *three literals worth
recognising in new code*. The harness drops the overflow **silently**, so
the agent would have kept reporting for duty with three fewer traps and
nothing would have said so.

## Why `agent-memory:check` did not catch it

It exits 0. The budget is a **warning**, not a gate — which is correct for
the pre-existing 4-line overflow (a hand-written tail is not injected
knowledge) and wrong for this case (a dropped TRAP is). The check cannot
currently tell the two apart.

**That distinction is the actual fix**, and it is already computed: the
generator's own warning text separates "nothing past it is a memory entry"
from "N MEMORY ENTRY(S) fall past it". The second should fail the build.

## Consequence right now

The new node is tagged to `ci-health-watcher` (154 lines, room to spare)
rather than `platform-boundary-guard`, where it also belongs. The subject
overlap is genuine rather than a flag of convenience — that watcher's three
reporting rules ("could not check" is never green; a stale red is not a live
fire; `superseded` is not green) are all the same rule as "do not assert what
you have not verified". But it *should* reach both, and today it does not.

## Done when

- [ ] `agent-memory:check` fails when a real memory ENTRY falls past the
      budget, and still only warns when the overflow is the hand-written tail
- [ ] `platform-boundary-guard` is back under budget — by splitting, trimming
      or archiving, decided per entry and not by truncating whatever is last
- [ ] `do-not-encode-a-rule-against-a-working-setup` is tagged to
      `platform-boundary-guard` as well, and that reference in its body is
      replaced by the tag

## Not doing now

Trimming existing entries. Every one is somebody's paid-for TRAP, and
choosing which to cut is not a side effect of an unrelated fix — it is the
work this bean exists for.
