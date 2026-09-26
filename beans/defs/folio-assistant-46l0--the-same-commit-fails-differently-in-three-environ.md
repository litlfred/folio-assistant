---
# folio-assistant-46l0
title: The same commit fails DIFFERENTLY in three environments, so a green run cannot be read as a green tree
status: todo
type: bug
created_at: 2026-09-26T06:33:48Z
updated_at: 2026-09-26T06:33:48Z
parent: folio-assistant-1xhc
---

Measured 2026-09-26 on ONE commit, `3c2523a8071`, three ways:

| where | `bun test` failures |
|---|---|
| GitHub Actions | **7** |
| a clean `git worktree` of that exact sha, full suite | **8** |
| the two disagreeing files, run alone | **0** |

The sets are not nested. CI had two the worktree did not (`this repository's own
corpus`, `the real corpus`); the worktree had three CI did not (`FOLIO_ROOT
detection`, `every instance is found`, `the reader is told the repository root`).
Pristine `origin/main` in a worktree gave the same 8 as the middle row, so the
worktree's extra three are an artefact of the worktree rather than of the branch
— all three are about locating the repository root.

## Why this is worth a bean and not a shrug

**"I ran it locally and it passed" is not evidence, in either direction.** In
one afternoon this cost:

- a fix nearly pushed for a failure that was not this PR's (the two corpus
  tests looked new because they had never appeared locally; they were on
  `main`'s own CI run all along)
- a "chain" claim in a merged commit message that over-attributed two gates,
  because they went red after a change and the counterfactual was not tested
- a bisect against `origin/main` to learn that a page had been translated

Each was caught by re-measuring in a THIRD place. None was caught by reading.

## Its relation to `sff8` — adjacent, not the same

`sff8` is contention inflating a per-test budget ~35x, so its symptom is a
**timeout**, and its remedy is about the budget. This is broader: the failures
above are **assertion failures**, not timeouts, and they differ by environment
rather than by load. `sff8`'s `profile-scoping` case is one instance of the
general shape; this is the shape.

Recorded here rather than appended to `sff8` for that reason. If the owner reads
them as one, fold this in.

## Done when

- [ ] Each of the five environment-sensitive tests is classified: legitimately
      environment-dependent (and then it should SAY so on failure), or wrongly
      coupled to its environment.
- [ ] The three worktree-only failures are confirmed as worktree artefacts —
      they all concern repository-root detection, so a detached worktree is
      plausibly just an unsupported layout, and if so the tests should skip
      rather than fail.
- [ ] A stated answer to: what does a green local run entitle you to claim?
      Today the honest answer is "less than everyone assumes", and that is not
      written anywhere.

## Not claimed

Recorded and left `todo`. Found while driving three PRs through `main`'s red on
2026-09-26.
