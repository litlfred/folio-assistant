---
# folio-assistant-abmq
title: 'MERGE GATE (c): RED FLAG taxonomy, verdict sidecar shape, and the recorded override path'
status: todo
type: feature
created_at: 2026-10-02T16:29:16Z
updated_at: 2026-10-02T16:29:16Z
parent: folio-assistant-nok9
---

Child (c) of the merge-gate epic. Design: `cat-harness/docs/proposals/merge-gate-2026-10-02.md` §6.

A RED FLAG is a finding the reviewer asserts **would block the merge** (amended 2026-10-03; it asserted "blocks the merge" until the warn-only ruling below). It reuses the two existing axes in `schemas/qa-review.ts`: `FindingSeverity` (critical | major | minor: what kind of breakage) and `FindingWeight` (blocking | suggestion | praise: what the reviewer asks of the gate). A RED FLAG is `weight: blocking` with a category from a closed taxonomy (security, data loss, correctness, false green, provenance, scope breach, irreversible action, licence).

## Done when
- [ ] the taxonomy is a closed enum in a schema, each category with a definition and an example drawn from this repository's history
- [ ] the verdict sidecar shape is defined and validated, compatible with `kg-qa/v1` (an optional `adversarial_reviews[]` modelled on `voice_reviews[]`)
- [ ] the override path is a recorded `decision` by a human with standing (who, when, why, the finding id), never a deletion of the finding
- [ ] the gate's behaviour is defined for every state: open flag, resolved flag, overridden flag, `unknown` review, stale review (head moved)

## Superseded 2026-10-03 — the agentic review WARNS, it does not block

The ask recorded above is kept verbatim as what was asked. The owner ruled
differently later on 2026-10-02:

> dont want hard gate (at least not for now, lots of backlog on content nodes)
> but do want warn.

and confirmed on 2026-10-03, with both dates put to them: *"warn only.
proposal predates ruling, update it."* So this is a stale record corrected,
not two live positions.

**The reason is specific.** A hard gate over a backlog of unreviewed content
nodes fires on the corpus's existing state rather than on what a PR changed,
so the first PR after it landed would inherit every unresolved finding in the
paths it touches. The per-block backfill (`lvlv`) has to come first; a
blocking gate inverts that order.

**The taxonomy survives the ruling intact, and that is the point of having
one.** `weight: blocking` keeps its meaning — *this is what the reviewer asks
of the gate* — and `schemas/qa-review.ts` already separates that from
`severity`. What changes is only what the GATE does when it reads one: it
posts "would have blocked" instead of holding the merge. A vocabulary that had
to be rewritten because the enforcement changed would have been the wrong
vocabulary.

One Done-when item gains a state, because warn-only adds it:

- the gate's behaviour must be defined for `would-have-blocked` as well as for
  open / resolved / overridden / `unknown` / stale. It is the state the
  promotion decision counts, so it cannot be folded into "suggestion".

**A warn is not a weaker block — it is the only instrument that can produce
the number a later promotion needs.** No paper in the 2026-10-02 reading sweep
reports a false-positive rate for any LLM judge (checked across arXiv
2402.02172v5, 2404.04834v4, 2507.23348v1, 2601.04544v1, 2607.00053v1), and
CodeAgent's own annotation leaves 49% of GPT-4's flags unconfirmed. So a
`blocking`-weight finding is posted as **"would have blocked"** rather than
discarded: that record is what a warn-to-block decision reads. The test set
should be this repository's own recorded defects (`plj1`, `dh4f`, `w4tq`,
`7u3g`), which cannot have leaked into a model's training data.

Design: `merge-gate-2026-10-02.md` §1.1, §6. Tracking bean: `5ge1`.

