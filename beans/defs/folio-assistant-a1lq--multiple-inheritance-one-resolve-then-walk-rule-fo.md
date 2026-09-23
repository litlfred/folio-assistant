---
# folio-assistant-a1lq
title: 'MULTIPLE INHERITANCE: one resolve-then-walk rule for harness instances and node kinds — fully resolve the ordered dependency tree, then walk deepest-first from bootstrap/'
status: todo
type: task
created_at: 2026-09-23T06:15:36Z
updated_at: 2026-09-23T06:15:36Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-23 (session_017nyJj3PsjvszpF3DyGeBgE), verbatim, prompted by the review-comment todo subtype (423d) being built on `TodoNodeSchema`:

> *"thhemed todo? we didnt discuss mult-iheritence of harness or node kinds. we need to have that. once depedencies of (orderd) dependecy tree are full resolve, walk tree in order starting w/ deepest depenencies (bootstreap/)"*

> *"make sure consistent"*

## The rule, as the owner stated it

1. **Resolve first.** The ordered dependency tree is fully resolved before anything is walked.
2. **Then walk in order, deepest dependency first.** `bootstrap/` comes first and the root last. A later layer builds on, and may override, what an earlier one established.
3. **The same rule for both kinds of inheritance:**
   - **harness instances**, where an instance `needs` several others;
   - **node kinds**, where a schema type has several parents, for example a review comment IS a todo, which IS a carried note AND is themed.

## Measured 2026-09-23: three inconsistencies today

**1. Instances resolve and walk in one interleaved pass, not resolve-then-walk.** `resolveDependencyTree` in `cat-harness/schemas/harness-config.ts` recurses and builds as it goes. `flattenDependencies` (the same file) emits post-order, so the order IS deepest-first. But the resolution is not complete before the walk begins, and two defects follow from that:
- **A diamond is indistinguishable from a cycle.** `seen` is one Set shared across sibling branches. If A needs B and C, and both need D, then D is resolved under B and returns `[]` under C, behind a comment saying `// cycle`. A real cycle is dropped just as silently.
- **A dependency that cannot be found is skipped:** `if (!rootPath) continue`. A missing dependency reads as "no dependency".

**2. Two different functions are both named `flattenDependencies`.**
- `harness-config.ts`: tree post-order, used for instances, directories and skills (`resolveSkillDirs`, `declarationChain`).
- `cat-harness/scripts/dependency-order.ts`: Kahn's algorithm over a declared hierarchy, reporting `cycle`, `missing` and `duplicate` as problems, with "a partial order over a broken graph is the shape that gets run anyway" as its stated reason. Used by `render-pipeline.ts` and `harness-tiles.ts`.

So the platform already contains the resolve-then-walk the owner describes. It just is not the one instances use.

**3. Node kinds have no rule at all.** Multiple parents are composed with Zod `.extend()` plus object spreads. For example, `TodoNodeSchema = CarriedNoteSchema.extend({ ...ThemedTodoFieldsSchema.shape, … })`. When two parents define one field, whichever spread comes last wins, silently. Nothing declares a node kind's parents, so nothing can walk them.

## What "consistent" should mean (to roast before building)

- **One resolver.** Build the full graph of `needs` or parent edges. Report cycle, missing and duplicate as problems, never as an empty result. Only then emit a linear order, deepest first with `bootstrap/` first. Instances and node kinds both call it. `dependency-order.ts` is the candidate, since it already refuses to order a broken graph.
- **A diamond is resolved once and placed at its deepest position**, not dropped under the second branch.
- **Ties.** Two unrelated dependencies at one depth are ordered by their declared order. That is deterministic and changes only when declarations change, which is what `dependency-order.ts` already promises.
- **Conflicts.** When two parents at the same depth both define one field or directory id, that is a CONFLICT to report, never a silent last-writer-wins. A later (shallower) layer overriding an earlier one is the intended override, and must be explicit on the child.
- **Node kinds DECLARE their parents** (for example `parents: ["carried-note", "themed"]` on the node-kind registry), so the walk has edges to follow. Today's spread order would become derived from the declaration, not authored.

## Open questions for the roast

- **The C3 question.** Is plain deepest-first enough, or is C3 linearization (Python's MRO) needed to keep each parent's own order monotonic? C3 fails loudly on inconsistent hierarchies, which fits "failures are never silent".
- **79t3 overlap.** 79t3 ("a repo's type set is the markers it carries, closed under the dependency tree") is the TYPE side of the instance half. Is that the same resolver, or a consumer of it?
- **Where the node-kind parent declaration lives.** Probably the graph-kind or node-kind registry in `schemas/graph-kind-registry.ts`, which harness owns, with core's types (the review comment) registering into it.

## Done when
- [ ] the roast is held and answered here, and nothing is built first
- [ ] one resolver is used by instance resolution AND node-kind composition; the second `flattenDependencies` is gone or delegates
- [ ] a diamond resolves once; a cycle and a missing dependency are reported problems (tests for each)
- [ ] a same-depth field conflict between two parents is reported; an explicit child override is allowed (test)
- [ ] `TodoNodeSchema` and 423d's review comment declare their parents and are composed by the resolver
