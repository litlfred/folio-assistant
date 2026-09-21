---
# folio-assistant-fkjo
title: 'A bean can declare itself finished and stay claimed: 6 in-progress beans with every Done-when box ticked'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T22:16:09Z
updated_at: 2026-09-21T22:16:40Z
parent: folio-assistant-ahvw
---

Found 2026-09-21 while picking up `tyyc`, which was `in-progress` with all
five Done-when boxes ticked and its work fully landed on `main` — gate
registered, passing, third states intact. Re-deriving it from a clean
checkout cost a session's opening; the claim it carried is what a sibling
would have honoured.

## Measured 2026-09-21 on `645dd7dd91`

Six `in-progress` beans have **every** checkbox in their body ticked:

| bean | boxes | subject |
|---|---|---|
| `tyyc` | 5 | docs-site's paths filter (**verified landed, now closed**) |
| `jijc` | 6 | `DECLARATION_FILENAME` and its 21 bypasses |
| `5a3l` | 4 | deployment topologies vs operating modes |
| `7iog` | 4 | command paths checked against the repo |
| `8nzu` | 3 | goal-review provenance |
| `z4mq` | 3 | Zod modules as tool KG nodes |

All six have now been re-derived against `main` at `645dd7dd91`, and the
outcome is the argument for the check rather than against it:

| bean | verdict |
|---|---|
| `tyyc` | **closed** — gate registered in both places, re-run, third states intact |
| `7iog` | **closed** — `check:workflow-paths` exists; the over-claiming summary line now names its own frame and this bean |
| `8nzu` | **closed** — all three criteria read in `goal-review.md` and on `ab3n` |
| `5a3l` | **closed** — the proposal moved to `fsh-guts/proposals/`, 15 children, BA sign-off recorded |
| `jijc` | **left open** — its own gate prints *"test fixtures 11 (an open judgement on bean `jijc`)"* while box 5 says they were migrated |
| `z4mq` | **left open** — a FALSE POSITIVE of the sweep, see below |

Four of six were finished and claimed; one disagreed with its own gate; one
was never finished at all. **A ticked box predicted the answer in four cases
out of six**, which is why the check reports rather than closes.

## The detector's limitation, found by using it

`z4mq`'s three ticked boxes sit under `## Done when — item 3` — a
**sub-checklist of one item**. Its real Done-when is a `•` bullet list above,
unticked. A sweep that counts every `[x]` in the body calls that bean
finished.

And `jijc` shows the other direction: every box ticked, work genuinely
incomplete by the measure of its own gate. So the check must report
*candidates for a person to re-derive*, never a verdict — which is the shape
`bun run health` already takes.

## The gap, against its two neighbours

Neither existing bean covers this axis, checked by reading them:

- `fgnw` (completed) covers a **quiet** claim — in-progress with no activity
  for N hours — and its rule is about a *signal rather than a clock*: an open
  PR, a recent commit. A bean finished an hour ago is not quiet and is not
  caught.
- `sfhr` (completed) covers bodies the tooling cannot **read** — empty, or a
  title that swallowed the Done-when. These bodies read perfectly.

`bun run health` has a `bean-store` check whose blurb names *unhonoured
claims*; it reported three findings on this store and none of them was a
claim. So this axis is unreported by everything that looks at the store.

## Why it costs something

`bean-coordination` makes `in-progress` a claim, so a sibling honours it. A
bean that says "done" in its body and "claimed" in its front matter is two
answers to one question, and the one a sibling reads first is the one that is
wrong. The cost is not theoretical: it was paid in this session.

## What this is NOT

Not a proposal to auto-close anything. Every rule here says a status change
follows evidence a person or an agent re-derived — `deletion-requires-
confirmation` for the destructive half, and `bean-coordination`'s *evidence,
not authorship* for the rest. **The finding is the deliverable**, in the same
report-and-never-act shape the other health checks take.

## Done when

- [ ] `bun run health`'s `bean-store` check reports an in-progress bean whose
      every Done-when box is ticked, as a finding naming the bean
- [ ] The third state is kept: a bean with NO checkboxes is *no criteria
      recorded*, never folded into the pass — it is the case the sweep cannot
      judge, not a clean one
- [ ] Falsified by planting: ticking the last open box on an in-progress bean
      makes the check report it, and unticking it stops
- [x] The six listed above are each re-derived against `main` and closed or
      left open with the reason recorded on the bean — done 2026-09-21:
      `tyyc`, `7iog`, `8nzu`, `5a3l` closed; `jijc` and `z4mq` left open with
      their reasons

## Do not

Do not close any of the five on the strength of its boxes. `tyyc` was closed
because `check:workflow-script-paths` was re-run and its registration in
`code-quality-gates.yml` re-read — not because it said it was done.
