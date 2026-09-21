---
# folio-assistant-8nzu
title: 'GOAL-REVIEW PROVENANCE GOES STALE: two axis claims measurably false one day later, and following them would have missed the sweep''s headline'
status: todo
type: bug
priority: normal
created_at: 2026-09-21T06:25:55Z
updated_at: 2026-09-21T06:26:13Z
parent: folio-assistant-ahvw
---


Found 2026-09-21 by running `goal-review` itself (session_01AYHimvYMmf8h8e9fFN6dW5),
one day after the skill was authored from bean `mgta` / issue #578.

## Measured

The skill keeps its authoring session's numbers "as provenance for the rules"
and says so. Two of them have since become **guidance a reader follows**, and
both are now false:

| the skill says | measured 2026-09-21 |
|---|---|
| §Axis 1: *"The session API may not be able to see them at all: on 2026-09-20 every one of eight lookups by id returned not found, and the listing showed only the asking session."* | `list_sessions` returned **7 sibling sessions** with status, branch tips, task summaries — **and each blocked session's pending question verbatim** |
| §Axis 5: *"Expect this axis to be thin where work is bean-driven: 54 proposals merged that day and 2 issues changed."* | **30 issues touched**, 23 newly opened, 5 closed — in a comparable window |

## Why it matters more than a stale number usually would

**Following axis 1 as written would have missed the sweep's headline.** The
skill directs the reader to commit trailers because the API "cannot see"
siblings. Trailers give commit counts and branch tips. They do **not** give
*"four sessions are blocked on the owner right now, and here are their
questions"* — which is what the API gave, and which reframed the entire
review from "what work remains" to "the bottleneck is decisions, not work".

A reader who trusted the skill would have reported a queue of work while four
sessions sat waiting.

Axis 5's inversion is the same shape pointed the other way: it tells a reader
to expect a thin axis and therefore to under-read it. The inversion is not an
accident — `oh78` landed the rule that a bean-driven change owes a round
summary, and the owner's standing preference opens an issue per bean. **The
skill's own repository changed the thing the skill measured.**

## The gap, stated as a rule rather than as two corrections

A provenance measurement and a present-tense instruction are different
claims, and this file mixes them in the same sentence. *"The API may not be
able to see them"* reads as a capability statement; *"on 2026-09-20 eight
lookups returned not found"* is a dated observation. The first ages badly and
the second cannot.

## Done when

- [ ] `goal-review` separates its dated measurements from its instructions,
      so a stale number cannot be read as present guidance — the same
      discipline `ci-health` applies with *possibly stale* and *superseded*
- [ ] Axis 1 says to ask the session API **first** and fall back to trailers,
      with "could not determine" if neither answers — rather than naming the
      fallback as the method
- [ ] `ab3n` (completed) carries a correction: its title asserts *"the session
      API cannot see them"*, which is no longer true
