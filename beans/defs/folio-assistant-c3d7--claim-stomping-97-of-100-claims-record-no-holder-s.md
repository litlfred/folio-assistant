---
# folio-assistant-c3d7
title: 'CLAIM STOMPING: 97 of 100 claims record no holder, so beans:claim reports ''✓ claimed'' for work a sibling is doing'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-25T16:08:51Z
updated_at: 2026-09-25T16:25:31Z
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

- [ ] every document that tells an agent how to CLAIM names `bun run beans:claim`;
      `beans update` stays documented for the transitions that are not claims
      (close, `--body-append`, `--blocked-by`)
- [ ] `AGENTS.md`'s claim line no longer exits 1 — measured, `beans <id> --status`
      returns `unknown command`
- [ ] `in-progress` with **no recorded holder** is its own outcome, reported and
      non-zero, never `✓ claimed`
- [ ] `--dry-run` never prints a sentence in the past tense about a push that did
      not happen
- [ ] a mutation over each new branch is caught by a NAMED test

## Not in scope

Releasing or expiring the 97 existing claims. That is a work-plan decision for
the owner (raised 2026-09-25), and this bean only stops the store getting
further out of step. Nothing here closes, reopens or re-statuses a sibling's
bean.
