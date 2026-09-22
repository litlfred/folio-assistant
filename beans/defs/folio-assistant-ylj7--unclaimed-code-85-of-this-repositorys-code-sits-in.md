---
# folio-assistant-ylj7
title: 'UNCLAIMED CODE: 85% of this repository''s code sits in no declared directory — declare them, do not move them'
status: todo
type: feature
priority: high
created_at: 2026-09-22T19:40:16Z
updated_at: 2026-09-22T19:40:16Z
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
- [ ] every instance's code directories are declared
- [ ] a QA axis reports the two questions SEPARATELY, never as one number
- [ ] `<stub>/src` is written down as the convention for new instances
