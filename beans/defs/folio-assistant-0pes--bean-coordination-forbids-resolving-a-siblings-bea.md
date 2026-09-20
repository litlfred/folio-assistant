---
# folio-assistant-0pes
title: bean-coordination forbids resolving a sibling's bean and gives no discharge path, so verified-done beans accumulate
status: todo
type: bug
priority: high
created_at: 2026-09-20T14:31:04Z
updated_at: 2026-09-20T14:31:04Z
parent: folio-assistant-8jt6
---

Found by sweeping every `in-progress` bean against what `main` actually does,
2026-09-20, after `r1lz` turned out to have been finished for a day.

## The measurement

**Six beans carry the same sentence**, verbatim in shape:

> *"Verified resolved, <date> on main at <sha>. … This bean's defect is closed.
> **NOT closing it — not my bean to resolve.**"*

`1dfh`, `ckpe`, `dzl3`, `g4dv`, `lx2s`, `xd1s`. All six are `in-progress`.

And the number that makes it a defect rather than a habit: **zero** beans
carrying that phrase have ever reached `completed`. Not one has been
discharged, ever.

Two were re-verified here INDEPENDENTLY, not read off the note — the notes are
the thing under suspicion:

| bean | its claim | measured |
|---|---|---|
| `dzl3` | playwright runs a `test-server.cjs` that does not exist | `test-server.mjs` exists (2026-09-18), `playwright.config.ts:61` points at it and cites this bean by id, and the 5 `test-server.e2e.ts` specs pass in `gates --all` |
| `ckpe` | `qa-checkers-uses` walks `cone(other, "editorial")` | it calls `g.usesCone(other)` at `qa-checkers-uses.ts:201`, with the reasoning inline at 180–196 |

## Why it happens, and it is the rule rather than the agents

`skills/folio-core/bean-coordination.md` §"Lifecycle of a coordinated work
item" ends: *"Agents create and set `in-progress`; they do not resolve another
session's items."* §"A claim is branch-local" adds: *"An **unclaimed** bean is
fair game for any session; a claimed one is not."*

**Those two sentences do not agree**, and the agents have been following the
stricter one. None of the six carries a claim naming a branch, so by the second
sentence they are fair game; by the first, every agent is "another session" to
every other, so nobody may ever close them. The rule has **no discharge path**:
it names who may not close a bean and never names who may.

The result is the failure the skill itself warns about one paragraph earlier,
arrived at from the opposite direction: *"A bean abandoned silently is
indistinguishable from one nobody started."* A bean **verified done** and left
`in-progress` is indistinguishable from one nobody started too — and it is
worse, because an agent that picks it up re-derives work that is already on
`main`. That cost is not hypothetical: it was paid twice in one session, on
`r1lz` and again on `p67i`'s sibling checks.

## What this is NOT

Not a case for `beans delete` — never, on any bean, for any reason. The whole
question is which *status* a verified-done bean should carry and who may set
it.

## Done when

- [ ] `bean-coordination` says who may close a bean whose work is verifiably
      landed, in a sentence that does not contradict §"A claim is branch-local"
- [ ] the criterion is **evidence**, not authorship: a bean closes on a
      measurement anyone can re-run, not on who happened to open it
- [ ] a bean that is verified-done but NOT closable carries an explicit reason
      and an expiry, like `bean-blocking` already requires of a block — an
      exception that nothing re-derives is this session's recurring defect
- [ ] the six above are discharged, or each says why not
