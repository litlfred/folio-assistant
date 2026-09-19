---
# folio-assistant-4kiw
title: platform-boundary-guard is at its 200-line injection budget, so a 14th entry evicts three TRAPs
status: in-progress
type: bug
priority: normal
created_at: 2026-09-19T09:29:50Z
updated_at: 2026-09-19T10:20:53Z
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

- [x] `agent-memory:check` fails when a real memory ENTRY falls past the
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

## CORRECTION, 2026-09-19 — the premise above overstates the gap

Checked before starting the fix, and the section "Why `agent-memory:check`
did not catch it" draws the wrong conclusion.

`scripts/tests/agent-memory.test.ts` already carries a LIVE assertion —
"this repo's own generated files are whole" — asserting `overflowEntries`
is empty for every agent. Re-created the 60-line probe and ran the suite:

    (fail) the budget check sees a TRUNCATED entry, not just a late heading
           > this repo's own generated files are whole
     22 pass, 3 fail

So `bun test` DOES catch a dropped entry, and it runs in the same
`Code-quality gates` job as `agent-memory:check`. **A TRAP could not have
silently dropped in CI.** The true statement is narrower: the command named
`:check` does not fail its own check, and what a contributor sees is an
assertion diff rather than a message saying what to do.

**Severity revised: ergonomics and defence in depth, not a hole.** Priority
dropped from high to normal. The remaining boxes stand on their own merits.

The methodological error is the reusable part: I inferred "nothing catches
this" from one command exiting 0, without running the suite against the
failing state. Same shape as the trap this bean's sibling records — asserting
something the machine never checked.

_2026-09-19T10:20:53Z_ — Cross-link from oe8l (PR #392): skills/folio-core/placement.md now carries, as a procedure, what five of platform-boundary-guard's entries carry as prose - the shape of every defect, adapter-vs-profile, compose-nothing-resolve-everything, the README generator, and could-not-determine as a third state. That is a trimming opportunity for the second 'Done when' box, and the cheapest kind: those entries can shrink to a summary plus a pointer at the skill without losing anything, because AGENTS.md already says the skill governs and the memory entry summarises. I did NOT do it in #392 - editing the nodes changes what gets truncated, and mixing a memory-budget change into a skill PR is the scope creep the skill itself argues against. Leaving it to whoever holds this bean.
