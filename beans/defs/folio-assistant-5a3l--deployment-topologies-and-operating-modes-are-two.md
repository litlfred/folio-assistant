---
# folio-assistant-5a3l
title: 'DEPLOYMENT: topologies and operating modes are two axes, not one list of modes'
status: in-progress
type: epic
priority: high
created_at: 2026-09-19T08:52:35Z
updated_at: 2026-09-22T21:05:00Z
---

Opened 2026-09-19 from [issue #363](https://github.com/litlfred/folio-assistant/issues/363),
"self-sovereign compute + test harness deployments", at the owner's direction:
"bean up to may strwperson and create issue to review these".

## The claim this epic rests on

#363 lists roughly ten deployment and utilization scenarios — local git only,
private GitHub, sovereign cloud, self-sovereign, developer, test/swarm, test
benchmarking, QA review — and then adds the sentence that decides the design:

> may also oprate in mixed modalities, self sovergn cloud except models could be
> closed not openweight etc, or self-sovering connects to their national portal
> or PCP emr

**A fixed enum of named modes cannot express a mix.** So the strawperson models
two orthogonal things and derives the named scenarios from their product:

- **Topology** — WHERE the instance and its artefacts live. Forge, publication
  host, compute, model supply, data stores.
- **Operating mode** — WHAT the harness is doing. Author, develop, test,
  QA-review, publish.

A mode runs *on* a topology. "Self-sovereign cloud with closed models" is not an
eleventh mode; it is one topology with one axis set differently.

## Strawperson

`docs/proposals/deployment-topologies.md`. Strawperson means exactly that: it is
written to be argued with, and the named profiles in it are a starting position,
not a decision. Nothing in it is implemented.

## Scope boundary

This epic produces **documentation, beans and review issues**. #363 says "need
sets of skills, no tooling yet except whats already there for QA", and that is
honoured: no server is written, no generator is written, no STAGING code
changes. Each of those is a child bean.

## Related, and deliberately not duplicated

- `folio-assistant-4dbr` — forge portability as Tool nodes rather than a sixth
  repository. Its §"Sovereign compute" already separates *which service hosts
  change proposals* from *running with no external service at all*, and records
  that the portability claim is asserted and never exercised. The topology axes
  here name the same distinction; they do not re-decide it.
- `skills/folio-core/serving-renderings.md` — already settles per-host media
  type enforcement and states that GitHub Pages cannot be made to serve
  `application/ld+json`. Its closing section explicitly leaves "how to run a
  server" uncovered. That hole is child bean **DEPLOY: a local HTTP server**,
  not a new finding.

## Done when

- [x] `docs/proposals/deployment-topologies.md` exists and every scenario named
      in #363 is a point in the axis product, with none left over
- [x] each scenario has a child bean (13)
- [x] the three review issues #363 asks for are open and linked here
- [x] the BA has said whether the axes are the right axes — **yes, 2026-09-19**.
      The thirteen children are unblocked and may be implemented against this
      vocabulary

## Summary of this round (2026-09-19)

PR https://github.com/litlfred/folio-assistant/pull/368, branch `claude/brave-hypatia-r820sf`.

Strawperson written; thirteen children opened; review issues #369 (sovereign
cloud), #370 (self-sovereign) and #371 (mixed modalities) open.

**Running the falsification test before writing changed the design twice**, and
both are worth carrying forward:

1. `tool surface` became a tenth axis. #363's "run CLI version of tools" is not
   a fact about where anything lives — it survives every value of every other
   axis. It also exposed unmeasured work: MCP-vs-CLI parity is asserted here and
   has never been counted (bean `2ngl`).
2. Splitting model cardinality from model provenance exposed a genuine
   contradiction: `air-gapped` x `hosted` cannot co-occur, so #363's own mixed
   example needs `egress-restricted`. As one axis it was invisible.

`ingest` was also added as a sixth operating mode, from "have incoming DAK
content".

**Left unencoded, deliberately:** `visibility: private` x `publication:
github-pages`. #363 states it as flatly unavailable; that is not universally
true (Pages on private repos exists on paid plans) and this account's
entitlement was not verified. Flagged in the proposal's §3 rather than put in
the incompatibility table — refusing a working configuration is worse than
staying silent. One row to add if the BA says assume unavailable.

