---
# folio-assistant-vhmz
title: "R27 settled: the folio is the reader's REPOSITORY — library/ and uploads/ are already its reproduce directories"
status: completed
type: task
priority: normal
created_at: 2026-09-21T23:05:00Z
updated_at: 2026-09-21T23:05:00Z
parent: folio-assistant-6lb8
---

#796's question 1 — the requester's own parenthetical, *"clarifying if KG is
static w// materizlied…"* — plus R27, *"materialized should live in folio"*.

## Question 1 needed READING, not deciding

The answer was already in the corpus in three places, none read as answering
it:

| | |
|---|---|
| `folio-assistant-core/schemas/materialization.ts` | three states — `referenced` / `materialized` / `unknown` — with **no default**, five gates, and `localPath` present **iff** `materialized` |
| `skills/workflows/materialize-remote.bpmn` | the act, as an executable **STRICT** process; `unknown` on any one gate keeps the node `referenced` |
| `directory-conventions.md` | the `catalogue` kind — *"a remote catalogue modelled BY REFERENCE … Distinct from `library`: that is content which IS here"* |

So: **yes** — the KG is static and by-reference, and materialisation is a
separate, gated, checked act that produces bytes.

## What DID need deciding, and what it cost to get wrong

R27 says "folio"; `who-iris` materialises into `library/` and `uploads/`.
Three readings were put to the owner. They chose **the folio is the reader's
REPOSITORY**, of which those two are already declared parts:

    { id: "uploads", path: "uploads/", dependents: "reproduce", graphKinds: ["uploads"] },
    { id: "library", path: "library/", dependents: "reproduce", graphKinds: ["library"] },

`dependents: "reproduce"` is the schema saying *this is the reader's own copy*
— the exact fact R27 reaches for, and it predates R27.

## The measurement that arrived too late to inform the recommendation

**`corpus-grep` searches `library/` only.** `schemas/materialization.ts` says
so while explaining why collapsing `referenced` into `materialized` is worse
than the reverse. So the literal reading of R27 — relocate into `folio/` —
would have made every materialised node read as ABSENT to every consumer: a
migration into a known breakage.

**This was found after the options were tabled**, and it is recorded that way
rather than folded into the argument as though it had been known. The
recommendation was right and was made for weaker reasons than the ones that
actually settle it.

`folio/` is also the **renderable** kind, so the literal reading would have
put a 40 MB PDF into the site build.

## Summary of Changes

- `board-windows.md` — the three-state table said *"materialised under
  `folio/`"*. Corrected, with the `corpus-grep` dependency stated so the next
  reader cannot make the same move.
- `harness-tiles.md` — R19b's avatar row carried the same wrong directory.
- `docs/architecture/folio-board-requirements.md` — R27 and question 1
  recorded as answered-then-settled, with the late measurement flagged as
  late.

## Done when

- [x] question 1 answered from the corpus rather than from a guess
- [x] R27's reading settled and the two skills that stated it wrongly fixed
- [x] the `corpus-grep` dependency written down where a relocation would be
      attempted
- [x] the design record says the decisive evidence arrived after the
      recommendation

## Not done

**Nothing moves.** R27 is already satisfied and already gated by
`who-iris/scripts/check-catalogue.ts`, with `local-path.ts`'s three states and
bean `yl5w` behind it.

**The library view is still unanswered** — the states have a schema now, so
the open question is no longer *is there a distinction* but *does the reader's
view render it*.

**F8/F9 measured, not built.** On the deployed preview `who-iris/index.html`
loads `docs-ui.js` 0 times and carries 0 boards and 0 tiles, against 9 / 1 /
28 on the folio-assistant landing page. A reader browsing that library has no
folio at all. That is its own work and its own decision.
