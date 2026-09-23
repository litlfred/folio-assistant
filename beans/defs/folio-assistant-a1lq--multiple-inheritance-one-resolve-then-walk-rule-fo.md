---
# folio-assistant-a1lq
title: 'MULTIPLE INHERITANCE: one resolve-then-walk rule for harness instances and node kinds — fully resolve the ordered dependency tree, then walk deepest-first from bootstrap/'
status: completed
type: task
priority: normal
created_at: 2026-09-23T06:15:36Z
updated_at: 2026-09-23T07:10:03Z
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
- [x] the roast is held and answered here, and nothing is built first
- [x] one resolver is used by instance resolution AND node-kind composition; the second `flattenDependencies` is gone or delegates
- [x] a diamond resolves once; a cycle and a missing dependency are reported problems (tests for each)
- [x] a same-depth field conflict between two parents is reported; an explicit child override is allowed (test)
- [x] `TodoNodeSchema` and 423d's review comment declare their parents and are composed by the resolver

## Roast, held 2026-09-23 (session_017nyJj3PsjvszpF3DyGeBgE): measured, nothing built

### First finding: everything this bean fixes is latent today

- **Instances.** No instance declares more than one `needs`. The whole graph
  is a single chain, `bootstrap → cat-harness → folio-assistant-core →
  fhir-harness → smart-base`, and four leaves hang off `smart-base`/`smart-ig`.
  **There is no diamond anywhere in the repository**, so the "diamond read as
  cycle" defect has never fired. It fires on the first instance that needs two
  others.
- **Node kinds.** Exactly ONE composition has two parents: `TodoNodeSchema` =
  `CarriedNoteSchema` (9 fields) + `ThemedTodoFieldsSchema` (1 field), with
  **zero overlapping keys**. The 18 spreads of `kgNodeLabelShape` are a mixin of
  two optional fields, not a second parent kind.
- **423d is not technically blocked.** A review comment has one parent (todo).
  It is sequenced after this bean so that it is the first kind composed by the
  resolver rather than a retrofit, which is a choice, not a dependency.

What follows: build this small and as prevention. Every test below has to
construct its own diamond, because the corpus has none to find.

### Q1: C3 or plain deepest-first? **Deepest-first (topological) is enough, *given* the conflict rule.**

C3's job is to pick a winner among parents that do not depend on each other,
so that order carries meaning. This bean already says such a conflict is
REPORTED, never won by order. Under that rule the composed result does not
depend on which topological order is chosen, so C3 would add a failure mode
(an "inconsistent MRO" on a hierarchy that is otherwise valid) and buy nothing.

**Correction to the bean's own wording: "same depth" is the wrong criterion.**
The right one is *incomparable*: neither node reaches the other. A
counter-example: the root needs A and B, and B needs D. A (depth 1) and D
(depth 2) both define key `k`. Their depths differ, so a same-depth rule lets
deepest-first put D first and A later, and A silently wins. A and D are
unrelated, so this must be REPORTED. An override is legitimate only from a
node that reaches the node it overrides, and only the child that reaches
both may settle a conflict between two.

*Falsifier:* a caller that relies on list order between unrelated layers,
for example two unrelated instances providing the same skill id and wanting
"later wins". There is none today, because the graph is a chain. The first
build step adds the test that would catch one.

### Q2: 79t3. **A consumer, not the same resolver.**

79t3's type set is a **union** of markers over the resolved closure. A union
is commutative, so it needs the closure and its problems (missing, cycle) and
does not need an order at all. It calls the resolver and folds. Its filename
questions are independent of this bean.

### Q3: where node kinds declare their parents. **Not `graph-kind-registry.ts`.**

That registry holds GRAPH kinds (directories such as `todo-items` and
`bean-defs`), not node schemas. A node kind is identified by its `$schema` tag
(`folio-todo/v1`). Proposal:
- a small harness-owned `schemas/node-kind-registry.ts`, with entries of the
  form `{ id, parents: string[], shape }`;
- a parent may be a tagged kind OR a named mixin (`themed` has no `$schema`
  of its own);
- core registers `folio-review-comment/v1` into it, the same way core
  already registers the `folio` graph kind (`REGISTRATION_MODULE`);
- the composed Zod schema is DERIVED by walking the parents in resolver order;
- a key defined by two incomparable ancestors is thrown at registration, so
  the first test that imports the kind fails.

`kgNodeLabelShape` is left as a spread: moving 18 call sites is not this bean.

### Q4: the two `flattenDependencies` functions. **One survives.**

- Move the pure Kahn function out of `scripts/dependency-order.ts` into
  `schemas/`. No non-test module under `schemas/` imports `scripts/` today,
  and that direction should stay clean. Repoint its three callers
  (`render-order.ts`, `harness-tiles.ts`, tests).
- `harness-config.ts` splits into two passes:
  1. **resolve**: collect every reachable instance and its edges, recording
     missing and unreadable ones;
  2. **order**: call the one flattener, which gives foundation-first, i.e.
     deepest-first.
  Its own `flattenDependencies` goes away. It has five internal callers plus
  `po-resolve.ts` and `cat-harness.ts`.
- A diamond is resolved once, keyed by absolute root. `seen` is no longer
  shared across sibling branches as a cycle guard.

### Decisions this leaves open

1. **The runtime policy on a MISSING dependency** (asked 2026-09-23). Today it
   is skipped silently. A cycle is unambiguous (throw), but a missing
   dependency is also what an uncloned git-URL dependency looks like in a
   partial checkout.
   **Ruled by the owner, 2026-09-23: warn at runtime, and the gate fails.** At
   runtime the missing layer is named in a warning and the run continues
   without it. A gate check fails on it, so it cannot merge unnoticed. A cycle
   always throws.

## Built 2026-09-23 (session_017nyJj3PsjvszpF3DyGeBgE)

- `schemas/dependency-order.ts` (moved from `scripts/`) is the one flattener.
  It gains `ancestorsOf` and `findConflicts`. The conflict test is
  *incomparable*, not same-depth, as the roast corrected.
- `harness-config.ts`: `resolveInstanceGraph` resolves every node once and
  THEN orders it with that flattener. `orderedDependencies` throws on a cycle
  and warns on a missing dependency (the owner's ruling). The old
  `resolveDependencyTree` and `flattenDependencies` are gone, and all callers
  are repointed.
- `schemas/node-kind.ts`: `nodeKind(id, parents, own, { overrides })`.
  Parents are objects, not registry ids, so there is no load order to get
  wrong. It refuses:
  - a field two unrelated ancestors define;
  - a redefinition the child did not declare;
  - a declared override that overrides nothing.
- `TodoNodeKind` = `carried-note` + `themed` + its own fields. The composed
  shape is key-for-key identical to the old `.extend()` + spread (tested).
- `check:instance-graph` is in the gate set: 19 instances, clean.

Left for 423d: its review comment declares `TodoNodeKind` as its parent.
That is the last unchecked box, and it is 423d's work.

The last box closed 2026-09-23: `ReviewCommentKind` declares `TodoNodeKind` as its parent (the 423d PR). a1lq is done.
