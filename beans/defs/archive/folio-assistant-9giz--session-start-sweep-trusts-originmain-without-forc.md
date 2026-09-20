---
# folio-assistant-9giz
title: Session-start sweep trusts origin/main without forcing the tracking ref
status: completed
type: task
created_at: 2026-08-15T14:28:04Z
updated_at: 2026-08-15T14:28:04Z
---

Found by using it. The `qou` clone in this container had

```
remote.origin.fetch = +refs/heads/claude/lean-vacuity-z3k1-drain-2026-08-09:refs/remotes/origin/claude/lean-vacuity-z3k1-drain-2026-08-09
```

— a refspec narrowed to **one sibling branch**. `git fetch origin main` then
updates `FETCH_HEAD` and *not* `refs/remotes/origin/main`, so every comparison
against `origin/main` in that worktree answered from a ref last written on
**2026-08-09**. Six days and 1374 commits of `main` were invisible. `git
ls-remote` said `619561a3`; `origin/main` said `7e45748e`.

The fetch **succeeds** — exit 0 — so nothing looks wrong. This is the
`mcp1` / `pzdv` signature again: an absent baseline reads as agreement, and the
report is indistinguishable from a clean one.

## Reproduced deterministically

Fixture: bare upstream, two clones, narrow the second's refspec, advance `main`
by 3, then ask the question the sweep asks.

```
sweep TODAY   (git fetch origin main)  -> HEAD..origin/main = 0   [origin/main = dbbf316]
sweep FIXED   (explicit refspec)       -> HEAD..origin/main = 3   [origin/main = da64fbf]
```

## Blast radius: six call sites, and three of them *branch* off the stale ref

Every one fetches a branch and then reads `origin/<branch>`:

| site | what it gets wrong |
| --- | --- |
| `scripts/session-start-coord-sweep.sh:61` | "**origin/main ahead by: 0**" — every agent, every session |
| `scripts/check-upstream.sh:18` | "origin/main has N new commits" with N=0 |
| `deploy/self-update.sh:31` | decides "already up to date" and skips the update |
| `scripts/lean-compile-audit.sh:94` | `git checkout -B "$BRANCH" origin/main` — **audits a stale tree** |
| `scripts/upload-to-uploads.sh:133` | `git checkout -b … origin/$DEFAULT_BRANCH` — **new work on an old base** |
| `scripts/upload-bib-papers.sh:122` | same |

The last three are worse than a wrong number: they silently *produce* work
rooted six days back, which then has to be rebased or is merged as a
regression.

## The sweep's section 3 cannot be fixed the same way

"Recent sibling `claude/*` branches" reads `refs/remotes/origin/claude/*`
directly. Under a narrowed refspec that tree is empty and the section prints
nothing — the sweep says there are no siblings while ~200 exist. No per-branch
refspec repairs that, so the sweep has to *detect* the narrow refspec and say
so.

## Plan

- [x] Force the tracking ref at all six sites:
      `git fetch origin "+refs/heads/$B:refs/remotes/origin/$B"`
- [x] Sweep warns when `remote.origin.fetch` does not cover `refs/heads/*`,
      naming section 3 as blind rather than empty
- [x] End-to-end test: run the real sweep inside the fixture and assert the
      count, so the fix is pinned by behaviour and not by a grep over source

## Summary of Changes

Seven executable sites, not six — `publish.yml`'s latexdiff step has the same
shape (`git checkout "origin/$BASE_REF" -- main.tex` after a bare fetch), and
`actions/checkout` narrows the refspec to the ref being built. Included as
hardening; **not** verified failing in CI, since the step is
`continue-on-error` and its failure mode is an absent diff PDF rather than a
red run.

`lake-cache.sh`, `lake-cache-fetch.sh` and `lean-env.sh` were checked and left
alone — they already use explicit refspecs or read `FETCH_HEAD`, which is
correct.

### The test pins behaviour, not source text

`scripts/tests/fetch-tracking-ref.test.ts` builds a fixture remote, narrows a
clone's refspec, advances `main`, and runs the **real sweep script** in it.
Against the pre-fix script two of its four tests fail (reports `0` where the
truth is `3`; no sibling warning); against the fixed script all four pass. A
grep for `refs/heads/` in the source would have passed either way, and this
repo already carries a bean (`6fnb`) for tests that cannot fail.

### The skills were the other half

Agents are *instructed* to run `git fetch origin main` and compare by hand.
Four runnable snippets fixed (coordinate §8c, integration-watcher ×2, watch §1);
the rule and its two corollaries recorded in coordinate.md §8c, whose prose
already promised a "fresh fetch" its command did not deliver.

The two Monitor loops were deliberately left alone: they resolve the head via
`git ls-remote` and pass raw SHAs to `git log`, so the bare fetch's objects
suffice. That is the better pattern where detection is the goal, and it was
already correct.

### A second bug, found on the way, and worse than the first

`watch.md` §5b — monitor-timeout recovery, marked MANDATORY — fetched `main`
and then measured `origin/<BRANCH>`. A different ref from the one it refreshed,
so `LAST != CUR` never fired: **the step whose whole purpose is to catch what
was missed while the watcher was down reported 0 missed, every time.** This one
does not need a narrowed refspec to be wrong; it is wrong in any clone.

### What this does not fix

The container's `qou` clone was repaired in place
(`git config --replace-all remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'`),
but nothing prevents a clone from being created that way again. The sweep now
*reports* the condition at session start, which is the detection half. Whoever
owns clone provisioning would have to close the other half.
