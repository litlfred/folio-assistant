---
# folio-assistant-5kn6
title: 'NEEDS ORDERS, DEPENDENCIES OVERLAY: no smart-* instance declares config dependencies, so no skill overlay composes in the stack'
status: todo
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
   it merges two relations #727 deliberately split, and `AGENTS.md` warns that
   merging the two compositions gives a closure too broad to fail an audit.
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
