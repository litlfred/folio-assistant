---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'ig-publisher-fork'
parent: Skill instructions
---

{: .note }
> Generated from [`fhir-harness/skills/fhir-ig-base/ig-publisher-fork.md`](https://github.com/litlfred/folio-assistant/blob/main/fhir-harness/skills/fhir-ig-base/ig-publisher-fork.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/fhir-harness/skills/fhir-ig-base/ig-publisher-fork.md){: .fa-edit-source }

{% raw %}
# ig-publisher-fork

> Skill id: `ig-publisher-fork` · Package: `fhir-ig-base` · Instance:
> `fhir-harness` · Bean `a9tx`

The brief for an agent taking a **local, experimental** fork of the FHIR IG
Publisher, so that an AST can be emitted and cached.

## Which repositories, and why only one

| repository | holds | needed for |
|---|---|---|
| `HL7/fhir-ig-publisher` | orchestration, the loaded resources, **`DependencyAnalyser`**, `CqlSubSystem`, the metadata exports | the dump, the toolchain record, **the logic-layer dependency edges** |
| `hapifhir/org.hl7.fhir.core` | the renderer, the validator, dependency loading | **page-fragment provenance** only |

**Corrected 2026-09-30, by reading the code.** This skill said a
publisher-only fork could not satisfy the central requirement because the
logic-layer edges are produced in core. They are not.

- `DependencyAnalyser` is in the **publisher**
  (`org.hl7.fhir.publisher.core/.../igtools/publisher/`). Its `analysePD` and
  `analyseAD` are empty stubs, and Library and Measure are not dispatched.
  That is the whole criterion-2 gap.
- `CqlSubSystem` already attaches CQL `depends-on` to each Library
  (`AdjunctFileLoader`), so Library→Library edges exist in memory; nothing
  exports them.

Only page-fragment provenance needs core. Read upstream before re-quoting
either claim: this one was wrong for a week and was served to every agent that
read the declaration.

## The shape taken: a library ON TOP, not a fork IN it

Owner, 2026-09-30: *"a library building on top... DO NOT change existing code,
unless absolutely have to. remarshal/reuse/sub-class"*. So the work is
`ast-export/`, a separate Maven project on branch `claude/ast-export` of
`litlfred/fhir-ig-publisher`. It depends on the **released**
`org.hl7.fhir.publisher.core` from Maven Central, is not a module of the root
pom, and changes no Publisher file.

- `AstPublisher extends Publisher` and overrides nothing. It reads
  `getFileList()` after `execute()`.
- `AstFieldsAccess` is a read-only view of package-private `PublisherFields`,
  declared in the Publisher's package **inside the library**. A rename
  upstream fails to compile rather than failing at run time.
- Upstream's `DependencyAnalyser` is **reused unchanged**; `LogicEdges` sits
  beside it.

That makes "behind a flag, default byte-identical" true by construction for
the Publisher itself: a stock build never loads the library. What still needs
measuring is that `AstExportCli`'s own build writes the same `output/` as a
stock one.

## The tools an agent runs

In the fork, under `ast-export/`:

| tool | what | network |
|---|---|---|
| `scripts/run-real-igs.sh [work] [--byte-identical]` | W1/W2 on smart-trust and smart-immunizations, W2 per resource type | packages.fhir.org, tx.fhir.org |
| `scripts/w7-round.sh <work>` | one incremental round on a one-CQL-file change | same |
| `AstExportCli`, `AstPlanCli`, `IncrementalBuildCli` | export, plan a delta, rebuild the cone | export and rebuild: yes; plan: no |

Here, [`ig-ast-delta`](ig-ast-delta.md) lists, checks, diffs and renders what
those produce. Owner: **no GitHub Actions for now**, and any CI added later
**calls these same scripts**.

## Without packages.fhir.org: seeding the cache from npm

Some environments reach `registry.npmjs.org` but not `packages.fhir.org`
(this one, 2026-09-30). The npm account **`grahamegrieve`** publishes FHIR
packages there, and **the owner ruled it trusted**: Grahame Grieve founded HL7
FHIR and maintains the IG Publisher. That account is the trust anchor, and no
other account is.

`ast-export/scripts/seed-fhir-cache-from-npm.py` (Tool
`fhir-cache-seed-npm`) fills the FHIR package cache from it, with these rules:

- **Exact versions only.** A pin to `hl7.fhir.uv.cql#1.0.0` is never satisfied
  by 2.0.0. A build over substituted versions would measure a different IG
  while looking like the real one, and the owner chose exact-only over an
  "approximate" build.
- **Trusted, then verified.** A tarball is accepted only when its npm
  maintainers include `grahamegrieve`, and only after its published sha512
  integrity checks. npm's `0.0.1-security` placeholder (a package taken down
  as malicious; the unscoped `hl7.fhir.r4.core` is one) is refused. The real
  core packages are under `@hl7/`.
- **Nothing guessed.** Dependencies are followed through each package's own
  `package.json`. `current`, `dev` and ranges are reported as missing.
- **Provenance recorded** in `ast-export-npm-provenance.json` beside the cache.

**What it cannot do, measured 2026-09-30.** The mirror mostly carries the
latest version of each package. For smart-trust, 10 of the 30 exact versions
in its transitive closure are there. smart-immunizations needs
`who.template.root#current`, which is not on npm at all. So the seeder serves
IGs whose pins are current releases. **It does not replace packages.fhir.org
for the WHO IGs**, and a measurement taken over a partly seeded cache is not a
measurement of them.

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
      above. Built as `LogicEdges`; **not yet measured** on smart-immunizations
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
{% endraw %}
