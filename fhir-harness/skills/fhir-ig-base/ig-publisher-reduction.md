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

Measured, from `nsbb`, re-derived 2026-09-23 and it **holds exactly**: nothing in
the Publisher's current exports carries dependencies among Libraries,
PlanDefinitions or Measures — **458 artefacts, 61 % of smart-immunizations**
(Library 279 + PlanDefinition 138 + Measure 41 of 748), the CQL and
decision-logic core, with no dependency edges at all. The index's field set is
`canonical, category, dak, description, id, key, materialization, name,
published, resourceType, title, version` — there is **no edge field**, so this
is not "edges are missing" but "this export has nowhere to put one", and the
exit criterion is **unsatisfiable** against it rather than merely hard (`kn0t`).
An AST that stops at terminology cannot support iterative deltas over the part
of an IG that actually changes. Re-derive that 61 % before quoting it.

#### There is a second route to the edges, and it needs no fork

`content/pipeline/fsh-cone.ts` (merged, from `267x`) builds the same IG's graph
from **source** — `.fsh` + `.cql` — where the export side is the Publisher's
output. Both are true at once: 2,478 source edges, 0 export edges. Measured on
smart-immunizations 2026-09-23 (`f4gj`, reproduce with
`scripts/measure-logic-layer-edges.ts`):

- The 458 map onto FSH source **1:1, zero unmatched ids**.
- **The edges are there.** After FSH `RuleSet` parameter substitution — what
  SUSHI does before the Publisher sees a resource — **458 of 458** logic
  artefacts carry an edge to another logic artefact, reaching 458 distinct
  targets.

**So the blocker is real but this section's inference was too strong.** P3 does
not depend on a fork for the *existence* of logic-layer edges; those are in the
IG source at full per-artefact resolution. What the fork uniquely delivers is
**resolved, version-pinned, cross-package** edges.

#### ...and it is not a route today

`fsh-cone` **as merged** extracts none of them. For all 458 artefacts it reaches
**8 distinct targets, every one a shared `RuleSet`** — **0 logic→logic edges**.
Aggregate "coverage" reads 99.8 %, which is boilerplate: every Library's mean
out-degree is exactly **1.00** and all 279 point at the same node, so the graph
cannot tell one Library from another. Both staleness directions are wrong — a
change to a Library's own CQL marks **nothing** stale; a change to
`LogicLibrary.fsh` marks **all 279**. **Break any such number down by resource
type**; the aggregate hid this.

Two separable causes: **(a)** `fsh-cone`'s `Library ↔ cql (by name)` edge is
guarded on `node.id`, and all 279 Library instances omit `Id:` and rely on
SUSHI's name→id default, so the edge fires 0 times; **(b)** PlanDefinition and
Measure write their library edge *inside a parameterised RuleSet*
(`* library = Canonical({library}Logic)`), which needs SUSHI's substitution to
recover.

#### What a source edge still cannot carry

Even with (a) and (b), the second route answers *which artefact* is stale, not
*what a reader must be told*. It cannot carry **version pinning** (`resolveRef`
strips `|version`, and `PlanDefMain` takes `library` and `version` as separate
parameters that are never associated), **cross-package references** (dropped by
design — `InstanceOf` contributes 3 edges across the whole IG because 179 of the
458 are `InstanceOf:` a cpg/cqfmeasures profile URL), or **post-SUSHI
expansion** except by reimplementing SUSHI, where one silently wrong edge is
precisely what the staleness contract forbids. Rendering-time coupling is
invisible to it too; a cone is a **lower bound**.

So: the second route can supply the **dependency-edge** third of P3's visible
mark and the rebuild set behind it, the **index** third only as a lower bound,
and the **version** third not at all. [`ig-publisher-fork`](ig-publisher-fork.md)
is still what closes P3 — for versions and package closure, not for the
existence of logic-layer edges.

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
