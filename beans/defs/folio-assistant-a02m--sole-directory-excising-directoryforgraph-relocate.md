---
# folio-assistant-a02m
title: 'SOLE-DIRECTORY: `directoriesForGraph(…)[0]` states an assumption nothing checks — and `schemas` already has 4 homes'
status: completed
type: bug
priority: high
parent: folio-assistant-kupb
created_at: 2026-09-20T11:24:49Z
updated_at: 2026-09-20T11:24:49Z
---

`ec24133a` ("excise directoryForGraph — and it took a silently-dead CI gate
with it") removed this, on the owner's instruction "excise singulsar":

```ts
export function directoryForGraph(root, graph, registry = defaultGraphKinds) {
  return resolveDirectories([{ name: "(local)", root, own: true }], registry)
    .find((d) => d.graphs.includes(graph))?.absPath;
}
```

## Correction: `[0]` was DELIBERATE, and this bean first said otherwise

The first version of this bean called the rewrite to `directoriesForGraph(…)[0]`
a relocation of the defect. That overstates it, and the overstatement would have
led to the wrong fix. `directoriesForGraph`'s own doc comment states the design:

> *A caller that genuinely wants one writes `directoriesForGraph(...)[0]`, so
> the assumption is visible where it is made and greppable across the repo.*

So `[0]` is meant to be the place a caller SAYS "I expect one home". That is a
real improvement on a function that said nothing.

**What is still wrong is narrower and it is this: the assumption is stated but
never checked.** `[0]` asserts "there is one" and then silently takes the first
when there are several. Greppable is not checked. The whole point of moving the
assumption to the call site was to make it visible — and an assumption nothing
tests is visible only to somebody already looking for it.

## Measured 2026-09-20 — it is already wrong, not only about to be

From the `cat-harness` root:

| graph | homes | `[0]` sites |
|---|---|---|
| **`schemas`** | **4** — `cat-harness/`, `folio-assistant-core/`, `large-datasets/`, `detangle/` | **4** |
| `schemas` from the `detangle` root | 2 | — |
| `library` | 1 (2 after `frs5`) | 12 |
| `uploads` | 1 | 5 |
| `translation-sources` | 1 | 8 |
| `fsh-guts` | 1 | 5 |
| `todos` | 1 | 2 |
| `memory` | 1 | 1 |

`schemas` has FOUR homes today and four call sites take the first. That is not
a future defect waiting on `frs5`; it is live. `schema-nodes.ts` was fixed on
2026-09-20 — one of five — and the comment it left says so.

## The taxonomy is THREE, not two

Reading the four `schemas` sites is what falsified "sole vs fan-out". None of
them wants either. `check-tools`, `harness-schema-export`, `gen-schema-docs`
and `fsh-guts/generate-docs` all compose `join(schemasRoot(root), "skills")` or
`"generated"` — they want **this instance's OWN schemas directory**, and the
other three homes arrive through the dependency overlay. Asking "how many
declare it" was the wrong question for them all along.

| the caller wants | today | should be |
|---|---|---|
| every home — scan them all | `directoriesForGraph(…)` | `directoriesForGraph` — unchanged |
| exactly one, and it is a bug if not | `…[0]` — silent | `soleDirectoryForGraph` — refuses |
| the one **at its own root** | `…[0]` — right by ordering luck | `instanceDirectoryForGraph` |

The third is invisible in today's code precisely because it works by accident:
`resolveDirectories` happens to order the root's instance-scoped declarations
first.

### Correction: `own` is NOT the discriminator

The third accessor was first written to filter on `ResolvedDirectory.own`, and
that was wrong. Measured: from the `cat-harness` root, **all four** `schemas`
directories are `own` — every one is declared by cat-harness's own
`harness.json`, three of them with `scope: "repository"` because this
repository stages three future instances as sibling top-level directories.
`own` separates the root from a DEPENDENCY, which is a different question.

The discriminator is `scope`, and `rootForScope` is where it already means
exactly this: a repository-scoped entry resolves against the REPOSITORY root,
everything else against the instance root. Caught by running the accessor
rather than by reading it — `ownDirectoryForGraph(cat-harness, "schemas")`
threw on all four instead of returning `cat-harness/schemas`.

## Done when

- [ ] An accessor exists that **refuses** when a graph resolves to more than
      one directory, rather than picking. Refusing is the property; arity is
      not — a silent singular is what got excised, and re-adding one would be
      the same bug with a new name.
- [ ] The 32 `[0]` sites are migrated, or each is annotated with why it
      genuinely wants the first.
- [ ] A gate fails on a NEW `directoriesForGraph(...)[0]`, since the last fix
      was one site at a time and that is how thirty-one were left.
- [ ] Done BEFORE the `frs5` move, not after: fix the detector, then make the
      thing it detects true, so a site that needs both fails by name.

## Falsifier

Already fired once, which is why the taxonomy above has three rows rather than
two: the four `schemas` sites want neither "the only one" nor "all of them".
If migrating turns up a fourth shape, the answer is another named question, not
a flag on an existing one.
