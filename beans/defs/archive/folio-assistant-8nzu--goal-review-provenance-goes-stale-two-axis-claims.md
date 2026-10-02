---
# folio-assistant-8nzu
title: 'GOAL-REVIEW PROVENANCE GOES STALE: two axis claims measurably false one day later, and following them would have missed the sweep''s headline'
status: completed
type: bug
priority: normal
created_at: 2026-09-21T06:25:55Z
updated_at: 2026-09-21T22:18:00Z
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

- [x] `goal-review` separates its dated measurements from its instructions,
      so a stale number cannot be read as present guidance — the same
      discipline `ci-health` applies with *possibly stale* and *superseded*
- [x] Axis 1 says to ask the session API **first** and fall back to trailers,
      with "could not determine" if neither answers — rather than naming the
      fallback as the method
- [x] `ab3n` (completed) carries a correction: its title asserts *"the session
      API cannot see them"*, which is no longer true

*Ticked IN PLACE 2026-09-21 — appending a second copy is the `shadow-checklist`
defect `sfhr` shipped a detector for, and that detector caught this session
doing it twice already today.*

## What shipped, and the thing it found beyond the bean

The header disclaimer already said the numbers were provenance. **That was not
enough, and the reason is the whole finding:** a sentence like *"the API may
not be able to see them: on DATE eight lookups returned not found"* welds a
**present-tense capability claim** to its dated evidence, and a disclaimer
about NUMBERS does not reach the CLAIM. A reader takes the first clause as
guidance and never re-tests it. So every dated observation in the file is now
labelled as one, every instruction is present-tense and actionable, and where
the two have since disagreed **both are kept** — the observation with its date,
and what re-measurement found.

**Axis 1** now says: ask the session API FIRST; fall back to commit trailers
when it does not answer; report `could not determine` when neither does. Never
present the fallback as the method.

**Axis 5**'s *"expect this axis to be thin"* is replaced by *measure it, do not
expect a size* — with both readings on the record (2 issues on 2026-09-20, 30
touched and 23 opened on 2026-09-21) and the reason for the inversion, which
was not chance: the repository adopted an issue per piece of work, so the
skill's own subject changed underneath its number.

**The claim had escaped into code, which the bean did not know.**
`sibling-sessions.ts` *printed* "The session API cannot see a sibling" in its
own report to whoever ran it. Corrected, and its header now states what is
actually durable: a commit trailer survives the container, so that tool is
right for *what did each session DO in this window* and wrong as the first
question for *who is here now*.

`ab3n` carries the correction and is **left `completed`** — its work is done
and correct; only a sentence about the world aged, and closing or reopening a
sibling's bean is not this session's to do.

*Issue link, recorded on creation.* **[#703](https://github.com/litlfred/folio-assistant/issues/703)**

## Closed 2026-09-21 — re-derived on `645dd7dd91`

All three criteria verified in `skills/folio-core/goal-review.md` and on
`ab3n`, by reading them rather than by trusting the ticks:

- **Dated measurements separated from instructions** — the skill states the
  failure directly (welding *"a present-tense capability claim to its dated
  evidence"*, with a reader who takes the clause as guidance and never
  re-tests it) and applies the rule to every dated figure it carries.
- **Session API first, trailers as fallback** — *"commit trailers when it does
  not answer, and report 'could not determine' when"* neither answers. The
  fallback is named as a fallback, which was the defect.
- **`ab3n` carries its correction** — dated 2026-09-21, and framed as *"a
  correction, not a reopening"*.

Found by the `fkjo` sweep: this was `in-progress` with every box ticked.
