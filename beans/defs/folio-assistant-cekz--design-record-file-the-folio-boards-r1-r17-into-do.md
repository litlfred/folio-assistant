---
# folio-assistant-cekz
title: 'DESIGN RECORD: file the folio board''s R1-R17 into docs/architecture, per the owner''s docs-filing ruling'
status: completed
type: task
priority: normal
created_at: 2026-09-21T18:38:14Z
updated_at: 2026-09-21T18:46:28Z
parent: folio-assistant-6lb8
---



Issue: https://github.com/litlfred/folio-assistant/issues/602 — CRDM
`BA_ChooseKg`, the step after sign-off.

## The owner's ruling, verbatim

> this is a memory asset as part of design, so it goes into docs/. update
> skills for documentation filing. fsh-guts can be thrown away/lost... this was
> an asset as part of building a feature (or accessing data, or other skill
> realtaed to manament/rendering of that type of content) but it is not the
> content we want displayed itself.

**None of the three options I offered was the right answer**, and the reason is
my error rather than a gap in the process. `kg-contribution-offer` says the
destinations are DERIVED from the instance's declared graphs, never typed from
memory. I derived them — and still **dropped `docs`**, which
`cat-harness.json` declares as `docs docs/ ['docs']`. So the offer presented
skill / fsh-guts proposal / none for an asset that belonged in none of them.

**Deriving the list is not enough if the derivation loses a declared graph.**

## The class the ruling names, and why it is not the neighbours

> Was this produced while BUILDING something, rather than being the thing that
> was built?

| not | because |
|---|---|
| `folio` | it is not subject matter |
| a skill | a skill is read by an agent about to act; this is read by a person asking *why is it like this* |
| a bean | it is not work outstanding |
| **`fsh-guts`** | its content **may be thrown away or lost**, which is the point of having it. A design record's whole value is that it survives the conversation that produced it |

## Done when

- [x] `docs/architecture/folio-board-requirements.md` carries R1–R17 with the
      acceptance criteria and consumer-burden notes as agreed, dated, and
      naming the artefacts each requirement produced
- [x] **R15 and R16 are reported as UNDEFINED**, not invented — see below
- [x] `kg-contribution-offer` gains `docs` as a destination, the identifying
      question, and why `fsh-guts` is the tempting wrong answer
- [x] `placement` gains the filing question — architecture vs guides vs
      reference — and the three rules for a design record
- [x] the page is reachable from the Architecture nav, not orphaned

## The finding that came out of extracting the set

**R15 and R16 are referenced but never defined.** `51wf` is assigned *"R2, R9,
R15"* and `zsah` *"R12, R16"*, and no comment on #602 states either. What they
appear to mean is recoverable only by inference — R15 from `51wf`'s unit
description (*z-order with raise-on-select*), R16 from a later aside (*a tile
opens the existing visualisation*).

Recorded rather than reconstructed. A design record that silently fills two
gaps with plausible sentences is worse than one that names them, because the
invented text reads exactly like the agreed text.


## The ruling was sharpened mid-work, and all three parts landed

The owner added, while this was being written:

> make sure that this connects CRDM/SDLC process --- if it is realated to some
> harness/feature/tool that detailed infromation/design/planning/etc go into
> that harness' docs/. docs/ can also include information about how to access
> data sources related to the content described or provide more detailed
> information that is beyond what a human/agent needs to know in order to
> perform a task if they are competentnt in the given skill.

1. **Connected to the process, not just to a skill.** `crdm-requirements-
   workflow` Phase 5 now carries the offer as step 3 with its three rules, and
   Phase 6 step 8 names the owning instance's `docs/` as where the page is kept
   true — including recording a divergence rather than smoothing it.
2. **Whose `docs/`.** Not "docs/" but the OWNING instance's. Measured the same
   day: `cat-harness/docs/` and `who-iris/docs/` both exist and `who-iris`
   declares `docs` among its own graphs, so this is a live distinction rather
   than a future one. This page is in `cat-harness/docs/` because the board's
   schema and behaviour live in `cat-harness` by the requester's own layering.
3. **The competence line**, which is the sharpest thing in the ruling and now
   the test in both skills:

   > A skill carries what a competent practitioner needs IN ORDER TO DO the
   > task. Anything beyond that is documentation.

   With the data-source case named alongside it — how to reach a source the
   content describes is documentation, not a skill.
