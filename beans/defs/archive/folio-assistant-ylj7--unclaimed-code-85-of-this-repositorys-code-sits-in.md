---
# folio-assistant-ylj7
title: 'UNCLAIMED CODE: 85% of this repository''s code sits in no declared directory — declare them, do not move them'
status: completed
type: feature
priority: high
created_at: 2026-09-22T19:40:16Z
updated_at: 2026-09-22T20:51:42Z
parent: folio-assistant-uhkv
---

The owner, 2026-09-22: *"QA - unclaimed code. all src under `<stub>/src` as
controleed dir? does that work?"*

**The mechanism works. The destination does not, and the measurement says why.**

## Measured before answering

`.ts` files inside a **declared** directory, repository-wide:

| instance | directory | kinds | files |
|---|---|---|---|
| cat-harness | `schemas/` | schemas, cat-harness | 124 |
| cat-harness | `skills/` | skills | 24 |
| cat-harness | `translations/` | translation-sources | 7 |
| cat-harness | `tools/` | tools | 3 |
| folio-assistant-core | `schemas/` | schemas, cat-harness | 11 |
| others (7 instances) | — | — | 11 |

**180 declared. ~1,216 in the repository. So roughly 1,036 code files — 85% —
are in no declared directory at all.**

In cat-harness the undeclared bulk is `scripts/` (546), `content/` (289),
`src/` (60), `test/` (35) and `adapters/` (24). Re-derive these; they move.

## Why this IS the right question

It is the `v8gh` property, which this repository already relies on everywhere
else: **an undeclared file is one no checker has a reason to look at.** A
declared directory with a code graph kind makes "unclaimed" computable instead
of a feeling, and `dh4f` is its inverse — a declared-but-absent directory,
where a consumer scans nothing and reports a clean run.

## Why `<stub>/src` as the DESTINATION does not survive contact

It would have to absorb 959 files in cat-harness alone, and three of the four
sources resist for different reasons:

1. **`schemas/` is already a declared graph** — `["schemas", "cat-harness"]`,
   because a schema IS a knowledge-graph node. Folding it into `src/` either
   discards that declaration or makes `src/` hold two kinds. The model already
   answers "what is this directory"; moving it throws the answer away.
2. **`content/pipeline/` is core's subject, not the platform's.** Moving it
   under `cat-harness/src/` crosses the boundary `scripts/repo-partition.ts`
   exists to enforce.
3. **`scripts/` are ENTRY POINTS.** `package.json` and the CI workflows name
   them **by path** — which is what `check:ci-invocations` and
   `check:command-paths` guard. 546 path moves is a large invocation surface
   for a rename that buys nothing the declaration does not.

## The proposal instead

- **Add a `code` graph kind** and decide its `holds` — almost certainly
  `content` (it is authored), and `renderable: false`. Consult
  `content-context-and-state-graphs` before registering; a kind that has not
  decided does not compile.
- **Declare the directories where they are.** Cheap, no moves, and it converts
  85% of the code from invisible to scanned in one change per instance.
- **Keep `<stub>/src` as the convention for NEW instances.** `smart-base/tools/`
  and `fhir-harness/tools/` are already `tools/` rather than `src/`, and that
  is right — they hold Tool nodes, which have their own kind.

## Then "unclaimed" splits into TWO checkable questions

They are different, and conflating them is how one of them never gets answered:

1. **In no declared directory** — the 85% above. A path property.
2. **Declared, but bound to no Tool node and so to no process step** — bean
   `d308` (868 code files → 13 Tool nodes) and `ce65` (Tool nodes for 11 of
   138 skills). A graph property.

Question 1 is cheap and unanswered. Question 2 is the expensive one and already
has beans. Do 1 first: until it is done, question 2 is being asked over 15% of
the code while reporting a clean run over the rest — which is `dh4f` in its
most costly form.

