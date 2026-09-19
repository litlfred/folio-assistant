---
# folio-assistant-5a3l
title: 'DEPLOYMENT: topologies and operating modes are two axes, not one list of modes'
status: in-progress
type: epic
priority: high
created_at: 2026-09-19T08:52:35Z
updated_at: 2026-09-19T09:01:40Z
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
- [ ] the BA has said whether the axes are the right axes — that is the sign-off
      this epic is waiting on, and no child should be implemented before it

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
