---
# folio-assistant-qmjh
title: 'SCHEMA: a ContentDirectory cannot say whether it is a LAYOUT dependents reproduce or where THIS instance''s content lives'
status: completed
type: task
priority: normal
created_at: 2026-09-20T12:32:20Z
updated_at: 2026-09-20T13:18:18Z
parent: folio-assistant-zzmr
---


Queued on the owner's ruling of 2026-09-20: root `harness.json` now, this
schema work next. Their words for it: *"directive for cat-harness to create if
(as named in schema)"*.

## It was already found, and already declined — that is the point

`cat-harness/harness.json`, on the `bootstrap` skills entry, states it exactly:

> a `ContentDirectory` cannot say whether it is a LAYOUT dependents should
> reproduce (`uploads/`, `library/`, `voices/`) or merely WHERE ITS OWN CONTENT
> LIVES (`workflows/`, `schemas/`, `tools/`). […] Adding that distinction was
> considered and DECLINED for now: it is a schema change whose per-directory
> classification is a judgement about every directory here, not a bootstrap
> workaround.

So this bean is not a discovery. It is the decision being taken off the shelf,
and the declining reason is still the risk to design against.

## What it costs to get wrong, measured

Simulated on a fresh folio depending on this instance: `init-folio` would create
**five directories it has no use for**, each with a committed keep-marker. That
is the `dh4f` shape shipped downstream to every folio — a consumer scanning a
directory that exists and is empty, reporting a clean run over it.

And the near side is measured too. Flipping `uploads` to `scope: "repository"`
to move one queue turned **6 tests red**: three the dependent-inherits-its-own
guarantee, two the upload URL's instance segment, one corpus paths. Scope is
not the axis this needs.

## Why `scope` is not already the answer

`scope` says WHERE a path resolves — instance root or repository root. This asks
something orthogonal: whether a DEPENDENT should get one of its own. The two are
independent, and `bootstrap`'s `workflows/` is the proof: no scope, so
cat-harness inherits it, and `materialiseDirectories` re-roots it against the
inheriting instance by design, wanting `cat-harness/workflows/` which is not
there — `harness:dirs:check` reports `21 declared, 1 missing`.

## Done when

- [ ] `ContentDirectory` can express "dependents reproduce this" vs "this is
      where MY content lives", and the field is REQUIRED so a new directory
      cannot go unclassified — the `BLOCK_KINDS` discipline.
- [ ] Every directory in every `harness.json` here is classified, each by a
      judgement recorded in its `description` rather than inferred from its name.
- [ ] `materialiseDirectories` creates only the reproduce-set for a dependent.
      Falsified in both directions: a fresh folio gets `uploads/` and `library/`
      and does NOT get `workflows/`, `schemas/`, `tools/` or `src/skills/`.
- [ ] The `bootstrap` entry in `cat-harness/harness.json` that exists only to
      work around this can then go, which is the check that it actually landed.
- [ ] `wwi6`'s four tests still pass unchanged. If they need editing, the design
      is wrong — they pin the property this must preserve.

## Not in scope

Moving anything. The root `uploads/` relocation is done (`889e003012`) and did
not need this; it works because the root declares itself, leaving cat-harness's
declaration alone.

_2026-09-20_ — **BUILT.** `dependents: "reproduce" | "skip"` on
`ContentDirectory`, required, and `materialiseDirectories` honours it for
INHERITED entries only.

## Against the `## Done when`

- [x] **expressible, and REQUIRED so nothing goes unclassified** — the
      `BLOCK_KINDS` discipline. Required because neither default is safe, which
      is the unusual part and the whole argument.
- [x] **every directory classified** — 23 entries across four declarations.
- [x] **only the reproduce-set materialises for a dependent, falsified both
      ways** — measured with the real functions on a throwaway folio:
      **12 resolved → 6 materialised**, where all 12 were created before. Two
      implementation mutations are each caught by a named test.
- [x] **`wwi6`'s four tests pass UNCHANGED.** This was the falsifier: had they
      needed editing the design was wrong. `harness-config.test.ts` is
      untouched and green.
- [ ] **the `bootstrap` entry that exists only to work around this can go** —
      NOT done, deliberately. See below.

## The recorded symptom was stale, and that matters more than the fix

`cat-harness/harness.json` states `harness:dirs:check` reports
`21 declared, 1 missing`. **It reports `20 declared, 0 missing`, exit 0.**
bootstrap's entry was renamed to `cat-harness-workflows`, and no instance here
declares the dependency, so that failure was always SIMULATED rather than live.

So the defect is **latent**: it fires the moment any instance declares a
dependency on another. That is a weaker justification than the bean carried,
and it is the honest one. It is also why the last box stays unticked — the
`bootstrap` entry is not currently failing anything, so removing it is a
separate change with its own verification rather than a victory lap on this one.

## Three classifications are genuinely arguable

Called out rather than buried, because the previous session declined this work
precisely over "a judgement about every directory":

| entry | call | why, and what would change it |
|---|---|---|
| `cat-harness` → `skills/` | `skip` | a folio reads the platform's skills through the overlay; one that wants its OWN declares them. An empty `skills/` in every folio is noise. |
| `qa` → `test/results/` | `reproduce` | QA sidecars are about a folio's own blocks, so it needs somewhere to put them. If a folio should keep verdicts elsewhere, the PATH is what is wrong, not this call. |
| `health` → `test/health/results/` | `skip` | the health sweep is platform tooling — gh-pages size, clone cost, work-plan duplicates. A folio does not run it. |

## Two things found on the way

**The requirement forced a schema split, and the split is better.** One schema
served an INSTANCE directory (inheritable) and a GRAPH NODE (`beans/defs`,
`todos/feedback`, never resolved across instances). Requiring the field made
every node state something meaningless — and a required field that is sometimes
noise is one people fill in without reading, which is the failure the
requirement exists to prevent, arriving by the back door.
`GraphNodeDirectorySchema` is now the base and `ContentDirectorySchema` extends
it, so the shape is still declared once.

**`toJsonLd` was silently dropping `scope`.** A declaration round-tripped
through JSON-LD came back claiming every path resolves against the instance;
`beans/`, `todos/` and six others are repository-scoped. Nothing had caught it
because an absent optional field parses cleanly and means something else — the
round-trip test only caught the `dependents` case because the new field is
required. Fixed in the same function, with `scope` and `dependents` added to
the vocabulary and the `@context`.
