---
# folio-assistant-c3d7
title: 'CLAIM STOMPING: 97 of 100 claims record no holder, so beans:claim reports ''✓ claimed'' for work a sibling is doing'
status: completed
type: bug
priority: normal
created_at: 2026-09-25T16:08:51Z
updated_at: 2026-09-26T03:53:36Z
parent: folio-assistant-ahvw
---

Found while acting on the owner's decision (2026-09-25) to *"add the
re-read-before-claim rule"*. **The rule is already implemented** — `35nj` built
`bun run beans:claim`, which reads the default branch first and has an
`already-claimed` outcome that refuses and names the holder. This bean is the
hole that makes it vacuous for almost the whole store.

## Measured 2026-09-25, on `origin/main`

| | |
|---|---|
| non-epic beans `in-progress` | **100** |
| ...recording a `Claimed by <branch>` note | **3** |
| ...recording none | **97** |

`beans:claim --dry-run folio-assistant-6lb8` — a bean a sibling holds
`in-progress` — prints:

```
✓ claimed folio-assistant-6lb8 on the default branch — every session can see it now
```

Nothing was pushed, and nobody was warned. That is the answer for **97 of the
100** claims currently in the store.

## Why, and my first guess was wrong

I assumed the tool reads a note it never writes. **It does write it** —
`claim-bean.ts:251` calls `noteBean(..., "Claimed by ${branch} — ...")`. Re-read
before asserting.

The real cause is a documentation split, which makes the docs the load-bearing
fix rather than the code:

| document | what it tells an agent to claim with |
|---|---|
| `bean-coordination.md` §100 | `bun run beans:claim <id>` — correct |
| `todo-manager.md:121`, `:415` | `beans update <id> --status in-progress` |
| `session-intent.md:111`, `:132` | `beans update <id> --status in-progress` |
| `AGENTS.md:218` | `beans <id> --status in-progress` — and this one **exits 1** |

`todo-manager.md` and `session-intent.md` are the two skills an agent reads when
STARTING work, so they are the ones that decide how a claim actually gets made.
A claim made their way writes no holder note, and is therefore invisible to the
`already-claimed` check that exists to protect it.

## The code half is a third state, not a pass

`claim-bean.ts:233-236` folds two genuinely different cases into `pushed`:

```ts
// Ours already, or already in-progress with no holder recorded and we are
// the one asking: idempotent, nothing to push.
if (onBranch.status === "in-progress" && (onBranch.heldBy === branch || onBranch.heldBy === undefined)) {
```

- `heldBy === branch` — **ours**. Idempotent, and `pushed` is right.
- `heldBy === undefined` — **nobody recorded a holder**. That is not "ours"; it
  is *could not determine who holds it*, and rendering it as `✓ claimed … every
  session can see it now` is could-not-determine wearing the costume of a
  determined answer — the failure this repository names in `xom7`, `6xaz`,
  `oisv` and in `claim-bean.ts`'s own `absent` comment twelve lines above.

Fixing the docs does not remove this case: the 97 legacy claims keep producing
it, and so does any hand-edited bean.

## Done when

- [x] every document that tells an agent how to CLAIM names `bun run beans:claim`;
      `beans update` stays documented for the transitions that are not claims
      (close, `--body-append`, `--blocked-by`)
- [x] `AGENTS.md`'s claim line no longer exits 1 — measured, `beans <id> --status`
      returns `unknown command`
- [x] `in-progress` with **no recorded holder** is its own outcome, reported and
      non-zero, never `✓ claimed`
- [x] `--dry-run` never prints a sentence in the past tense about a push that did
      not happen
- [x] a mutation over each new branch is caught by a NAMED test

## Not in scope

Releasing or expiring the 97 existing claims. That is a work-plan decision for
the owner (raised 2026-09-25), and this bean only stops the store getting
further out of step. Nothing here closes, reopens or re-statuses a sibling's
bean.

---

## Summary of Changes — re-derived and closed 2026-09-26

