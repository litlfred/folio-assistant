---
# folio-assistant-g7vb
title: 'TOPOLOGY: mixed modalities are the normal case, so the axes must vary independently'
status: completed
type: task
priority: high
created_at: 2026-09-19T08:55:37Z
updated_at: 2026-09-19T16:08:59Z
parent: folio-assistant-5a3l
---

**Strawperson.** From [#363](https://github.com/litlfred/folio-assistant/issues/363):
"may also oprate in mixed modalities, self sovergn cloud except models could be
closed not openweight etc, or self-sovering connects to their national portal or
PCP emr, bean up to strwaperson these too."

## This sentence is why the parent epic is axes and not an enum

Both examples given are a named profile with **one axis moved**:

- self-sovereign, but the model supply axis is "closed weights" instead of open
- self-sovereign, but the data-stores axis gains a national portal or a primary
  care EMR

Neither is an eleventh mode. If the model were an enum of named modes, each
would need its own entry, and the next mix would need another — combinatorially.
With axes, both are already expressible and neither needs new vocabulary. **That
is the strawperson's central claim, and this bean is where it gets tested.**

## The test that would falsify it

Take every scenario named in #363 and every mix the owner can think of, and try
to express each as a point in the axis product. The design fails if:

- a scenario needs a value no axis ranges over — the axes are incomplete; or
- two axes turn out not to vary independently — e.g. if "closed weights" forces
  a publication host, they are one axis wearing two names; or
- a mix is expressible but **wrong** — the axes admit a combination that must
  not exist, and the model needs a stated constraint rather than a free product

The third is the interesting failure, and the likeliest. Air-gapped plus closed
hosted models is probably contradictory. A free product will happily represent
it.

## So the deliverable may be constraints, not more axes

If mixes are mostly expressible, the remaining work is a small set of **stated
incompatibilities** — pairs of axis values that cannot co-occur, with the reason.
That is a far smaller artefact than a mode enum and it is checkable.

## Done when

- [ ] every scenario in #363, and every mix the BA raises, is expressed as axis
      values or recorded as inexpressible
- [ ] the incompatible pairs are listed, each with its reason
- [ ] a declaration naming an incompatible pair is refused, not silently accepted

## Review

https://github.com/litlfred/folio-assistant/issues/371, opened per #363's instruction.

## Scope change, 2026-09-19 — the axes were accepted

Owner: **"yes on axes"**. So this bean is no longer "test whether the model
holds"; that test was run and passed, and it changed the design twice on the
way (tool surface became an axis; splitting model cardinality from provenance
exposed the air-gapped x hosted contradiction).

**What is left is the constraints half**, which the body above already
predicted would be the real deliverable: the five incompatible pairs in §3
exist as PROSE IN A TABLE and nothing reads them. Making a declaration that
names an incompatible pair actually get refused is the work.

Also settled: `private repo` x `github-pages` is a possible deployment
scenario and must NOT become a sixth pair. Do not re-litigate it.

## Closed 2026-09-19 — all three criteria met

Criteria 1 and 2 were already satisfied by `deployment-topologies.md`
§3–§4 when that merged; verified rather than redone. Criterion 3 shipped in
[PR #433](https://github.com/litlfred/folio-assistant/pull/433).

- **[x] every scenario in #363 expressed as axis values** — §4's table, and
  it found axis 6 and the `ingest` mode in the process. Nothing was left
  over.
- **[x] the incompatible pairs are listed, each with its reason** — §3, five
  rows, each an entailment of the mechanism rather than a report.
- **[x] a declaration naming an incompatible pair is refused** —
  `topologyConflicts()` in `schemas/cat-harness.ts`, thrown from
  `readDeclaration` as `TopologyConflictError`. 17 tests; the refusal was
  proved load-bearing by disabling it.

Four axes declared, not ten: `forge`, `network`, `modelProvenance`,
`outwardFacing` — exactly the ones the rules read, joined with the existing
`publication.host`. The other six would be vocabulary nothing consumes.

**Every axis is optional and absent is a third state**, so nothing in
existence is refused. The first test written is that this repository's own
`harness.json` still reads — the owner's "dont encode rules against a
working setup", as a test rather than an intention.

## One open question, defaulted rather than left hanging

`air-gapped` × `modelProvenance: mixed` is NOT refused, although `hosted`
is. The entailment holds only if `mixed` necessarily means a LIVE hosted
component, and a deployment could mean "local models, hosted path
configured and disabled". A counter-example is conceivable, which is the
bar §3 sets, so it stayed out — recorded in a test so it reads as a
decision. Put to the owner on
[#371](https://github.com/litlfred/folio-assistant/issues/371#issuecomment-5743325632)
with the shipped behaviour as the default.
