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

---

## RE-DERIVED 2026-09-22 — closed on evidence

All six boxes checked against the files rather than taken on trust:

| claim | measurement |
|---|---|
| §2 carries the STRICT rule | `symbiotic-interaction.md:48` — *"A steer that corrects a RULE lands in the SKILL — same turn (STRICT)"* |
| the three questions | same file, `:69` — *"Is this steer rule-level? Three questions"* |
| two anti-patterns | §4 items **5** and **6** — artefact-only application, and filing the steer as a bean |
| front matter names the rule | the `description` block carries it, so `skill_list` surfaces it without reading the body |
| `kg-contribution-offer` states the boundary | `:49` — *"A ruling on something already in the graph is an edit and needs no offer"* |
| `interaction-modality` §4.3 closes the loop | `:298` — *"a ruling is a skill edit, not just an applied answer"* |
| the gap found on first application | `schema-management.md:230` — *"harness handler wins."* |

The bean writes the anti-patterns as "§4.5, §4.6"; they are items 5 and 6 of
§4, not subsections. Noted because a grep for `§4.5` finds nothing and could
be misread as a missing deliverable.
