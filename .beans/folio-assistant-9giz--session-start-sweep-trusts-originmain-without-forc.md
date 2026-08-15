---
# folio-assistant-9giz
title: Session-start sweep trusts origin/main without forcing the tracking ref
status: in-progress
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

- [ ] Force the tracking ref at all six sites:
      `git fetch origin "+refs/heads/$B:refs/remotes/origin/$B"`
- [ ] Sweep warns when `remote.origin.fetch` does not cover `refs/heads/*`,
      naming section 3 as blind rather than empty
- [ ] End-to-end test: run the real sweep inside the fixture and assert the
      count, so the fix is pinned by behaviour and not by a grep over source
