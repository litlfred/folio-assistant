---
# folio-assistant-3ye4
title: check:subgraphs silently skips six declared directories — repository scope falls out of attribution
status: todo
type: task
created_at: 2026-09-20T16:29:19Z
updated_at: 2026-09-20T16:29:19Z
parent: folio-assistant-zzmr
---

Found 2026-09-20 by the guard added in the same change, after `check:subgraphs`
reported **0 dangling links** over a corpus where a just-moved page still
carried seven.

## The gap

`owningDirectory` compares a file's path in the INSTANCE's path space. A
directory declared `scope: "repository"` resolves outside the instance, so
`relative(instanceRoot, file)` yields a `../…` path that matches no declared
prefix — and every file in it is attributed to nothing and swept past.

Six declared directories hold markdown and contributed **no** attributed file:

| directory | verdict |
|---|---|
| `fsh-guts/` | **deliberate.** Retired content is not held to link resolution — a thing in the trashcan is there because it was superseded, and its links pointing at what moved is expected |
| `bootstrap/skills/` | a gap |
| `beans/` | a gap |
| `todos/` | a gap |
| `memory/` | a gap |
| `smart-kg/methodologies/` | a gap |

## Why this is recorded rather than fixed here

The fix is a path-space decision, not a patch: `owningDirectory` would have to
compare against each directory's own root rather than the instance's, which
changes what "owns" means for every consumer of it — including
`subgraphTree`, where the repository-scoped `smart-kg/methodologies/` is
**deliberately** not read as a child of `methodologies/` (bean `x4v4`). Making
scoped directories attributable without breaking that is the work.

## Why the SILENCE was the defect, more than the gap

Skipping retired content is defensible. Skipping it silently is not: `0
dangling` then reads as *"everything resolves"* when it means *"everything I
looked at resolves"* — could-not-determine rendered as clean, which this
repository refuses in `ci-health`, in `health`, and in the kg-qa third state.
The sweep now prints what it did not examine, so the clean line above it is
bounded by something a reader can see.

## Done when

- [ ] a scoped directory's files are attributable to it, without
      `subgraphTree` starting to read `smart-kg/methodologies/` as nested
- [ ] `fsh-guts/` stays exempt, and the exemption is DECLARED rather than
      falling out of a path bug — it is currently the right answer for the
      wrong reason
- [ ] the `NOT EXAMINED` list is empty or every entry on it is a stated
      decision