## Done when
- [ ] a `code` graph kind is registered, with `holds` and `renderable` decided
- [x] every instance's code directories are declared — bar `content/`, whose reason is below
- [x] a QA axis reports the two questions SEPARATELY, never as one number
- [ ] `<stub>/src` is written down as the convention for new instances

## Round 1 shipped, 2026-09-22 — 15% → 73%

The `code` graph kind is registered (`schemas/graph-kind-registry.ts`), with
the avatar and the `directory-conventions` table row a new kind owes, and
cat-harness's four code directories are declared where they are:
`scripts/`, `src/`, `adapters/`, `test/`.

**Re-measured after: 847 of 1,154 `.ts` files sit in a declared directory —
73%, from roughly 15%.** Re-derive rather than quoting; the numbers move.

`holds: "content"` — authored with an intention, re-authored rather than
regenerated, and it stands on its own. `renderable: false`, and that call is
the interesting one: code is legible and views of it are published, but
`renderable` asks whether the graph is wired to the SITE BUILD as pages, and
the generated references are built from schemas and skills rather than from
this. Saying `true` would promise a page per module.

### The collision this exposed, and why it was not fixed with a baseline

Declaring the four directories took `check:declared-paths` from 0 refusals to
**822**, against a recorded baseline of 38.

Not one was a real instance of the defect that gate describes. Its rule is in
its own header — *a path a declaration could have answered is not written down
in code* — and every prefix it guarded was a graph whose access pattern is
**discovery**: `workflowDirs()` answers "where are the processes", so a literal
`processes/` is a site that breaks under a topical split.

**A declaration cannot answer "which script is the gate runner."** Code
directories are addressed by path deliberately; `package.json` and the CI
workflows name them, which is what `check:ci-invocations` and
`check:command-paths` exist to keep honest. The finding named no remedy
because there is none to name.

So the gate is narrowed at its premise rather than at its threshold:
`isAddressedByPath` exempts a directory whose kinds are **all** `code`. Keyed
on the KIND, never on the path — matching on `scripts` would exempt any future
directory of that name, including one holding a genuinely discoverable graph,
and would stop exempting this one the moment it moved. A directory holding
`code` **and** a discoverable kind is not exempt, because the discoverable half
is the access pattern that needs guarding.

Bumping the baseline would have hidden the twentyfold jump AND raised the bar
under every prefix where the rule does apply, which is the failure mode a
shared baseline has.

## Still to do
- [ ] the other instances' code directories — this round declared cat-harness's
      only, which is where the bulk is but not all of it
- [ ] `content/` is still undeclared as code. It is NOT an oversight: it holds
      `content/pipeline/` (core's subject) beside `content/docs/` (folio
      content), so declaring it needs the split settled first — `repo-partition`
- [ ] `<stub>/src` written down as the convention for new instances
- [ ] the QA axis reporting the two questions SEPARATELY


## Round 2, 2026-09-23 — the four remaining `scripts/` directories

`check:declared-dirs`: **86 declared directories across 19 instances, 0
findings.**

| instance | declared | what was invisible |
|---|---|---|
| `detangle` | `detangle-scripts` | it declared its `schemas/` and its `results/` and left the thing that WRITES the results undeclared |
| `folio-assistant-core` | `core-scripts` | the review-comment Tool, invoked by path from `folio-staging.yml` |
| `smart-trust` | `smart-trust-scripts` | the generator between two declared graphs — index in, 681 docs out |
| `who-iris` | `who-iris-scripts` | `gen-iris-pages.ts`, which `wjfu` cites as the precedent for every instance-local generator here |

That last one is the sharpest form of this bean's defect: **a directory can be
the corpus's own worked example and still be invisible to every consumer that
walks declarations.**

### `tools/` was already covered, and checking saved four wrong declarations

`fhir-harness`, `folio-assistant-core` and `smart-base` all hold `tools/`, and
all three already declare it under the `tools` graph kind. Declaring those as
`code` would have given one directory two kinds. The measurement that caught
it was reading each instance's declarations rather than trusting the
present-on-disk list.

