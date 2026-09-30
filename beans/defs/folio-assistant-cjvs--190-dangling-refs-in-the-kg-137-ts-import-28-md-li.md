---
# folio-assistant-cjvs
title: '190 dangling refs in the KG: 137 ts-import, 28 md-link, 25 bpmn-skill'
status: todo
type: bug
priority: normal
created_at: 2026-09-26T06:33:48Z
updated_at: 2026-09-30T11:10:02Z
parent: folio-assistant-vke6
---

`bun run kg:detangle`, measured 2026-09-26 on `main`:

```
Detangle — 697 nodes, 2828 edges, 190 dangling
```

Breakdown, from the tool's own JSON rather than from prose:

| via | count |
|---|---|
| `ts-import` | 137 |
| `md-link` | 28 |
| `bpmn-skill` | 25 |

A dangling ref is a link-shaped value that does not dereference — bean `blv9`
— at scale, in the graph the whole separation effort is computed over.

## Why this matters for the split rather than being tidying

Every separation metric is computed over these edges. `check:partition`
reports 0 wrong-direction across 1143 modules and `kg:detangle` reports 1
across 28 groups, and **both numbers are computed over a graph with 190 edges
that go nowhere.** Whether a dangling edge would have been a cross-edge, a
wrong-direction edge, or nothing at all is not knowable from the count.

So "0 wrong-direction" is 0 *among the edges that resolve*. That is not the
same claim, and nothing currently says which one is being made.

## The surprising bucket

**137 of 190 are `ts-import`** — not markdown rot, which is the usual shape of
this defect, but TypeScript imports the scanner could not resolve. That could
be scanner limitation (path aliases, `.js` extensions on `.ts` sources, barrel
re-exports) rather than genuinely broken imports, and the two have opposite
remedies. `tsc --noEmit` is clean on `main`, which is evidence for the first
reading: a real broken import would not typecheck.

Sample, `md-link`:

```
from: cat-harness/skills/authoring-who-smart-guidelines/grade.md
ref:  ../../methodologies/dmn.md
```

## Done when

- [ ] The 137 `ts-import` entries are split into scanner limitation vs genuinely
      unresolvable — the first is a fix to the scanner, the second to the code,
      and reporting them as one number hides which.
- [x] `kg:detangle` says whether its wrong-direction count is over all edges or
      only the resolving ones. Today a reader cannot tell.
- [ ] The 28 `md-link` and 25 `bpmn-skill` entries are each fixed or recorded
      with a reason.

## Not claimed

Found while answering *"where are we in code separation"* (2026-09-26). Recorded
and left `todo`; the session that found it was working `1xhc`'s CI cluster and
deliberately did not pivot.


## Box 1 answered, 2026-09-30 — and the answer OVERTURNS this bean's headline

Triaged read-only by replicating `kg-detangle`'s own extractor and node set
(`cat-harness/skills/kg/graph-management/kg-detangle.ts`, `SCAN` at :79, `link()`
at :284, the `ts-import` site at :367) against git's file list. Nothing was run
that writes — deliberately, because `kg:detangle` is an `ymsu` witness and the
gate set was in flight in the same tree.

Measured on `main` @ `be4ff4fbb35`. The `ts-import` bucket is **145** now, not
the 137 of 2026-09-26; `main` has moved a great deal. Its composition:

| bucket | count | what it actually is |
|---|---|---|
| **both endpoints in `SCAN`** | **107** | a real edge **between two graph nodes**, dropped |
| target exists, outside `SCAN` | 34 | genuinely out of the graph's declared scope |
| not an import at all | 4 | three inside a template-literal test fixture, one inside a docblock code fence |
| **genuinely broken** | **0** | — |

### The headline is wrong, and wrong in the direction that matters

This bean says *"190 edges that go nowhere"* and asks whether a dangling edge
*"would have been a cross-edge, a wrong-direction edge, or nothing at all"*.

For the `ts-import` share, **none of them go nowhere.** The dominant bucket is
not rot and not a broken import — it is **edges the graph should contain and
does not**. `link()` resolves a relative import by stripping `.js` and
appending nothing:

```ts
const p = resolve(dirname(abs), m[1].replace(/\.js$/, ".ts"));
link(n.id, relative(ROOT, p), m[1], "ts-import");
```

So `from "./foo.js"` resolves and `from "./foo"` does not. An extensionless
import names a file that exists, is in `SCAN`, and is already a node — and the
edge is silently filed as dangling.

That is worse than the bean feared rather than better. A *dangling* edge at
least appears in a count somebody can look at. A **dropped** edge appears
nowhere: it is absent from `edges`, absent from every group verdict, and
absent from the separation metrics — while its endpoints both sit in the graph
looking fully connected.

### What it cost the split metrics, measured rather than argued

Of the 107 dropped edges:

