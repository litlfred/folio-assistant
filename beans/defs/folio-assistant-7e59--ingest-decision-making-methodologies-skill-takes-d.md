---
# folio-assistant-7e59
title: 'INGEST: decision-making methodologies — skill takes decision context as input, outputs ranked applicable methods with criteria and rationale. Source: qou bd0c2cb7 (3 arxiv PDFs: 2508.21620 probabilistic/bandits, 2509.06388 MCDM/AHP/SAW, 2607.20636 sequential/social). Covers all methodology families with when-to-use criteria.'
status: todo
type: task
parent: folio-assistant-slw1
created_at: 2026-09-25T15:38:03Z
updated_at: 2026-09-25T15:38:03Z
---

**This body was filled in by another session (2026-09-25), from evidence on
`main`, at the owner's request.** The bean was `todo` with front matter and
nothing else, which failed `check:bean-bodies` — *"a sibling reading the store
learns nothing about it"*. Its author should correct anything below; nothing
here is a claim about intent, only about what is on disk.

## Why the body was empty

**The whole description is in the `title` field.** It carries the deliverable,
the I/O contract and the three sources — several sentences of it. Nothing was
lost; it was put somewhere a body check cannot see, and somewhere
`beans list` truncates.

## What has already LANDED on `main`

Measured, not inferred — both files are on `main` now, via the merge titled
*"feat: decision methodology selector — skill + schema (bean 7e59)"*:

| file | what it is |
|---|---|
| `cat-harness/skills/folio-core/decision-methodology-selector.md` | the skill: takes a decision context, reads the methodology graph's `applies-when`, returns ranked applicable methods with rationale |
| `cat-harness/schemas/decision-methodology-context.ts` | `DecisionContext` — what a decision NEEDS, as against what a methodology IS |

The skill declares `graph-kinds: [methodology]` and extends
`methodology-adoption`'s four-question protocol with quantitative selection
criteria. The schema's own docstring draws the line against
`decision-request.ts`: this one shapes the question *before* a decision reaches
a person (**which method?**), that one shapes the decision already handed over
(options, pros/cons, recommendation). One runs before the other.

Every dimension of `DecisionContext` is optional by design — *"an agent provides
what it knows"* — so a context carrying only `questionType` still routes through
the four-question protocol.

## Sources, from the title

`qou bd0c2cb7`, three arXiv PDFs:

| paper | family |
|---|---|
| 2508.21620 | probabilistic / bandits |
| 2509.06388 | MCDM / AHP / SAW |
| 2607.20636 | sequential / social |

## Parented to `slw1` — INGEST: one pipeline from uploads/ to a complete L1 library

The owner's choice, 2026-09-25, on this reasoning: the bean names **itself**
`INGEST:` and the work is ingesting three papers into the library. `ahvw`
(PROCESS: how an agent decides) was the alternative, filing it by deliverable
rather than by mechanism, and was not chosen.

## The status is worth a second look — NOT changed here

It is `todo`, and its two named artefacts are **already on `main`**. That reads
like *done in all but name*. **Deliberately left as `todo`**: whether the
ingestion is complete — all three papers, all methodology families with
when-to-use criteria, as the title promises — is a judgement only its author can
make, and `bean-coordination` is explicit that an agent never resolves a
sibling's bean.

## Done when

- [ ] the author confirms, or corrects, what is recorded above
- [ ] the status reflects reality — the skill and schema have landed
- [ ] all three papers' methodology families are covered with when-to-use
      criteria, which is what the title promises and what nothing here verifies
