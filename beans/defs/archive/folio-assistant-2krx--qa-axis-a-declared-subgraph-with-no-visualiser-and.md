---
# folio-assistant-2krx
title: 'QA AXIS: a declared subgraph with no visualiser and no documentation entry is unreachable — and no skill means no tools'
status: completed
type: task
priority: normal
created_at: 2026-09-20T14:01:05Z
updated_at: 2026-09-20T15:50:56Z
parent: folio-assistant-yj32
---


Owner, 2026-09-20:

> everytime an instance names a directory as a subgraph, it needs (QA
> valduation) to have visualizer, documenationentry. QA if no skill, no tools.

## Measured, and the number is the argument

Built a navbar stub over the real declarations while this was being asked for.
It reports, per instance, which declared directories have a renderer:

| instance | declared | with a visualiser |
|---|---|---|
| `folio-assistant` (cat-harness) | **22** | 2 — `folio/` and `docs/` |
| `bootstrap` | 2 + docs | 1 — `docs/` |
| `folio-assist-core` | 0 + docs | 1 — `docs/` |

So **19 declared subgraphs in this instance alone have no way to look at them.**
`library/` and `uploads/` are declared by every instance that has content and
neither has ever had a viewer. A directory nobody can see is one nobody checks,
which is the `dh4f` family again: it exists, it is declared, and no consumer
ever reasons about what is in it.

## The rule, as three separate checks

The owner named three things and they fail differently, so they should be three
findings rather than one:

1. **No visualiser** — nothing renders this subgraph. The reader cannot look.
2. **No documentation entry** — nothing says what it is FOR. A reader who finds
   it cannot tell what belongs in it.
3. **No skill → no tools** — if no skill governs the subgraph, there is nothing
   for an agent to invoke against it, so the graph is agent-unreachable even
   where it is human-readable. This is the sharpest of the three and the
   easiest to miss, because the directory looks fine.

## Design notes, so this does not become noise

- **It is a QA AXIS, not a hard gate**, at least at first: 19 findings on day
  one would be a wall somebody switches off. The repository's own rule — *a
  check that fires on every one of its subjects is a check that is wrong* — is
  the thing to design against. Report, rank, and let the count fall.
- **Three states.** "No visualiser" and "could not determine whether one exists"
  are different answers, and a sweep that cannot resolve a renderer must say so
  rather than report an absence.
- **Not every subgraph wants a visualiser** and the check must be able to hear
  that. `interaction/` is read at session start by an agent; a human viewer for
  it may be pointless. An opt-out needs a REASON per entry, like
  `ROOT_INFRASTRUCTURE` and the gate exemptions, or it becomes a silence list.

## Done when

- [x] An axis reports, per declared subgraph, whether it has a visualiser, a
      documentation entry, and a governing skill — three findings, not one.
      `scripts/check-subgraph-coverage.ts`, `bun run check:subgraph-coverage`.
- [x] Opt-out carries a reason per entry and is tested. `coverage.exempt` maps
      a criterion to its REASON — never a bare `true` — and the report prints
      it, because a waiver nobody sees is a silence list.
- [x] `library/` and `uploads/` are either covered or opted out with reasons.
      Both now declare `docs` and `skill` (the ingestion page and
      `library-ingestion`), which took the count 73 -> 69. Neither is opted
      out of `visualiser`: that gap is REAL and is `jbx2` and `v1hw`.
- [x] Falsified in both directions. Four mutations, each caught: reporting
      regardless of declaration fails 7 tests, ignoring an exemption fails 2,
      dropping bootstrap's layer exemption fails 2, and accepting a missing
      target fails 1.

## Shipped 2026-09-20

**Declaration-first, never inference.** Coverage is read from the entry's
`coverage` field rather than guessed by scanning for a page that mentions the
path. Fuzzy matching invents both false positives and negatives, and — the
reason that matters — **an absent declaration IS the finding**. Inferring one
would paper over the thing being measured.

**Two severities, because they are two problems.** A declared target that does
not resolve is `major` (somebody claimed a renderer that is not there); an
undeclared one is `minor` (nobody has said yet). Merging them would rank a typo
alongside twenty unwritten viewers.

**Every field is OPTIONAL.** `dependents` was made required four hours earlier
and the bill landed on a sibling branch within the hour — 166 failures on the
merged tree, nothing wrong with either side. This field does not need to be
required to do its job.

**Baseline: 69 findings, 0 major, across 4 instances** — cat-harness 62,
bootstrap 4, the root 3. Advisory (exit 0) exactly as the bean asked, with
`--strict` for the day the number is low enough to hold. Wired into
`code-quality-gates.yml` so the count is visible every run and cannot drift.

A bare id with no path separator is not checked against the filesystem:
resolving a skill or tool id is the KG audit's job, and reporting "missing"
about something never looked for would be the axis lying about its own scope.

## BOOTSTRAP IS EXEMPT — owner, 2026-09-20

> it is exception to harness/layer not having visualtion/workflow visualizer.
> but it must have its json/jsonld... that is its existence.

So this axis must NOT raise a finding against `bootstrap` for having no
visualiser. The requirement is not flat across layers — it starts at
`cat-harness` and applies upward, because cat-harness is what supplies the
layers above with folio:

| layer | visualiser | own `.json`/`.jsonld` |
|---|---|---|
| `bootstrap` | **exempt** (it is the navbar footer) | **required — that is its existence** |
| `cat-harness` and above | required | required |

**The exemption is not a hole in the axis, it is a second criterion.** What
bootstrap owes instead is its own graph artefact, and an axis that dropped
bootstrap entirely would stop checking the one thing bootstrap must have. A
layer that cannot emit its own graph has not shown it is a graph.

Recorded on `hfkl`, which also carries a contradiction to resolve first:
`kg-export` WRITES `_kg/<stub>.jsonld` while a comment in the same file calls
`bootstrap/bootstrap.jsonld` "a COMMITTED artefact". Which is true decides
whether this criterion is checkable from a checkout or only after a build.
