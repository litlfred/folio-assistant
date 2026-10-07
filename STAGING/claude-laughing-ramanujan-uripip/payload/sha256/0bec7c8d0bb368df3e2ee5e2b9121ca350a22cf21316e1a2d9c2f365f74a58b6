---
# folio-assistant-xu0t
title: 'TRAIN ORDER: the three state-branch arcs run beans, then auto-docs, then qa-reports removal — owner''s sequencing, 2026-10-03'
status: todo
type: task
priority: normal
created_at: 2026-10-03T09:39:07Z
updated_at: 2026-10-03T09:54:52Z
parent: folio-assistant-fs43
---

## The owner's ruling, 2026-10-03

> "once bean train, then auto-docs train (see active siblings)"

and, on how step 6 is reached: **"Chain it: 1937, then 1957, then step 6."**

This is a **goal-level sequencing decision by the author**, relayed by the Merge
Manager. It is explicitly **not** an agent-to-agent task lock, which
[`coordinate`](../../cat-harness/skills/sdlc/sdlc-core/coordinate.md) §12
cautions against: *"Tasks are NOT exclusively claimed … Coordination is with the
USER on goal-level decisions, not agent-to-agent on task-level locks."* Two
sessions may still attack the same task by different methods. What is sequenced
is the **landing order on `main`**, not who may work on what.

## Why all three arcs are stuck in the same place

Measured 2026-10-03. Each arc has a publish/mirror half and a removal half, and
in every case the first is done or nearly and the second is gated:

| arc | branch | mirror half | readers moved | removal from `main` |
|---|---|---|---|---|
| **beans** (`fs43`, #1850) | `cat/cat-harness/beans` | **frozen seed** — 1276 files, seeded 2026-10-02T22:31Z from `main@128b2ec4408a`, not moved since; `main` carries **1340** | no | blocked on #1957 |
| **auto-docs** | none yet (#1966 is the proposal) | not started | no | not started |
| **qa-reports** (`3fva`) | `cat/cat-harness/qa-reports` | **live** — CI writes per-PR, 45,085 files, keyed `pr/<n>/<sha>`, last write `pr/1937/1c233f64` | no — #1801 is phase 3 | bean `5hox`, `todo`, gated on the owner, `blocked_by: 7mwa, 2gst, 8wj1` |

**It is one pattern three times, not three problems.**

## Train 1 — beans. Why it cannot be short-circuited

`beans/` cannot simply be deleted from `main`, and the number that settles it:

- **76 TypeScript files** under `cat-harness/` read `beans/`;
- **`.beans.yml` hardcodes `path: beans/defs`** for the **third-party `beans`
  binary**, which `AGENTS.md` already records as one of the two unavoidable
  duplicates *because* the binary is third-party and cannot be redirected.

So the removal must be preceded by a **mount** that puts the branch's files back
at `beans/` in the checkout. That is #1957's `branch-store mount --id <dir-id>`,
whose own PR body states the design goal exactly: *"so a reader finds the
directory where it used to be."*

Order, therefore:

1. **#1937** — `keyedBy: tip` + the tip-keyed store. Head of the train.
2. **#1957** — the generic mount/push keyed by directory id. **Stacked on
   #1937**, and its author wrote: *"I'll mark it ready and bring it level with
   main once #1937 merges."* This is the enabler.
3. **Step 6** — remove `beans/` from `main`. Authorized by the owner, and
   unblocked only once 2 has landed.

In parallel, and on no critical path: refreshing `cat/cat-harness/beans` from
1276 to 1340, which closes the data-loss risk that the stale seed creates. While
it is stale, a removal would leave 64 beans — `o8s9`, `ygga`, `xu0t` and
today's `24fa` update among them — existing only in `main`'s history and not in
the store meant to replace it.

## Train 2 — auto-docs. Why it is second despite being the biggest prize

`docs/` is **44 % of the 704 conflict path-instances** (bean `34cm`), far ahead
of `test/results/` at 34 % and `beans/` at **2 %**. So by conflict volume the
docs arc is worth more than the beans arc by a factor of twenty.

It is nevertheless second, and the reason is sound: its mechanism is less
finished. #1966 is still a **proposal**; #1960, the declared-subgraph-source
mechanism it needs, is clean against `main` but **red on four checks**; #1971 is
an interim pattern declaration that #1966 would supersede. Landing the smaller
arc first proves the mount mechanism on the 2 % before it is pointed at the
44 %.

## What this asks of a sibling session

**Not** "stop working". Two things only, and both are about landing rather than
working:

1. **Hold merges to `main`.** Every tip-move re-conflicts #1937, the train head.
2. **Hold `beans:claim`.** It pushes **straight to `main`** — measured at
   **10 of the last 60 tip-moves**, about one in six (bean `24fa`). A freeze on
   merges is not a freeze on `main` while claims bypass the PR path, and this
   has already happened once during the current freeze: `main` moved
   `1aaa669f998` → `c4036a79af0`, and that commit is a claim.

Carry on with everything else. Push to your own branch freely.

## Done when

- #1937 and #1957 are on `main` and `beans/` is removed from it, with every
  reader resolving through the mount;
- the branch refresh has closed the 1276/1340 gap **before** any removal;
- train 2 starts from a green #1960.

## Not in scope

Whether `beans:claim` should keep pushing to `main` at all — that is `24fa`'s
own open question and this bean does not pre-empt it.
