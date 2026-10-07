---
# folio-assistant-a4of
title: 'S1 bookkeeping truth: close merged beans, reconcile fnx4 boxes, fold w2gr 3b into 70lx'
status: completed
type: task
priority: high
created_at: 2026-10-01T08:14:33Z
updated_at: 2026-10-06T19:30:00Z
parent: folio-assistant-7x5n
---

G2+G3 of the arc plan.

## Done when
- [x] y5si, ybp4 completed with PR evidence (#1599, #1687)
- [x] ejye, 7dek completed (#1758, #1760); ~~ybwt~~ carried on its own bean, see the 2026-10-06 summary. Its one open box is code work, not bookkeeping
- [x] fnx4 boxes ticked for slices merged in #1721
- [x] w2gr step 3b list recorded on 70lx so the move happens once


## The sweep, measured 2026-10-03

Mechanical pass over every OPEN bean: for each unticked `- [ ]` box, pull the PR
numbers it cites, then ask GitHub which are merged.

    41  distinct PRs cited from unticked boxes
    24  of them are MERGED
    19  open beans hold such a box

**24 merged PRs is not 24 ticks, and that distinction is the useful product of
this sweep.** The boxes fall into three classes that must not be collapsed:

**1. Literally satisfied** — the box text IS "PR merged". Three ticked here, each
with its merge timestamp and merge commit recorded in the box:

    ga6u   #1756 merged   2026-10-02T23:12:43Z  edc167d24a
    ga6u   #1753 merged   2026-10-01T19:34:35Z  b5f83541a4
    n3ni   A4 PR #1768 green  2026-10-01T16:21:51Z  80434b7ec3

The third was nearly a FALSE tick. Its box says *green*, not merged, and #1768's
head carried a failure — so "merged implies green" would have ticked something
untrue. Checking named the red as `cleanup`, which is housekeeping and not a gate
(gates here are suffixed `(hard)` or `(warn-only)`; `cleanup` is skipped on most
runs), so every gate was green. Ticked on that judgement, with the judgement
written into the box so it can be disputed rather than inherited.

**2. A stale assertion, which is worse than an open box.** `b963` read:

    - [ ] The nine occurrences are confirmed repointed on main — #579 is not merged yet

#579 merged 2026-09-20T18:29:35Z (`3a9557b14b`, head clean: 12 runs, 8 success, 4
skipped, 0 failure). The premise was false. CORRECTED and left OPEN: the box has
two clauses and only the second is settled. An open box costs a reader nothing; a
false premise costs them a wrong conclusion.

**3. Mentions only** — the majority, and NOT tickable from merge state. `8ez4`'s
"field shape agreed … proposed on #1764" is not satisfied by #1764 merging; the
agreement is the deliverable. Ticking these would be exactly the false bookkeeping
this bean exists to remove.

### Candidates left for whoever holds them

0mf0 (#1754 — **claimed by `claude/s2-regen-in-ci`, so untouched**; its box reads
"#1754 merged" and #1754 IS merged, making it class 1), 5xfr (#567 — two clauses,
second unverified), 8ez4, bo44, dm4j, eof6, gz47, l4ay, m4s1, nsbb, tbdg, tvf8,
uoob, wczm, xxku.

This bean's own box — "ejye, ybwt, 7dek completed (#1758, #1760)" — is class 1 in
form but names three BEANS as well as two PRs, so it needs their state, not just
the PRs'. Both PRs are merged. Left open deliberately.

## Summary of Changes

Closed 2026-10-06 by claude/sep-bookkeeping-s1-s3, which took the bean: it was `in-progress` with no holder recorded and no open PR. Owner ruling 2026-10-06: "do all the bookkeeping 1-3". PR #2317.

- **`ejye` → completed.** Both falsifiers pass as pinned tests on main, and the whole gate set is green on #2317 head `39e0c3e`.
- **`7dek` → completed.** `render:bpmn:check`, `check:tools` and `skill:register:check` exit 0, and `xies` now names `Process_RenderKgToCdn` as its gate-4 step.
- **`ybwt`: NOT closed, and the box is amended rather than ticked as written.** Its one open box ("no cat-harness file names a moved skill … BPMN refs → PR3/PR6") is substantive code work, not bookkeeping. Its 2026-10-02 note measured 32 harness-BPMN skill refs that cat-harness cannot reach: 29 belong to document-intake (PR6, bean `apcg`) and 3 to ig-ast-delta. That work stays on `ybwt`, blocked by `apcg`. Ticking "ybwt completed" would be exactly the false bookkeeping this bean exists to remove, so the box now says what was done and where the rest went.

Beyond the three named here, this PR's sweep closed on re-run evidence `ga6u` (S3), `0mf0` (S2, with its PR-latency measurement), `58ro`, `z9hh`, `d4m4`, `nf2z`, `tlj9`, `k9mv`, `lvk9`, `zacz`, `4tts`, `a8wy`, `rjug` and `z6xd`. It also listed 108 stale in-progress claims for the owner rather than reassigning them.
