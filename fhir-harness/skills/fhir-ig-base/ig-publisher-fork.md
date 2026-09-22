---
name: ig-publisher-fork
description: >
  Requirements for an agent working a local experimental fork of the IG
  Publisher — which repositories, what the AST must carry, what must not
  change, and the acceptance criteria. Read before forking, and before
  reporting a fork's work complete.
---

# ig-publisher-fork

> Skill id: `ig-publisher-fork` · Package: `fhir-ig-base` · Instance:
> `fhir-harness` · Bean `a9tx`

The brief for an agent taking a **local, experimental** fork of the FHIR IG
Publisher, so that an AST can be emitted and cached.

## Which repositories, and why both

| repository | holds | needed for |
|---|---|---|
| `HL7/fhir-ig-publisher` | orchestration, `recordOutcome()`, the metadata exports | the flag, the dump, the toolchain record |
| `hapifhir/org.hl7.fhir.core` | the renderer, the validator, dependency loading | **the logic-layer dependency edges** |

Both are git-reachable from this environment as anonymous reads.

**A publisher-only fork cannot satisfy the central requirement.** The edges
among Libraries, PlanDefinitions and Measures are produced where dependencies
are loaded, which is core. Forking only the publisher gives a better-shaped
dump of facts that still stop at terminology.

## The measurement that justifies the work

From bean `nsbb`, using the Publisher's current metadata exports as an AST
proxy across two real IGs:

| export | smart-trust | smart-immunizations |
|---|---|---|
| `valueset-ref-list.json` ValueSet→CodeSystem edges | 17 over 14 | 431 over 252 |
| `codesystem-ref-list.json` `uses` populated | 0 of 15 | 0 of 14 |
| `usage-stats.json` extension→path | 6 | 35 (+5 profiles) |

Two findings:

1. **`uses` is declared and never populated** — in *both* IGs.
2. **Nothing exports Library / PlanDefinition / Measure dependencies** — 458
   artefacts, **61 % of smart-immunizations**, the decision-logic core, with
   zero edges.

Re-derive both before quoting them. They are the reason for the fork; if a
later Publisher release closes either, the fork's scope shrinks accordingly and
that is a good outcome, not a wasted brief.

## Acceptance criteria

The AST must carry:

- [ ] **one structured record per resource**, keyed by canonical URL *and*
      version — an id alone collides across versions
- [ ] **dependency edges among Library, PlanDefinition and Measure** — the gap
      above, and the criterion a publisher-only fork fails
- [ ] **`uses` actually populated**, or an explicit statement that it cannot be
      — a declared-and-empty field is worse than an absent one, because a
      consumer cannot tell "no dependencies" from "not computed"
- [ ] **page-fragment provenance** — which source produced which output
      fragment, so a rendered page can be traced without re-running
- [ ] **the resolved dependency closure with pinned versions**
- [ ] **terminology expansion provenance** — which server, which version, and
      whether expansion actually happened; a build against a dead `tx` must be
      distinguishable from an IG with thin ValueSets
- [ ] **a `toolchain` object** — publisher version, core version, SUSHI
      version. `publisher.jar` is re-downloaded from the *latest* release on
      every WHO build, so without this an AST cannot say what produced it

And the fork itself must satisfy:

- [ ] **emitted behind a flag**, with default behaviour byte-identical when the
      flag is absent
- [ ] **upstreamable shape** — a flag and an additional writer, not a rewrite.
      A fork that cannot be offered back is a maintenance burden with no exit,
      and this one is explicitly *experimental*
- [ ] **no change to validation or rendering semantics.** If a fork build's
      `qa.json` differs from an upstream build's on the same input, that is a
      defect in the fork, and it is the first thing to check

## What the agent must not do

- **Do not treat the AST as an authority.** It is a cache: its indices,
  dependency edges and versions are unverified until a full run. Anything
  written to consume it says so — see
  [`ig-publisher-reduction`](ig-publisher-reduction.md) §P3.
- **Do not vendor either repository into this one.** The fork lives at its own
  remote. `toolchain-ownership`'s cutover rule is the general form: after a
  move, exactly one repository runs a thing.
- **Do not add WHO, DAK or SMART concepts to the fork.** The AST is a property
  of a FHIR IG. A DAK-shaped field in it makes the fork unofferable upstream
  and re-imports the layering violation `fhir-harness` exists to prevent.
- **Do not fix `uses` by inferring it.** If the information is not there,
  report that it is not there. An inferred edge in a dependency graph is
  indistinguishable from a real one downstream, and every ordering metric
  computed from it becomes unfalsifiable — the same argument `uses[]` carries
  on the editorial side.

## Reporting

A fork round reports: which repositories at which commits, which criteria are
met, which are not, and **what was measured rather than what was implemented**.
A criterion is met when an AST from a real IG is shown to carry the thing —
smart-immunizations is the right subject, because it is the IG whose 61 % gap
motivated the work.
