---
layout: default
title: Lean / olean cache restore
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/lean-cache-restore.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/lean-cache-restore.md) — do not edit here.

{% raw %}
# Lean / olean cache restore

## Do this first

```sh
scripts/lake-cache.sh status     # is a cache already on disk?
scripts/lake-cache.sh restore    # ~2 min; derives package + branch itself
```

That is the whole procedure. No package name to look up, no branch slug
to construct, no git incantation to retype.

**This is the single most common wasted hour in this repo.** An agent
runs `lake build`, waits 40 minutes for Mathlib to compile from source,
and never learns that a prebuilt cache existed. Restore first, always.

## Why a script and not a recipe

The old procedure was eight lines of shell copied out of a 600-line
skill. Every failure it had is now handled:

| Failure | What went wrong | Now |
|---|---|---|
| `gzip: not in gzip format` | `FETCH_HEAD` is global; a concurrent fetch repointed it mid-restore and the assembled tarball was truncated | Fetches into a private ref; no race to lose |
| "restored" but the build still runs cold | nothing checked that oleans actually landed | Counts `.olean` files and fails if zero |
| "carries neither parts nor a tree" on a good branch | `git ls-tree` is cwd-prefix-relative, and you run it from the Lake root | Uses `--full-tree` |
| wrong package guessed | branch slug hand-constructed | Derived from the roster, else inferred from the branch family |
| silently restored a `-test` branch | prefix matching | Exact `<pkg>-<slug>` only |

## Commands

| Command | Use |
|---|---|
| `status` | Is a cache present? Prints the resolved package, toolchain, branch, olean count |
| `restore` | Restore oleans for this Lake package |
| `restore-toolchain` | Restore the elan toolchain itself, when `lake` is missing and the elan host is slow or blocked |
| `list` | Cache branches on origin |
| `seed` | Package a built `.lake/` for pushing to a cache branch |
| `doctor` | Everything at once, plus the next step |

Run from anywhere inside the package — the Lake root is found by walking
up to the nearest `lakefile.toml`.

## Exit codes — branch on these, don't grep output

| Code | Meaning | Next step |
|---|---|---|
| `0` | Restored, or already present | Build |
| `1` | Miss — no such branch | Build from source, then `seed` |
| `2` | Environment/usage error | Read the message; usually no git or no `lean-toolchain` |
| `3` | Cache found but **unusable** (corrupt, or extracted zero oleans) | Build, then reseed that branch |

`1` and `3` are different and matter. `1` means nobody has seeded this
package+toolchain yet. `3` means someone did and it is broken — reseeding
is owed, or the next agent hits the same wall.

## After a from-source build, seed

If you had to build, leave the next agent a cache:

```sh
scripts/lake-cache.sh seed
```

It writes the split parts and prints the exact push commands. The push is
deliberately **not** automated: seeding force-pushes an orphan branch, which
is destructive.

Never seed an unbuilt tree — the script refuses. An empty cache is worse
than none: the next agent gets a hit, skips the build, and fails with no
oleans and no explanation.

## When restore misses

A miss is not a dead end, in this order:

1. `scripts/lake-cache.sh list` — is there a branch for a *different*
   toolchain? If so the folio's `lean-toolchain` moved and the cache
   family needs refreshing (`.github/workflows/lake-cache-refresh.yml`).
2. `lake exe cache get` — Mathlib's upstream cache. Mathlib only, and it
   403s on sandboxed networks.
3. From-source build — the last resort. See `lean-environment-setup`
   for the mathlib source-clone and codeload-tarball workarounds when
   the network blocks both of the above.

## Out-of-cone modules

A cache branch carries only the oleans in that package's dependency
closure at seed time. A new import that pulls in a module outside it
(say a representation-theory file) will still compile from source — the
restore is not broken. Fold it into the next reseed.

## Interaction with other skills

| Skill | Interaction |
|---|---|
| `lean-environment-setup` | Full environment story; network workarounds when every cache tier misses |
| `lean-build-fix` | Run restore before diagnosing a build failure — a cold build is not a broken build |
| `formalizer`, `lean-generation` | Need a warm cache for the LSP to answer inside the MCP timeout |
| `prepare-merge` | `lean_build` gate assumes artifacts are restorable |
{% endraw %}