Shipped in [PR #1350](https://github.com/litlfred/folio-assistant/pull/1350),
merged. **This bean was itself caught by `bun run beans:landed` as an orphan** —
named in a merged PR title with 0 of 5 boxes ticked — which is the `4d22` shape
it exists to prevent, produced by the session that wrote it. Recorded rather
than quietly corrected.

Every box below re-run against merged `main`, not ticked from memory:

| box | how it was re-derived |
|---|---|
| all claim docs name `beans:claim` | `beans:claim` in AGENTS.md (2), todo-manager (4), session-intent (3), bean-coordination (3). The two remaining `beans update … in-progress` hits are the explanatory *"not this"* text, checked by reading them |
| AGENTS.md's claim line no longer exits 1 | line 218 is `bun run beans:claim <id>`; the bare `beans <id> --status` still exits **1**, run just now |
| no-holder is its own non-zero outcome | `claim-bean.ts:258` returns `held-unknown`, `:403` maps it to exit **4** |
| `--dry-run` never claims a push in the past tense | the success sentence occurs twice: `:351` is the legitimate `pushed` message, `:242` is a COMMENT describing the old bug. Verified by reading both, not by the count |
| a mutation over each new branch is caught by a NAMED test | 15 pass in `claim-bean.test.ts`; 6 of 6 mutations caught, each by a named test |

**End-to-end, against the real store.** `bun run beans:claim folio-assistant-6lb8
--dry-run` — a bean a sibling holds:

```
✗ folio-assistant-6lb8 is already in-progress on the default branch, and NOBODY
  RECORDED A HOLDER — so this cannot tell a sibling working it right now from a
  claim somebody abandoned. NOT claimed, and nothing was written.
error: script "beans:claim" exited with code 4
```

The same command on 2026-09-25 printed `✓ claimed folio-assistant-6lb8 on the
default branch — every session can see it now`, having pushed nothing.

The 97 existing unattributed claims are **untouched**, per the owner's decision
of 2026-09-25 to leave them and revisit: there is no basis for a staleness
cutoff, and `held-unknown` now makes each one visible at the moment somebody
tries to claim it, which is when it matters.

## A second shape, measured 2026-09-26 — the claim store is not where the collision happens

Added at the owner's request after a session hit this **nine times in one
window**. It belongs here because it is the same failure one level out, and it
matters because **fixing `beans:claim` would have prevented none of the nine.**

`beans:claim` guards *"is a sibling working this BEAN"*. Six of the nine
collisions never went near a bean:

| # | what was duplicated | how it was announced |
|---|---|---|
| 1 | `bm6d` | already merged as #552 |
| 2 | `85im` | open as #563, with a better implementation |
| 3 | the #1344 sidecar fix | #1353 |
| 4 | a six-skill manifest + artefact fix | #1376, opened **one minute earlier** |
| 5 | the bean sweep | 3 of 6 already done by a sibling |
| 6 | claim expiry | shipped in `omki` |
| 7–8 | two more, same window | open PRs |
| 9 | the 25 `UNCATALOGED` entries | **#1364 — whose title names beans `k59d` / `tuvg` and gives no sign it carried the fix** |

**#9 is the one that defeats every remedy this bean proposes.** The work was
announced only as a diff inside a PR about something else. A subject search over
open PRs cannot see it; a bean claim cannot see it; the PR list was read before
building and still did not show it. It then compounded: the entries were merged
on the owner's instruction and **reverted forty minutes later on the owner's
instruction** (#1384), because a third and fourth session held the opposite
decision under bean `ngxj` and none of the three could see the others' open
question. The owner answered both truthfully; the answers contradicted because
each was asked alone, with seven sessions running.

So the state that needs publishing is not only "who holds this bean" but **"what
is this session about to change, and what has it asked the owner"** — the second
being the one with no store at all. `tuvg` carries the open item for it.

**Not proposing a mechanism here.** This bean's subject is the claim store and
its four `Done when` boxes are sound; widening it to cross-session question
visibility would give it two subjects, which is the shape `sa8y` paid for with
three disagreeing `Done when` lists. Recorded as evidence that the claim store
is necessary and **not sufficient**.