### It changed the navbar, and the test that pinned the old answer

`who-iris` now declares **seven** kinds, not six, so
`navbar.test.ts`'s pinned list failed. Updated rather than worked around: the
test's title is *"lists every kind the instance declares"*, so a list that
cannot grow was an assertion about 2026-09-22 rather than about the
declaration. `code` appears in the navbar declared-and-unlinked, which is the
state `harness-tiles` keeps visible rather than hides.


## Round 3, 2026-09-23 — the reporter, and the convention where it is looked for

`bun run check:code-accounting`. Advisory: both questions have open beans, and
a gate that fails on a backlog is a gate somebody switches off.

```
Code accounting — 1260 .ts file(s). TWO questions, reported apart.

  1. DECLARED
       949 in any declared directory   75%
       740 in one declared `code`      59%
       311 accounted for by nothing
            304  cat-harness/content
              2  cat-harness/types
              1  folio-assistant-sci/content   ... and four more singletons

  2. REACHABLE
        70 Tool node(s) naming a command
        41 distinct .ts entry point(s) they resolve to
       138 file(s) reachable from one        11%
```

### Question 1 has TWO readings, and conflating them reads an improvement as a regression

*In any declared directory* (75%) is wider than *in one declared `code`*
(59%). `cat-harness/schemas/` holds 142 `.ts` and is declared — as `schemas`,
correctly, since adding `code` would give one directory two kinds.

Round 1 reported **73%** on the wide reading. Measuring the narrow one after
round 2 gave **59%**, and for a moment that looked like a regression caused by
round 2 — which had in fact moved the wide number to **75%**. Both are printed
for exactly this reason. The bean's own warning, *"re-derive rather than
quoting; the numbers move"*, turns out to be about the DEFINITION as much as
the value.

### The residue is one directory, and its reason was already recorded

304 of the 311 are `cat-harness/content` — deferred pending the partition
split, as this bean already said. The other seven are singletons. So question
1 is finished to the extent it can be without that decision.

### Question 2 is a CLOSURE, and 11% is the honest number

Counting the 41 entry points would have reported ~3% on a corpus where most
modules are genuinely reachable. The walk follows static relative imports and
reports **138 of 1260**. It is a FLOOR — a bare specifier, a dynamic
`import()` or a runtime path is not followed, so it under-claims rather than
over-claims, which is the safe direction for a coverage figure.

`d308` and `ce65` own that 11%. This bean's job was to make it VISIBLE and to
stop it being averaged into question 1.

### The gate caught a real defect in this very script, within minutes

`toolEntryPoints` composed `join(root, "tools", "index.ts")`.
`check:declared-paths` refused the literal, and asking `directoriesForGraph`
instead changed the count **64 → 70**: the hardcoded path was silently missing
six Tool nodes. Not a style nit — a measurement that was wrong, in a script
written to produce correct measurements.

### The convention was written, and written where nobody looks

`<stub>/src` was already in the `code` row of `directory-conventions.md` — a
table cell answering *"what is this kind?"*. Someone starting an instance
reads **The conventional layout**, so it now says so there too, with why the
existing instances are the exception: `schemas/` is a declared graph of its
own kind, `content/pipeline/` is core's subject, and `scripts/` are entry
points named by path from `package.json` and CI, so moving them is a large
invocation surface for nothing the declaration does not already buy.

The row's stale **85%** is gone, replaced by a pointer to the reporter — a
number in prose is a claim the next round falsifies.

## Summary of Changes

- `cat-harness/scripts/check-code-accounting.ts` + `check:code-accounting`,
  wired into `code-quality-gates.yml`, classified in the partition.
- 9 tests over throwaway trees, including the two that matter: a file can be
  declared and unreachable, and reachable while declared by nothing.
- `directory-conventions.md`: `<stub>/src` in the layout section; the stale
  percentage replaced by the reporter.
