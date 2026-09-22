---
# folio-assistant-bx6q
title: 'A STEER THAT CORRECTS A RULE MUST LAND IN THE SKILL: the correction reaches the artefact and the rule stays wrong'
status: completed
type: task
priority: normal
created_at: 2026-09-21T22:48:55Z
updated_at: 2026-09-22T10:46:09Z
parent: folio-assistant-ahvw
---

The owner, 2026-09-21: *"give structed Q&A w/ context. update skills in fedback
like this."*

The second clause is a rule and had no home. `symbiotic-interaction` §1 already
said a steer means *"do not require the author to repeat the correction"*, but
applied to the artefact alone that clause only holds inside one session: the
proposal is fixed, the rule that produced it is not, and a fresh context makes
the same proposal next time.

It had been followed ad-hoc all session and written nowhere:

- *"collision=coordinate, potentail colliosn by looking at beans = coordinate"*
  → two new triggers in `coordinate.md`.
- *"voices should be associated to appropriate home semantically/by judgement"*
  → `schemas/voice-skill.ts`, replacing a mechanical ownership rule the corpus
  had falsified twice.

## Done when

- [x] `symbiotic-interaction.md` §2 carries the rule, the three questions that
      identify a rule-level steer, the same-turn/quoted/dated requirement, and
      the boundary against `kg-contribution-offer`.
- [x] Two anti-patterns added (§4.5, §4.6) — artefact-only application, and
      filing the steer as a bean instead of doing the edit.
- [x] The front-matter `description` names the rule, so an agent looking for it
      finds it by `skill_list` rather than by having read the body.
- [x] `kg-contribution-offer.md` states the boundary from its side: a correction
      to an existing rule needs no offer.
- [x] `interaction-modality.md` §4.3 closes the loop from the asking side.
- [x] The gap the rule found on first application is fixed in the same change:
      *"harness handler wins."* now sits in `schema-management.md` beside the
      two path rules it arbitrates, not only on `gen-handler-index.ts` and in
      bean `8h42`.


_2026-09-22T10:10:00Z_ — **CLOSED ON EVIDENCE, not authorship** (`bean-coordination` §"Closing a bean whose work has already landed"). This session did not do this work; it established the claim is still true on today's `main` and that nobody else is holding it.

## Why it was takeable

Surfaced by `bun run health`, which reported **six** `in-progress` beans with every Done-when box ticked — the `fkjo` finding. Four of the six turned out to be **live work, not stale claims**: `sj6m` (07:17), `prhr` (08:20), `03t9` (08:55) and `j41m` (09:05) were all updated within three hours, and #916 is another session actively closing `j41m`. That is exactly the limitation `fkjo` records about its own check — *"a bean whose work is done but not yet merged is indistinguishable from one whose work landed"* — and it is the majority of the finding list rather than an edge case.

`fkjo` itself has an unmerged branch, `origin/claude/sharp-ptolemy-6qxh77-fkjo`, so it is somebody's and was left alone.

That leaves this bean: quiet ~11.5 h, **no unmerged branch naming it**, **no open PR naming it**. Both checks run before touching it, per §"A claim is branch-local" — a claim announces rather than reserves, so the way to tell abandoned from live is to look for the branch.

**The actionable set was 1 of 6.** Worth recording against the raw finding count, because "six beans need re-deriving" and "one does" are different amounts of work and only the second is true.

## The six boxes, each checked against `origin/main`

| box | evidence |
|---|---|
| §2 carries the rule and the three questions | `## 2. A steer that corrects a RULE lands in the SKILL — same turn (STRICT)`, with `### Is this steer rule-level? Three questions` under it |
| two anti-patterns — artefact-only application, and filing as a bean | items **5** and **6** under `## 4. Anti-patterns`, both bolded |
| front-matter `description` names the rule | present |
| `kg-contribution-offer.md` states the boundary from its side | present |
| `interaction-modality.md` §4.3 closes the loop from the asking side | present |
| the gap found on first application is fixed in the same change | *"harness handler wins"* in `schema-management.md` |

Landed in `e0e067b711`, *"A steer that corrects a RULE lands in the SKILL — same turn, quoted, dated"*, and shipped via #827.

## A correction to my own check, recorded because it nearly produced a wrong verdict

The anti-patterns box first read as **NOT met**: I grepped `^#+ *4\.(5|6)` expecting headings, got zero, and was one step from reporting a box unsatisfied. They are **numbered list items** 5 and 6 under `## 4. Anti-patterns` — the bean's "§4.5, §4.6" meant that numbering, not a heading level. **My regex was wrong, not the bean.**

Worth keeping because the failure mode is the one this whole session has been about: a check that cannot find a thing reporting that the thing is absent. A zero from a pattern is evidence about the pattern first and about the corpus second, and the discriminator cost one `grep -nE '^#{2,4} '`.

---

### A second session reached the same verdict, and missed what this one caught

Closed independently on 2026-09-22 by another session working the same
`bean-self-declared-done` finding, which verified the same six boxes against
the same files and reached the same conclusion — **including the identical
correction about "§4.5, §4.6"**, having made the identical wrong grep.

That session did **not** run the branch-and-PR check above before closing, so
it had no way to separate the one takeable bean from the four that were live
work. The analysis in this entry is the one to trust on that point: *"the
actionable set was 1 of 6"*, and it is recorded here rather than dropped
because two sessions converging on a verdict says nothing about whether either
was entitled to act on it.
