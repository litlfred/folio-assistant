---
# folio-assistant-4y2i
title: 'TOPOLOGY: sovereign cloud — hosted forge, jurisdiction-defined URLs, L4-L5 data stores'
status: todo
type: task
priority: normal
created_at: 2026-09-19T08:55:37Z
updated_at: 2026-09-19T09:01:53Z
parent: folio-assistant-5a3l
---

**Strawperson.** From [#363](https://github.com/litlfred/folio-assistant/issues/363):
"soverign cloud: hosted git server, staging and publcation URLs follows different
deployment pattern (jusidiction defined). in L4-L5 context may have data stores
like hapi. for (public health) portals, (health) digital wallets),etc. or health
worker decision spport. bean up to may strwperson and create issue to review
these."

## Strawperson position, to be argued with

| axis | value |
|---|---|
| forge | hosted git server inside the jurisdiction (GitLab, Gitea, …) — not GitHub |
| publication host | jurisdiction-defined URLs; no Pages |
| compute | cloud infrastructure the jurisdiction controls |
| model supply | open |
| data stores | may include HAPI FHIR at L4–L5 |
| outward facing | **yes** — portals, wallets, health-worker decision support |

## The one that is not just an axis value

"staging and publcation URLs follows different deployment pattern (jusidiction
defined)" is the hard requirement, and it is not a URL template. A jurisdiction
may mandate where an artefact may be served from, who may reach it, and under
what retention. The harness cannot hold a pattern per jurisdiction; it can hold
a **declaration** that a jurisdiction fills in.

That points the same way `4dbr` points for forges: the variation belongs at the
Tool / declaration layer, not in a branch in platform code. If a
jurisdiction-shaped literal ends up in `src/` or `content/pipeline/`, that is the
genericity failure this repository has paid for repeatedly.

## L4–L5 is a boundary, not a feature

A HAPI FHIR store is live clinical infrastructure. The harness authoring a DAK
and a running L4 deployment serving it are different systems with different
risk profiles. **The strawperson's position is that the harness does not talk to
a live data store; it produces artefacts a deployment consumes.** If that is
wrong, it is wrong in a way that changes the security model, so it needs saying
explicitly rather than discovering later.

## Distinguish from self-sovereign

Its sibling bean. The line drawn here: sovereign cloud is **outward facing**
(portals, wallets, decision support for health workers); self-sovereign is
**not** ("not designed for external facing services"). If that line does not
survive review, the two probably collapse into one topology with an
outward-facing axis.

## Review

https://github.com/litlfred/folio-assistant/issues/369, opened per #363's instruction. This bean is the input to
that review, not its conclusion.

--------

## Owner, 2026-09-24: **"Artefacts only"**

The strawperson's L4–L5 boundary stands for sovereign cloud: **the harness
never connects to a live clinical store** (HAPI FHIR or similar), for read or
write. It produces artefacts; a running deployment pulls and serves them.
This was asked right after 61tg ("a self-sovereign harness may hold
credentials"), and the owner chose to keep the two separate. Custody in
self-sovereign mode does not carry over to a live-store connection in
sovereign cloud.
