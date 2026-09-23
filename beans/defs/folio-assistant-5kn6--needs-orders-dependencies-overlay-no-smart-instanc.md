---
# folio-assistant-5kn6
title: 'NEEDS ORDERS, DEPENDENCIES OVERLAY: no smart-* instance declares config dependencies, so no skill overlay composes in the stack'
status: completed
type: feature
priority: high
created_at: 2026-09-22T21:51:54Z
updated_at: 2026-09-22T21:51:54Z
parent: folio-assistant-uhkv
---

Found while verifying issue #975's own claim, and it **falsifies that claim**.

## Two mechanisms, two files, and I conflated them

| | file | drives |
|---|---|---|
| `needs` | `<name>.json` (the declaration) | layer ORDER — `dependency-order.ts` topological sort, `harness-tiles.ts` navbar spine |
| `dependencies.folioAssistant` | `<name>.config.json` (the config) | the skill and content OVERLAY — walked recursively by `resolveSkillDirs` |

Issue #975 asserted that *"the dependency walk, the navbar ordering and the
skill overlay all read `needs`"*. **Only the middle one is true.** The overlay
reads the config, which #727 split from the declaration precisely because a
declaration says what an instance IS and a dependency is what it USES.

## Measured, after fixing `needs`

With the whole chain correct — `fhir-harness → smart-base → {smart-l1,
smart-dak, smart-ig} → {smart-trust, smart-immunizations}` — `resolveSkillDirs`
returns:

| instance | skill dirs reachable |
|---|---|
| `smart-trust` | **0** |
| `smart-ig` | **0** |
| `smart-base` | 1 — its own `smart-base/skills` |
| `fhir-harness` | 1 — its own `fhir-harness/skills` |

Each sees its own and nothing below it. And the cause is plain:

```
folio-assistant.config.json   dependencies -> folio-assistant-sci
bootstrap.config.json         (none)
cat-harness.config.json       (none)
smart-trust.config.json       (none)
who-iris.config.json          (none)
```

**One instance in the repository declares a config dependency**, and it is the
root. So the overlay composes nowhere in the smart stack, and `smart-trust`
cannot reach `ig-build-pipeline` or `ig-render-jekyll` — the two skills that
govern exactly how its IG is built and rendered.

## Why this was invisible

Because `needs` being right LOOKS like the stack being wired. The navbar draws
the correct spine, `dependency-order` sorts correctly, every gate is green —
and no skill crosses a layer boundary. That is the `dh4f` shape at the edge
rather than at the directory: a consumer resolves an empty set and reports a
clean run over it.

## The open question, which is not mine to settle

Three shapes, and they are not equivalent:

1. **Derive the config dependency from `needs`.** One place to state the stack,
   which is `smart-stack-layering`'s own argument against a `layer` field. But
   it merges two relations #727 deliberately split. ~~and `AGENTS.md` warns
   that merging the two compositions gives a closure too broad to fail an
   audit~~ — **STRUCK 2026-09-22: that citation is false.** It is about Roles
   (`inherits` versus the scoped subprocess stack, `role-model.md`), not about
   dependencies, and it was the strongest reason this bean gave for not
   deciding. Left struck rather than deleted so the error is legible; see
   §"Two errors of mine" below.
2. **Declare `dependencies` in each `<name>.config.json`, by hand.** Keeps the
   split. Two places to state one fact, which is two places for it to drift —
   and this bean exists because one of them was already wrong.
3. **Neither — the overlay is not wanted across these layers.** Defensible if
   skills are meant to be fetched by `skill_fetch` rather than composed. Needs
   saying out loud, because today it is indistinguishable from an oversight.

## Done when
- [ ] the owner rules between the three shapes, or names a fourth
- [ ] whichever is chosen, a check exists so that `needs` and the overlay cannot
      disagree silently again
- [ ] `smart-trust` can reach `ig-build-pipeline` — or it is recorded why it
      should not

## RULED 2026-09-22 — and this bean asked a settled question

The owner:

> i want to adopt the sushi/fhir IG(/npm?) versioning dependencies for
> computing overlays.  SHAs are for provenance, digital signing, staging.  we
> need both, different needs.

**None of the three shapes above was the answer, and the answer was already
written down** — `cat-harness/docs/proposals/instance-versioning.md` §3.3, on an owner
ruling of 2026-09-20: *"sha is for staging, regernecing in published SEMVER"*,
with `check:published-refs` already implemented as its gate.

### Two errors of mine, recorded rather than quietly fixed