- **106** are within one instance.
- **1 is CROSS-INSTANCE**:
  `folio-assistant-core/schemas/review-comment.test.ts` → `cat-harness/schemas/todo.ts`,
  via `../../cat-harness/schemas/todo`.

**That one is correctly directed** — `folio-assistant-core` *needs*
`cat-harness`, so core → cat-harness is the arrow the declaration allows. So
the realised damage today is nil, and this bean should not be read as saying a
wrong-direction edge is hiding. It is not.

**The exposure is the point, not the realisation.** The mechanism that hid this
edge is indifferent to its direction: a wrong-direction cross-instance import
spelled without an extension would be dropped exactly the same way, and would
be invisible to every count — including the `wrong-direction` count that
`p11x`'s ruling is about to make **blocking**. A blocking gate whose
denominator silently omits edges can pass because an edge failed to be built.
That is `1xhc`'s thesis, arriving through the extractor rather than through the
scope.

### The four that are not imports

Two different false-positive shapes, worth separating because they have
different remedies:

```
cat-harness/schemas/schema-graph.test.ts   ./base.js, ./leaf.js, ./a.js
```
— source text inside a **template literal**, written into a temp fixture
directory by the test. The regex reads a string's contents as the file's own
imports.

```
cat-harness/schemas/translation.ts         ../../schemas/translation
```
— inside a **docblock code fence** (`## Example manifest`, a ```ts block).

Both are "text that looks like an import". Neither is one, and neither is a
defect in the code they sit in.

### Why the fix is NOT made here

The one-line change — also try the `.ts` the import omitted — would add **107
edges** to the graph. `kg:detangle`'s measurements are **pinned adjudications,
not graded numbers** (`code-quality-gates.yml`, "taste is a declared step"), so
adding 107 edges moves pinned sidecars across every group and is a change a
person rules on, not one a triage lands in passing.

It also collides directly with in-flight work: `p11x` is being implemented
against this same file right now. Landing an extractor change underneath it
would invalidate its measurements mid-flight.

So: **measured, recorded, not fixed.** The remaining two boxes (`md-link` 28,
`bpmn-skill` 25) are untouched and this triage says nothing about them — they
may be genuine rot, which is the usual shape of this defect and is exactly what
the `ts-import` bucket turned out not to be.

## Done-when 2 is done — PR #1580 (bean `p11x`), 2026-09-30

*"`kg:detangle` says whether its wrong-direction count is over all edges or only
the resolving ones."* It is over the **resolving** ones, and the new blocking
cross-instance gate `kg:detangle:direction` states that before it states its
count — the excluded dangling total and its per-extractor breakdown, reported
and never graded.

Taken there rather than here because `p11x` made the count **blocking**, which
turns this from a legibility nit into a way the gate can pass for the wrong
reason: a blocking gate whose denominator silently drops unresolved edges can go
green because an edge failed to resolve rather than because the layering held.
That is `1xhc` arriving through the back door of its own remedy.

**Remeasured on that branch — `main` has moved and the numbers above are stale:**

| | this bean, 2026-09-26 | 2026-09-30 |
|---|---:|---:|
| nodes | 697 | **718** |
| edges | 2828 | **3015** |
| dangling | 190 | **198** |
| — `ts-import` | 137 | **145** |
| — `md-link` | 28 | **28** |
| — `bpmn-skill` | 25 | **25** |

The `ts-import` bucket grew by **8**; the other two are unchanged. The two
remaining boxes (triaging the `ts-import` entries into scanner-limitation vs
genuinely-unresolvable, and the `md-link` / `bpmn-skill` entries) were
deliberately **not** taken — that is separate work and #1580 was not widened
into it.

## Done when

- [x] The `ts-import` entries are split into scanner limitation vs genuinely
      unresolvable. **Answer: 107 dropped real edges, 34 out of scope, 4 not
      imports, 0 broken.** `tsc --noEmit` being clean was correct evidence, and
      the bean's own reading of it was right. (#1582)
- [x] `kg:detangle` says whether its wrong-direction count is over all edges or
      only the resolving ones. **It is over the resolving ones**, and
      `kg:detangle:direction` states the excluded dangling total with its
      per-extractor breakdown before it states its count. (#1580)
- [ ] The 28 `md-link` and 25 `bpmn-skill` entries are each fixed or recorded
      with a reason. Untouched by either PR, and neither says anything about
      them — they may be the genuine rot the `ts-import` bucket turned out not
      to be.

### One number to reconcile, recorded rather than smoothed

#1580 reports the edge total as **3015** in this bean and **3016** in its PR
body, from the same run. Neither this triage nor that PR depends on which is
right — both use the *dangling* counts, which agree — but a measurement that
appears twice with two values is exactly the thing this bean exists to
distrust, so it is written down rather than quietly picked.
