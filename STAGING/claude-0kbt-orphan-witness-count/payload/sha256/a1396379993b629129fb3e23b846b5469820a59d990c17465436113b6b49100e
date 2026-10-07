---
# folio-assistant-zjm1
title: 'VACUOUS CLEAN: devils-advocate ''clean (all rebutted)'' is satisfied by ZERO objections, and the sidecar skip then makes it sticky'
status: todo
type: bug
created_at: 2026-10-02T23:49:21Z
updated_at: 2026-10-02T23:49:21Z
parent: folio-assistant-0ipy
---

## The defect, quoted

`cat-harness/skills/authoring/authoring-core/devils-advocate-watcher.md:186`:

> Then assign the block a `da-referee-verdict`: `clean` (**all rebutted**),
> `survivable-objection` (≥1 partial, none surviving), or `open-objection`
> (≥1 surviving).

**"All rebutted" is vacuously true over an empty set.** A block where every
lens returned no objection at all earns the SAME verdict as a block where four
objections were raised and each was defeated with a cited rebutting artifact.
Those are opposite epistemic states: one says "attacked and held", the other
says "nothing attacked it, for whatever reason".

And the verdict is **sticky**. `:150-154`:

> **Sidecar skip.** Before dispatching, read `<block>.qa.json`. If a
> `da-referee-verdict` entry exists with a `field_hash` matching the current
> `.md`/`.ts`/formal hashes → skip (already adjudicated at this content).
> Re-audit on hash drift or a prior `surviving` verdict.

So a vacuous `clean` exempts the block from re-audit for as long as its content
does not change. Re-audit is triggered by hash drift or a prior `surviving`
verdict — **never by the suspicion that the first pass did nothing**. A lens
that silently failed, timed out, or declined to engage produces a permanent
`clean`.

The asymmetry is visible in the skill's own hedging: slot I.5 hedges
`open-objection` with "Verdict ≠ truth". There is no symmetric hedge on
`clean`.

## It is the same defect as this session's main work, in a second system

The merge pipeline's version, measured 2026-10-02 on #1889's head
`7ab6119405`: 9 check runs present, all 9 gating job NAMES matching, 3 suites
`completed` as `action_required` having executed **nothing**, and a filter for
`conclusion == "failure"` returning **zero**. "Nothing is not-green" read as a
pass. #1894 answers it by refusing to read a verdict at all: ask which runs are
OWED, and keep `missing-required`, `none` and `unknown` apart from `green`.

**The same remedy applies here, and it is a vocabulary change rather than
machinery.** `clean` conflates two states, so split them:

| verdict | means |
|---|---|
| `clean-rebutted` | ≥1 objection was raised and every one was rebutted, with its artifact |
| `no-objection-raised` | zero objections — **not a pass**, and never grounds for the sidecar skip |

`no-objection-raised` is the `unknown` of this system: it is not a failure and
it is not a clearance. It must not satisfy the skip at `:150-154`.

This is `generalise-the-fix` applied to the fix itself: the class is **"a
verdict computed over an empty set of findings reads as a clearance"**, and
this repository now has two confirmed instances of it. Worth asking where else
a rollup is defined as a universal over possibly-empty findings —
`audit-coverage`'s four per-kind states were designed to avoid exactly this
(§"the four per-kind states that must not collapse into one zero"), so the
pattern is already understood here and was simply not applied to the DA
rollup.

## The independence problem beside it, measured

123 `*.qa.json` sidecars carry a QA entry; **11** record `agent_model`; all 11
say `claude-opus-5`; and the field is OPTIONAL in the schema. So a `clean`
that rests on several lenses agreeing may rest on one model family agreeing
with itself, and the sidecar usually cannot say. Nothing in the skill states
that agreement among same-family lenses is weaker corroboration than
independent agreement.

The repository already holds the right rules for this —
`cat-harness/methodologies/consensus-grounded-subject-evaluation.md` carries
independence and dissent-retention — and it is cited by **zero** skills.
Related: `SWE-Debate` (arXiv 2507.23348v1) has the same flaw and its authors
admit it in §6.2; its proposers, voters and discriminator are all
DeepSeek-V3-0324 with different system prompts.

## Done when
- [ ] `clean` split into `clean-rebutted` and `no-objection-raised`
- [ ] `no-objection-raised` does NOT satisfy the sidecar skip at `:150-154`
- [ ] the skip rule says which verdicts it honours, positively
- [ ] `agent_model` required where a verdict rests on lens agreement, OR the
      skill states that same-family agreement is not corroboration
- [ ] `consensus-grounded-subject-evaluation.md` cited from the DA rollup
- [ ] a sweep for other rollups defined as a universal over possibly-empty
      findings — this is a class, not one line