**1. A fake citation.** This bean argued against deciding by quoting
`AGENTS.md` — *"merging the two compositions gives a closure too broad to fail
an audit"* — as if it governed `needs`/`dependencies`. **It is about Roles**:
`inherits` (IS-A, static) versus the scoped subprocess stack, in
`role-model.md`. An analogous argument, not an authority, and used as one. The
same wrong citation went into PR #977's body and its merge commit; it is
removed above.

**2. Proposing options for a settled question.** Offering three shapes made the
owner answer twice, and the second answer had to overrule a confident-sounding
reason that did not exist. The rule is now in
[`opening-brief`](../../cat-harness/skills/folio-core/opening-brief.md)
§"Before you offer options, check whether it is already ruled".

### Why the scheme was missed, and it is not only carelessness

`instance-versioning.md` lives in `fsh-guts/proposals/`. The `fsh-guts` graph
kind is declared *"deprecated and throwaway structured content … the
destination for anything that would otherwise be deleted"* and is deliberately
absent from the published site.

**Seven skills and four code modules cite `fsh-guts/proposals/*` as the
governing scheme** — `harness-config.ts` calls one *"the full scheme"*,
`check-published-refs.ts` calls itself *"its §3.3 gate"*, and
`directory-conventions` §"Pinning a reference" points at the same file. So the
live design corpus sits under a kind whose name is an instruction to skip it,
and an agent reading the graph-kind table learns exactly that.

`directory-conventions`' row for the kind now says so. **Whether live proposals
should live under a kind named for throwaway is the open question**, and it is
this bean's, below.

## What shipped

`needs` now DRIVES the overlay for edges inside one checkout.
`dependenciesFromNeeds` derives a staging-tier `{name, path}` per `needs`
entry that resolves to a sibling instance; `resolveDependencyTree` merges them
under authored config entries, which win on name because a config entry can
say what a derived one cannot — a git URL, a version, a `provides` narrowing.

`FolioAssistantDependency` gains `id` and `version`, with `ExactVersionSchema`
refusing ranges: FHIR pins exact versions and `dependsOn` has no field a range
fits, and alignment downstream is the owner's hard constraint. `ref`/`git` keep
their place and change status — **how to fetch while staging, and the
provenance of the bytes, not what is depended on.**

Measured: `smart-trust` went from **0 reachable skill directories to 8**, and
now reaches `fhir-harness/skills` — `ig-build-pipeline` and `ig-render-jekyll`,
the two governing how its own IG is built.

A derived edge carries **no version**, deliberately: one checkout is the
staging tier, and §3.1 settles that most instances are not publishable.

## Still open
- [ ] should live proposals live under a kind named for throwaway, or move?
- [ ] `publishable`, `id` and `version` are *accepted* by the schema; no
      instance declares them yet, and §4's computed bump is unbuilt
- [ ] a check that an authored dependency does not contradict `needs`


## CLOSED on evidence, 2026-09-23 — the premise is falsified

Not by authorship. Re-measured on `main` at `80c18ac`, the overlay composes
down the `needs` chain:

| instance | this bean recorded | measured now |
|---|---|---|
| `smart-trust` | **0** | **6** |
| `smart-ig` | **0** | **6** |

```
smart-trust  (6)
  bootstrap/skills
  bootstrap/tools
  cat-harness/skills
  folio-assistant-core/skills
  fhir-harness/skills
  smart-base/skills
```

Commit `75c60b92` — *"needs drives the overlay"* — is what closed it:
`resolveInstanceGraph` now derives dependencies from `needs` and merges them
UNDER the authored config, so a `smart-*` instance inherits without a
hand-authored `dependencies.folioAssistant`. That matters, because a
hand-authored copy of `needs` would be the same fact in two places.

**`smart-trust` and `smart-base` resolve the same six, and that is correct.**
`smart-ig` contributes nothing because it declares no `skills/` directory — by
design, following the `folio-assistant-core` precedent. Nothing is missing.

## What the re-measurement DID find

Two defects, both in the same machinery and neither this bean's: bean `fuve`,
[#1037](https://github.com/litlfred/folio-assistant/issues/1037),
[#1038](https://github.com/litlfred/folio-assistant/pull/1038). An unresolvable
`needs` name was dropped silently with `check:instance-graph` asserting the
opposite, and `repoRootFor` climbed out of the checkout for the one instance
declared at the repository root. They are filed separately rather than folded
in here — widening a closed bean into the findings that closed it loses both.
