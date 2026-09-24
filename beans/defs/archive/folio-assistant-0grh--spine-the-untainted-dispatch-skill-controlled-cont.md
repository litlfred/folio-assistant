---
# folio-assistant-0grh
title: 'SPINE: the untainted-dispatch skill — controlled context extracted from the KG, parameterized prompt, producer never writes the verdict'
status: completed
type: task
priority: high
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-22T07:22:05Z
parent: folio-assistant-3x2n
---

The spine of `3x2n`. Everything else here is an instance of this.

## What generalises, taken from the one place it exists

`translation-manager.md` §"The agentic round trip" states it in translation
vocabulary. Stripped of that vocabulary it is three rules and a table:

| party | is given | produces |
|---|---|---|
| **producer** | the task | the artefact |
| **checker** | the artefact, and nothing that would let it shortcut | an independent rendering or finding |
| **adjudicator** | the original intent and the checker's output, never the artefact itself | `pass` / `warn` / `fail`, each drift named |

1. **Neither dispatched agent sees what would let it shortcut.** The
   translation case: a back-translator shown the English writes the English
   back and the check passes vacuously.
2. **The checker uses no tools, and says so.** The source is in the repository;
   an agent with filesystem access finds it, and the verdict then measures its
   search rather than the artefact. Ask for a `TOOLS_USED` line and record it.
3. **One agent doing both halves is not this check.** It compares a text with
   its own paraphrase of itself.

## What has to be built rather than lifted

**The controlled context is extracted from the KG, not hand-assembled.** The
owner's words: *"as extracted from the KG with a set prompt and parameterized
input"*. A caller names a **subject node** and a **criterion**; the mechanism
resolves what the checker may see from the graph and fills a fixed prompt. Hand
-composing a brief per call site is how rule 1 gets broken quietly — the person
composing it is the producer.

**Model provenance.** `translation-manager` already carries the rule and the
reason: a subagent's serving model is not observable from the dispatching
session, so record `model` **with** `modelSource` or not at all. Absent both,
"not recorded" is a true statement and an acceptable one.

## Done when

- [x] A skill in the `kg` graph states the discipline with no domain vocabulary
      — `skills/folio-core/untainted-verification.md`, bound to the
      `qc-reviewer` role (the one that holds `qa-reporting`). Measured:
      `skill-in-role-or-process` went 16 -> 15, so it is bound rather than
      merely written
- [x] Context resolution is parameterized over (subject, criterion) and reads
      the DECLARATION rather than a hand-composed brief — `UntaintedDispatch`
      on `QaCriterionDefinition`, checked by `untaintedPartitionDefects` for
      four defects: undeclared, overlap, unpartitioned, phantom
- [x] `TOOLS_USED` is recorded, not assumed — `UntaintedParty.tools_used`,
      carried in `metrics` beside `model_source`
- [x] Both dispatched parties are written as witnesses, adjudicator first
- [x] At least two unrelated domains are expressed against it — `3vc6`
      (translation) and `8rwa` (evidence review), and they are expressed
      DIFFERENTLY on purpose, which is worth stating rather than glossing:
      `3vc6` is a full code instantiation (`ROUNDTRIP_DISPATCH`, four tests,
      and it found the abstraction too narrow); `8rwa` is a fencing analysis
      showing which rules transfer and which are a folio's — three of seven
      earn a place on the platform, four do not. **Shipping code for the four
      would have been `dh4f`**, so the demonstration there is the analysis, not
      an artefact

## The owner's ruling, 2026-09-21 — option 1

*"could not dispatch"* is recordable by the producer as an `n/a` witness with a
**required** reason, and that satisfies the gate. Implemented as
`couldNotDispatchEntry`, which throws on an empty reason, and made
distinguishable from every other `n/a` by `metrics.dispatch: "unavailable"`.

`isVerified()` is false for it. That predicate is a named function rather than
an inline check for exactly one reason: state 2 records `n/a`, and a consumer
reading `n/a` as "nothing to see" turns the honest gap back into the silent one
the whole mechanism exists to end.

## Falsified before it was trusted

Restoring each defect turns the guard red and the fix turns it green:

| break | result |
|---|---|
| `isCouldNotDispatch` always false | 15 pass, **1 fail** |
| the overlap rule disabled in `untaintedPartitionDefects` | 15 pass, **1 fail** |
| restored | **16 pass, 0 fail** |

`bun run gates` — 96 of 96.

## Summary of Changes

`skills/folio-core/untainted-verification.md` states the discipline with no
domain vocabulary, bound to `qc-reviewer`. `UntaintedDispatch` on
`QaCriterionDefinition` declares the visible sets; `untaintedPartitionDefects`
reports four ways the declaration decays without erroring. The recorder in
`content/pipeline/untainted-verification.ts` writes both parties as witnesses,
adjudicator first, with the owner's third state — "could not dispatch",
recordable by the producer, a reason required, never a pass.

Verified on `main` at `2ce66fc`: skill, module and checker all present.
Merged in #829 and #848.
