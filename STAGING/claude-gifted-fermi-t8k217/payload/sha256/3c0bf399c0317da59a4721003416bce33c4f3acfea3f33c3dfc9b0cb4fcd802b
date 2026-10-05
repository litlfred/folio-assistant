---
# folio-assistant-cjvs
title: '190 dangling refs in the KG: 137 ts-import, 28 md-link, 25 bpmn-skill'
status: completed
type: bug
priority: normal
created_at: 2026-09-26T06:33:48Z
updated_at: 2026-10-01T07:11:26Z
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
from: cat-harness/skills/authoring/authoring-who-smart-guidelines/grade.md
ref:  ../../methodologies/dmn.md
```

## Done when

- [x] The 137 `ts-import` entries are split into scanner limitation vs genuinely
      unresolvable — the first is a fix to the scanner, the second to the code,
      and reporting them as one number hides which.
- [x] `kg:detangle` says whether its wrong-direction count is over all edges or
      only the resolving ones. Today a reader cannot tell.
- [x] The 28 `md-link` and 25 `bpmn-skill` entries are each fixed or recorded
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
- [x] The 28 `md-link` and 25 `bpmn-skill` entries are each fixed or recorded
      with a reason. **Answer: 0 broken** — 22 are same-instance targets outside
      `SCAN`, and 29 run from cat-harness to an instance that depends on it,
      held for the owner. See "Box 3 answered" below. (#1606)

### One number to reconcile, recorded rather than smoothed

#1580 reports the edge total as **3015** in this bean and **3016** in its PR
body, from the same run. Neither this triage nor that PR depends on which is
right — both use the *dangling* counts, which agree — but a measurement that
appears twice with two values is exactly the thing this bean exists to
distrust, so it is written down rather than quietly picked.

## Box 3 answered, 2026-09-30 — 0 broken; 29 point the WRONG direction across instances

Measured on main @ 12052fb8adf with `bun run kg:detangle --json` (read-only: the tree was clean after). Counts now: ts-import 149, md-link 28, bpmn-skill 25.

**No md-link and no bpmn-skill entry is broken.** Every one names a file that exists. They dangle because the target is outside `SCAN` (kg-detangle.ts:79). They split into two buckets with opposite meanings:

| bucket | count | entries | verdict |
|---|---|---|---|
| same instance, target outside SCAN | 22 md-link | cat-harness skills → `cat-harness/methodologies/` (8), `docs/` (6), `content/docs/` (2); root `AGENTS.md` (3), root `memory/` (1); bootstrap skills → `bootstrap/README.md`, `bootstrap/AGENTS.md` (3) | **recorded, not a defect.** Scope, not rot. |
| **cross-instance, platform → a DEPENDENT** | **4 md-link + 25 bpmn-skill** | see below | **wrong direction, held for the owner** |

The cross-instance entries all run from **cat-harness**, which declares only `bootstrap` as a dependency, to instances that sit ABOVE it (`large-datasets` and `fhir-harness` each need `folio-assistant-core`):

- **25 bpmn-skill**: four cat-harness processes invoke skills that live only in `large-datasets/skills/`:
  - `copy-out-materialized.bpmn` (5) → `copy-out-materialized`
  - `materialize-remote.bpmn` (10) → `materialize-remote`
  - `refresh-materialized.bpmn` (8) → `materialize-remote`
  - `sample-import.bpmn` (2) → `materialize-remote`

  A cat-harness checkout without large-datasets carries four processes whose every activity points at a skill it cannot load.
- **4 md-link**:
  - `dak-preprocessing.md` → `fhir-harness/skills/fhir-ig-base/ig-render-jekyll.md`
  - `smart-stack-layering.md` → `fhir-harness/skills/fhir-ig-base/ig-build-pipeline.md`
  - `sample-import.md` → `large-datasets/skills/materialize-remote.md`
  - `todo-review.md` → `large-datasets/skills/copy-out-materialized.md`

**Why no count caught them:** `bpmn-skill` has authority `recorded`, not `enforced` (kg-detangle.ts:246). And the edges never became edges at all, because their targets are outside SCAN. So the wrong-direction count is 0 among edges that were never built. This is the same exposure the ts-import triage above named, and it is **realised** here, not hypothetical.

**Not fixed here**, because the obvious fix is a split decision: move the four processes into `large-datasets`, which then needs a declared `processes` directory that the workflow engine and `kg:audit` load. Put to the owner 2026-09-30.

**Box 3:** every md-link and bpmn-skill entry is recorded with a reason. The wrong-direction 29 wait on the owner's ruling.


## Boxes 2 and 3, measured 2026-09-30 — and NOT ticked

Same method as box 1: kg-detangle's `SCAN` and extractors replicated read-only
against git's file list. Nothing that writes was run — `kg:detangle` is an
`ymsu` witness and that file is under active change by another agent.

### `md-link` — 31 now, and **NOT ONE is rot**

| destination | count |
|---|---|
| `cat-harness/methodologies` | 12 |
| `cat-harness/docs` | 6 |
| `AGENTS.md` | 3 |
| `fhir-harness/skills` | 2 |
| `large-datasets/skills` | 2 |
| `cat-harness/content` | 2 |
| `bootstrap/README.md` | 2 |
| `bootstrap/AGENTS.md`, `memory/…` | 1 each |
| **not on disk** | **0** |

**Zero.** The bean's premise — *"190 edges that go nowhere"* — is now wrong for
the second of three buckets. Every one of the 31 points at a file that exists
and is simply outside `SCAN`.

**Six of the 31 are correct by design and are not defects at all.**
`AGENTS.md` (3), `bootstrap/README.md` (2) and `bootstrap/AGENTS.md` (1) are
what `kg-detangle` calls CONVENTIONAL — its own comment: *"A README is
documentation ABOUT a directory, never a node IN it."* Those links resolve
for a human and will never resolve in the graph, and that is the intended
behaviour rather than rot.

**Two destinations are a real scope gap, and it is a known one.**
`fhir-harness/skills` and `large-datasets/skills` are **skill directories that
`SCAN` does not list**. That is the same class as `bootstrap-tools` missing
from `SCAN` (`0lj4`): the graph cannot see a whole instance's skills, so a
link into them is filed as dangling rather than as a cross-instance edge.

### `bpmn-skill` — the count is DISPUTED and I have not reconciled it

Two probes of mine disagree, so **no number is published here.**

- Probe A, over `.bpmn` files inside `SCAN`, counting occurrences: **25**.
- Probe B, over every `.bpmn` in the checkout, counting distinct ref NAMES not
  matched under `cat-harness/skills`: **8** — of which **5 resolve under
  `bootstrap/skills/`, which IS in `SCAN`** and should therefore not be
  dangling at all.

The two are measuring different things (occurrences vs distinct names, and
different file sets), which may explain it entirely — **or may not.** Until
that is reconciled, quoting either as "the `bpmn-skill` count" would be the
failure this bean exists to record.

### Three names with a generated page and NO source skill

The one thing Probe B establishes independently of the count:

```
copy-out-materialized     only cat-harness/docs/processes/… + docs/reference/skill-instructions/…
deep-document-research    only cat-harness/docs/…
materialize-remote        only cat-harness/docs/…
```

A BPMN activity names a skill whose **only** files are generated pages. Either
the source skill was removed and its generated mirror outlived it, or it lives
somewhere neither probe looked. **Not established**, and worth its own look
rather than a guess.

## Done when — updated

- [x] `ts-import` split. 107 dropped real edges, 34 out of scope, 4 not
      imports, **0 broken**.
- [x] `kg:detangle` states whether its wrong-direction count is over all edges
      or only the resolving ones. (#1580)
- [ ] The `md-link` and `bpmn-skill` entries each fixed or recorded with a
      reason. **Half done and deliberately not ticked**: `md-link` is measured
      and characterised (31, zero rot, 6 correct by design, 4 in two unscanned
      skill directories); `bpmn-skill` has two disagreeing probes and three
      source-less skill names, none of it reconciled.

## What all three buckets now say together

Across `ts-import`, `md-link` and the part of `bpmn-skill` that is settled,
**not one dangling ref has been shown to be broken.** Every one measured so
far is a **scope artefact of the `SCAN` list** — an edge the graph declines to
see, not an edge that goes nowhere.

That inverts the bean's title. The remedy for a broken link is to fix the
link; the remedy for this is to decide what the graph is supposed to cover —
which is `p11x`'s question (#1580 now prints 3 of 19 instances reached and
names the 16 it misses) and `0lj4`'s, arriving for a third time from a third
extractor.

## OWNER RULING, 2026-09-30: MOVE the four large-datasets processes out of cat-harness

Asked in session https://claude.ai/code/session_01SiFEMuTciyB681XP5WfcbB. The four processes are `copy-out-materialized`, `materialize-remote`, `refresh-materialized` and `sample-import`. Every step of each names a skill that exists only in `large-datasets`, while cat-harness depends only on `bootstrap`, so their 25 references run the wrong way. **The owner chose: move them into `large-datasets`**, which declares its own `processes` directory. The alternative, leaving them and recording the edges, was declined. Implementation follows in its own PR.

## The 25 `bpmn-skill` refs fixed: the four processes moved to large-datasets, 2026-09-30

Owner ruling today (issue #1605): move rather than record. Branch
`claude/magical-archimedes-4qkfxp-cjvs-move`.

**What moved** (`git mv`, history kept), `cat-harness/processes/` →
`large-datasets/processes/`:
`copy-out-materialized.bpmn`, `materialize-remote.bpmn`,
`refresh-materialized.bpmn`, `sample-import.bpmn`. None had a beside-source
file; their SVGs are generated into the site's `assets/img/workflows/` and
kept the same site path. Their `.pot` templates stay in `cat-harness/translations/`,
the translations home, as `deep-document-research`'s and smart-base's do.

**Declared:** `large-datasets.json` gains `large-datasets-processes`
(`processes/`, kind `processes`). `cat-harness.json` also declares it
repository-scoped, the same way it declares `folio-assistant-core-processes`,
so the workflow tools, `kg:audit` and the site generators, which all scan from
the root, still find the diagrams (bean `g43o`).

**One engine change was needed, and it is not cosmetic.** Subprocess descent
(`loadProcessModel`) looked up a `calledElement` only among SIBLING files.
`refresh-materialized` calls `Process_Adjudication`, which stays in
cat-harness. After the move that call would have gone silently opaque: no
descent, and `checkAcceptedCodes` would never have run. The fix is in
`process-model.ts` (`dependencyProcessHome`). When no sibling file defines the
callee, the lookup searches the calling instance's DEPENDENCIES' declared
`processes` directories, nearest dependency first, and never its dependents.
`adjudication-marker.test.ts` covers this: it asserts that
`refresh-materialized`'s adjudication child resolves and carries its codes.

### Before / after

`bun run kg:detangle --json` (dangling, by extractor):

| | before (main @ `d1474207ea7`) | after |
|---|---:|---:|
| dangling total | 210 | **185** |
| `ts-import` | 154 | 154 |
| `md-link` | 31 | 31 |
| `bpmn-skill` | **25** | **0** |
| `kg:detangle:direction` wrong-direction | 0 | 0 |

**The zero has two causes, so it cannot stand as proof on its own.**
`kg:detangle`'s `SCAN` does not list `large-datasets/`. So the 25 disappear
partly because their source files left the graph, not only because the
edges now point the right way. An independent probe settles the direction.
It ignores SCAN and takes each skill ref and call in the four diagrams. For
each one it finds the instance that holds the target, and checks whether that
instance is the diagram's own instance or one of its declared transitive
`needs`:

| | skill refs + calls | wrong-direction | unresolved |
|---|---:|---:|---:|
| in `cat-harness/processes/` (may reach bootstrap, bootstrap-tools) | 33 skill refs + 3 calls | **25 skill refs** (materialize-remote 20, copy-out-materialized 5) | 0 |
| in `large-datasets/processes/` (may also reach cat-harness, folio-assistant-core) | 33 + 3 | **0** | 0 |

The remaining refs are `sample-import` ×7, `adjudication` ×1 and the call to
`Process_Adjudication`. All of them point DOWN into cat-harness, which
large-datasets reaches through folio-assistant-core.

### Still open: the 2 cross-instance `md-link`s, left alone on purpose

- `cat-harness/skills/authoring/content-lifecycle/sample-import.md` → `large-datasets/skills/materialize-remote.md`
- `cat-harness/skills/authoring/authoring-core/todo-review.md` → `large-datasets/skills/copy-out-materialized.md`
  (and, since the move, to `large-datasets/processes/copy-out-materialized.bpmn`)

These links still run from cat-harness up to a dependent. So does the
`sample-import` SKILL itself: it stays in cat-harness while its process now
lives in large-datasets. Moving the skill would be a second ruling, and this
change does not presume it. The two fhir-harness md-links are untouched.

_2026-10-01T05:32:19Z_ — Claimed by claude/sharp-einstein-970n6g — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).



_2026-10-01_ — Done in PR #1750 (owner's rulings: fix + re-pin; move sample-import). kg-detangle resolves extensionless TS imports: dangling ts-import 156 → 44 (all out-of-SCAN or fixture strings), direction gate still 0. sample-import now lives in large-datasets/skills/ beside its process; todo-review names copy-out-materialized instead of linking up a layer. Merged without full green CI by owner's instruction — see PR body for fix-up.
