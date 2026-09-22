---
name: ig-publisher-reduction
description: >
  The phased transition that reduces the IG Publisher to AST + QA — five
  phases, each with an exit criterion that is measured rather than asserted,
  and the staleness contract that makes an AST-backed staging build honest.
  Read before starting any phase, and before claiming one is done.
---

# ig-publisher-reduction

> Skill id: `ig-publisher-reduction` · Package: `fhir-ig-base` · Instance:
> `fhir-harness` · Bean `kn0t`

Get to the point where the IG Publisher is needed **only** to produce an AST
and a QA record, with rendering owned by the just-the-docs pipeline.

## What the owner asked for, verbatim

> i want to slowly get rid of IG publisher in the publication/iteration pahse.
> you or sibling should be working on AST dump as cache of published IG. we can
> use this for iterative delta's (if we dont care about indexing/versioning so
> much in STAGING, we need full IG AST rereun)

and, on the second ingested IG:

> i dont want the. /html generated... just the calculated versions, dependcies
> and such the AST end

Two things are being asked for at once and they are separable: **stop mounting
generated HTML** (a rendering change) and **cache an AST** (a build change).
The phases below do the first three before the second, because the first is
verifiable without a fork and the second is not.

## What the Publisher does that a cache cannot fake

State this before any phase, because it is what stops the transition becoming
"remove the Publisher":

- **Profile validation** against the declared FHIR version.
- **Dependency-closure resolution** with version pinning —
  `hl7.terminology`, `hl7.fhir.uv.cql`, `hl7.fhir.uv.cpg`,
  `hl7.fhir.uv.crmi`, `hl7.fhir.uv.sdc` for smart-base.
- **Terminology expansion** against a `tx` server.

None is reproducible from its own output. The end state is the Publisher
invoked *for these*, not the Publisher gone.

## The phases

| | does | exit criterion — MEASURED |
|---|---|---|
| **P0** | re-point the metadata→variables bridge; render one IG's `input/pages/` through just-the-docs | a named IG's pages render with Publisher metadata populating the Jekyll variables, and the page set matches the Publisher's for that IG |
| **P1** | derive navigation from `sushi-config.yaml`'s `pages:` and `menu:` | the derived navigation is diffed against the Publisher's and the difference is **empty or explained entry by entry** |
| **P2** | JSON-only representations; XML/TTL dropped from the render path | every dropped representation is **recorded as a refusal**, so "publishes no Turtle" and "we ignored its Turtle" stay distinguishable |
| **P3** | AST dump behind a flag on the fork; staging renders from cached AST | a staging page built from cache carries a **visible** stale-until-full-run mark, and a reader can tell which facts are provisional |
| **P4** | Publisher invoked for AST + QA only | a release is still cut from a full build, and the artefact **says which** it came from |

### P0 is a re-point, not a build

`generate_smart_liquid.py` already computes `IG metadata → Liquid variables`
from `output/`, emitting `smart__<ResourceType>__<id>__<category>__<key>` across
`url__canonical`, `url__page`, `url__json`, `text__display`, `link__html` and
`elements__<key>`. It is aimed at the Publisher's own Jekyll.

**Lift it; do not redesign it.** And fix the defect on the way: it writes
`input/pagecontent/smart.liquid.md` *"processed by IG Publisher on the NEXT
build"*, so the surface takes two builds to converge — which is fatal to an
incremental loop and disappears when variables are computed and consumed in one
pass. Drop the `smart__` prefix: it is WHO's, and this layer does not know
about WHO.

### P1's exit criterion is a diff, deliberately

"Navigation looks right" is not a criterion. `sushi-config.yaml`'s `pages:` is
an **ordered map** and `menu:` carries the grouping, so the derived navigation
is computable and so is the Publisher's — compare them. An entry that differs
is either a bug or a deliberate improvement, and saying which is the work.

### P3 is where the honesty lives

A staging build from cached AST is **provisional**, and the owner named exactly
which facts go stale: *"the indices, dependecies may not be valid until full IG
publisher is run"*.

So the contract is:

> **An AST is a CACHE, never an authority.** Anything rendered from one
> declares, in the artefact a reader sees, that its indices, dependency edges
> and versions are unverified until a full run.

A stale mark that exists only in a log is not this. `ci-health`'s rule is the
same shape — *could not check is never green* — and the failure here would be
worse, because a page that silently serves stale dependencies looks exactly
like one that does not.

### P3 is BLOCKED on more than a fork

Measured, from `nsbb`: nothing in the Publisher's current exports carries
dependencies among Libraries, PlanDefinitions or Measures — **458 artefacts,
61 % of smart-immunizations**, the CQL and decision-logic core, with no
dependency edges at all. An AST that stops at terminology cannot support
iterative deltas over the part of an IG that actually changes.

So P3 depends on [`ig-publisher-fork`](ig-publisher-fork.md) delivering the
logic-layer edges, not merely on a dump existing. Re-derive that 61 % before
quoting it.

## What is NOT settled, and must not be decided by drift

- **`transform_dmn.py` emits HTML**, which the JSON-only contract does not take
  as a representation. Structured output, or embedded asset? Open.
- **"Parity-ish"** needs a stated checklist of asset types and page kinds
  before MVP is declared. The ceiling is a **data** limit: a page kind whose
  source the Publisher does not emit cannot be rendered at any effort, and
  belongs on the fork's ask rather than on the parity list.
- **Whether P4 keeps a `tx` dependency in staging.** Expansion is the slowest
  step and the one most likely to be unavailable offline.

## Do not

- Declare a phase done on an impression. Each criterion above is a measurement
  or a diff; if you cannot run it, the phase is not done.
- Collapse P2 into P0. Dropping representations while the renderer is also
  changing makes a missing page and a refused representation indistinguishable.
- Treat a green gate set as a rendered page. `preview:site` exists because a
  generator's output looked right while kramdown gave 22 headings one anchor.