**Still open — the last Done-when box.** No child should be implemented until
the BA says whether the axes are the right axes.

## Sign-off, 2026-09-19

Owner: **"yes on axes"**, and on `private repo` x `github-pages`:
"ok ... dont need to go into detail, just a possible deployment scenario".

So the two-axis model is accepted and the thirteen children are unblocked.
The private-repo pair stays OUT of the incompatibility table permanently —
it is a scenario a deployment may legitimately declare, and #363's remark
about it was a reason to reach for the local server, not a property of the
mechanism. `docs/proposals/deployment-topologies.md` §3 is trimmed to say
exactly that and no more.

**What is still open** is one question, not a review of the model:
whether sovereign cloud (`4y2i`) and self-sovereign (`61tg`) are two
topologies or one. They differ on a single axis, `outward facing`, and
overlap on the other nine. Issues #369, #370, #371.

All four Done-when boxes are now ticked. This epic stays in-progress as the
container for its children rather than completing — an epic is a thematic
container and is not worked on directly.

## Closed 2026-09-21 — re-derived on `645dd7dd91`, with one stale path

The proposal exists, at `cat-harness/docs/proposals/deployment-topologies.md` rather
than the `docs/proposals/` this bean names: `e65dfe547f` moved proposals off
the docs site into the declared trashcan. **Searched before concluding**, for
the `pomp` reason — *"not in my checkout" is not "does not exist"*, and the
first look at the path the bean gives found nothing.

- 15 child beans declare `parent: folio-assistant-5a3l`; the bean says 13, so
  the set grew rather than shrank.
- The BA sign-off on the axes is recorded in the body, dated 2026-09-19.

The children are unblocked against this vocabulary, which is what this bean
existed to produce.

Found by the `fkjo` sweep: this was `in-progress` with every box ticked.

---

## RE-OPENED 2026-09-22 on the owner's ruling — `completed` with 12 open children

Owner, 2026-09-22: *"re-open 5a3l"*, answering stream 4's question *"`5a3l`
(DEPLOYMENT) reads `completed` while 12 of its children are open. What should
happen to it?"*

**The finding, and where it came from.** Stream 4 of the #956 consolidation
(`kpcl`) shipped `check:bean-rollup`, whose `closed-container-open-subtree`
rule asks whether a bean's status contradicts its own subtree. It fired exactly
once across the store, on this epic. The rule is pure graph and owns no clock:
it needs no date to know that *finished* and *twelve children still open* cannot
both be true.

**Measured 2026-09-22T21:05Z against the store — 16 children, 12 open:**

| | |
|---|---|
| in-progress | `0hi8` |
| todo | `1lfx`, `2ngl`, `4y2i`, `61tg`, `6qk5`, `81vy`, `amom`, `mkqf`, `vljz`, `vm6m`, `wp49` |

Eleven of those are this epic's own subject — the two topology beans, the mode
beans, the deployment-awareness and staging-host beans, the test-data family.
The twelfth, `mkqf`, is queued stream C, which exists *because* this work is
open.

**Why re-opening rather than closing the children or re-parenting them.** The
three alternatives were put to the owner and each would have asserted something
unmeasured: closing the twelve claims work is done that nobody re-derived;
re-parenting claims they belong elsewhere, which is a judgement about each one;
leaving it baselined keeps the roadmap reading DEPLOYMENT as finished while
eleven of its beans are open. **The epic's own subtree is the evidence, and it
says the work is not done.**

### What this unwinds

`mkqf` was moved off this epic in PR #967, by the session that had parented it
here and so made the finding worse by one. **That move is now unnecessary** —
with this epic open, `mkqf`'s original parenting was correct, and it is the
honest one: `mkqf`'s larger half is this epic's eleven deployment beans. #967 is
closed rather than merged, and its reasoning is preserved here.

### For stream 4

The `bean-rollup-baseline.json` entry for this epic in PR #962 **should now stop
matching**, which is the property that file has so it shrinks rather than
fossilises. Not edited from here: #962 is stream 4's and unmerged, and the
baseline is its file to keep honest.

**Nothing was closed, scrapped or deleted.** Only this epic's own claim about
itself is corrected.
