---
# folio-assistant-6e7b
title: GOAL 1 — repository separation and instantiation (PARAPHRASE, awaiting the owner's words)
status: scrapped
type: milestone
created_at: 2026-09-20T18:51:21Z
updated_at: 2026-09-20T20:10:00Z
---

Created by the `wqht` fix, 2026-09-20, under the owner's decision that **a goal
is a `milestone` bean, in the owner's own words, with the epics serving it
parented to it** ([`todo-manager`](../../../cat-harness/skills/folio-core/todo-manager.md)
§"A GOAL is a `milestone` bean").

## ⚠ THE TITLE IS A PARAPHRASE, NOT THE GOAL

The owner stated three goals in chat on 2026-09-20. **Those words are not in
this repository** — not in issue #578, not in its comments, not in PR #579, not
in any bean. What this title carries is the `goal-review` sweep's summary of
one of them, which is a different claim from the one the owner made.

todo-manager is explicit about why that matters: *"a goal is the owner's
sentence, and a tidied paraphrase is a different claim that nobody agreed to …
If you do not have the owner's words, you do not have the goal — record the
paraphrase as a paraphrase, say so, and ask."* This bean is that record, and
this is the asking.

## Done when

- [ ] The owner supplies this goal **verbatim**, and the title is replaced with it
- [ ] The epics serving it are parented here (`beans update <epic> --parent folio-assistant-6e7b`)
- [ ] `beans roadmap` shows this goal as a top-level heading with its epics beneath

---

_2026-09-20T20:10Z_ — **SCRAPPED as a duplicate. The real milestone is `vuip`.**

A sibling session created the goal milestones **with the owner's verbatim
words** and merged them to `main` at 18:50 — about an hour before this one was
written. This bean carried the `goal-review` sweep's *paraphrase*, which is
exactly what its own body said it was and exactly what `todo-manager` says is
not a goal.

> **`vuip`** — *"separation of repos into dir/repos, instantiation skilled/tooled/tested"*

**Scrapped rather than deleted**, per `AGENTS.md`: a scrapped bean records that
something was considered and why it was rejected, so the next agent reading
`beans/` does not create a fourth paraphrase milestone on the same reasoning.

**This is `cvab` and `ab3n` happening to the session that fixed them**, and it
is the strongest evidence either bean could have. The sibling's work was on its
own branch and then on `main`; this session had `main` from before 18:50 and
could not see it. `bun run sessions --since 4h` — built in this very PR for
`ab3n` — lists that session by its commit trailer, and running it BEFORE
creating three beans would have cost nothing and saved all three.

The lesson is recorded as a TRAP in the memory graph rather than only here, so
it reaches an agent that never opens this bean.
