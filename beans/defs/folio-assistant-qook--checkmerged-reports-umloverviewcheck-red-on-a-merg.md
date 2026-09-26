---
# folio-assistant-qook
title: check:merged reports uml:overview:check red on a merged tree that is green — a sweep artefact, twice
status: in-progress
type: bug
parent: folio-assistant-1xhc
created_at: 2026-09-26T11:04:49Z
updated_at: 2026-09-26T12:24:17Z
---


## What was measured, 2026-09-26

`bun run check:merged` (bean `nytj`) reported `uml:overview:check` red on the
merged tree for **two unrelated branches within the same hour** — PR #1392's
`claude/ask-well-fourth-layer` and PR #1395's `claude/fx5r-stale-field-advice`.
Neither branch touches the UML overview's inputs in a way the other does.

It is a false positive. Every isolated measurement on the **identical** tree is
green:

| probe | result |
|---|---|
| `uml:overview:check` on plain `origin/main` in a worktree | ✓ |
| `git merge-tree --write-tree` of #1392 + main vs. my merge commit's tree | `d698d151` **both — identical** |
| `uml:overview:check` on tree `d698d151`, detached worktree | ✓ |
| after `git merge origin/main`, `bun run skill:register` on #1392 | **all six current, nothing written; the commit was EMPTY** |
| full `bun run gates` on that merged branch | 2 of 154 — the drift pair only, `uml:overview:check` **green** |
| `uml:overview:check` alone on #1395's merged tree (`240f0953`) | ✓ |
| `kg:audit` in that worktree, then `uml:overview:check` | writes nothing; still ✓ |

So the tree is clean and the **sweep** is what disagrees. That is bean `ymsu` —
a gate that writes what a later gate reads — and it is the shape
`skill-register.ts`'s docblock already states for a different pair:
*"sequence perturbs — something earlier in that loop wrote."* `check:merged`
runs the full `bun run gates` in its throwaway worktree, and `bun test` inside
it writes the kg-qa and detangle sidecars that `gen-uml-overview` renders.

## Why this is worth a bean rather than a shrug

**A tool whose job is to refuse a merge, crying wolf, gets ignored — and then
it is not there for the merge it was built for.** `check:merged` exists because
three stale measurements reached `main` green on 2026-09-23. Its value is
entirely in being believed. Two false positives in one hour, on the first two
merges an agent ran it for, is the beginning of not being believed.

## What is NOT claimed

I did not isolate which gate does the writing. `bun test` is the candidate and
the tree guard inside `gates` printed its usual warning on every run, but I did
not run the sweep step-by-step and watch the tree. This session has already
paid twice for a plausible cause stated with the authority of a measurement —
`fx5r`'s `update-branch` reporting "merge conflict between base and head" for a
PR that was closed, and `fx5r`'s own three-call-sites table written from
memory. Naming the mechanism here without the run would be the third.

## Done when

- [ ] The writer is identified by running the merged-tree sweep gate-by-gate
      with `git status` between each, against tree `240f0953` or `d698d151`.
- [ ] `check:merged` distinguishes "this gate failed on the committed tree"
      from "this gate failed after an earlier gate in this sweep wrote" —
      either by snapshotting before the sweep, or by re-running a failing
      gate in isolation before reporting it. A third state, not a second.
- [ ] The two false positives above are re-run against the fix and confirmed
      green. A fix verified only forwards is `1xhc`.

_2026-09-26T12:24:17Z_ — Claimed by claude/fx5r-close — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
