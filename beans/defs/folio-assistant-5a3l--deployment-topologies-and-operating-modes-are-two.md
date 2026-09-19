---
# folio-assistant-5a3l
title: 'DEPLOYMENT: topologies and operating modes are two axes, not one list of modes'
status: in-progress
type: epic
priority: high
created_at: 2026-09-19T08:52:35Z
updated_at: 2026-09-19T08:52:35Z
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

- [ ] `docs/proposals/deployment-topologies.md` exists and every scenario named
      in #363 is a point in the axis product, with none left over
- [ ] each scenario has a child bean
- [ ] the three review issues #363 asks for are open and linked here
- [ ] the BA has said whether the axes are the right axes — that is the sign-off
      this epic is waiting on, and no child should be implemented before it
