---
layout: default
title: Reseeding the Lean cache
parent: Authoring guides
nav_order: 5
---

# Reseeding the Lean cache
{: .no_toc }

The cache branches are currently unusable for builds. This is the exact
procedure to rebuild them — on a machine with unrestricted network,
since the cloud authoring container cannot reach elan's download host.

1. TOC
{:toc}

---

## What is wrong today

`lake-cache/qou-v4-24-0` carries **7268 oleans, 0 traces, 0 own-package
modules**. Three independent defects:

| Defect | Effect |
|---|---|
| No `.trace` files | Lake reads `.trace`, not `.olean`, to decide staleness. Untraced modules are "out of date", so a build rebuilds them — and **evicts** them. Measured: building one module ran 823 targets and cut 7268 oleans to 772. |
| No own-package oleans | Every build recompiles the paper; sibling `.lean` files cannot elaborate standalone. |
| Toolchain branch has no `.a` files | `lean` elaborates but nothing **links**, so `lake exe …` fails — including `lake exe cache get`. |

The cache has only ever worked for direct `lean` + `LEAN_PATH`. That is
the whole "olean cache restore doesn't help" complaint.

## Prerequisites

- Unrestricted network (elan's toolchain host and Mathlib's cache host).
- ~15 GB free disk, and hours for the first build.
- Both repos checked out.

## Step 0 — branches

Nothing here requires you to check out a `lake-cache/*` branch by hand.
`seed --push` creates the orphan branch inside a **detached worktree**,
so your working tree never leaves `main`. (Do not `git switch --orphan`
in the main tree — it leaves every file untracked and strands you.)

```sh
# Content repo — has the workflows, roster, and Lean packages
git -C ~/src/qou fetch origin
git -C ~/src/qou checkout main
git -C ~/src/qou pull --ff-only

# Platform — has the cache service
git -C ~/src/folio-assistant fetch origin
git -C ~/src/folio-assistant checkout main
git -C ~/src/folio-assistant pull --ff-only
```

Set one variable — everything below uses it:

```sh
export FA=~/src/folio-assistant          # or ~/src/qou/folio-assistant
export CACHE="$FA/scripts/lake-cache.sh"
cd ~/src/qou
```

## Step 1 — a real toolchain

```sh
# If a PREVIOUS restore-toolchain ran here, remove the incomplete tree
# FIRST. It sits at exactly the path elan expects, so elan concludes the
# toolchain is installed and skips the download — leaving you with a
# lean that cannot link.
rm -rf ~/.elan/toolchains/leanprover--lean4---v4.24.0

curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh \
  | sh -s -- -y --default-toolchain "$(cat lean-toolchain)"
export PATH="$HOME/.elan/bin:$PATH"

# MUST show static libs, or `lake exe` will fail later:
find ~/.elan/toolchains -name 'libleancpp.a' | head -1
```

If that `find` prints nothing, stop — the rest cannot work.

## Step 2 — a traced Mathlib, the fast way

```sh
cd content/quantum-observable-universe/lean
lake exe cache get
```

This is the step the broken toolchain made impossible. Mathlib's upstream
cache ships oleans **with** their traces, which is exactly what is
missing. It takes minutes, versus hours to build Mathlib from source.

Check it landed traced:

```sh
bash "$CACHE" status --package qou
```

Look for `traces: … (≥90% coverage)`. If coverage is low, do not
continue — seeding would reproduce the current defect, and `seed`
will refuse anyway.

## Step 3 — build the paper's own modules

```sh
lake build            # ~1582 modules; hours on first run
```

This is the expensive step, and it is **one-time**. Once traces exist,
later builds are genuinely incremental.

### Chipping at it across sessions

You do not have to finish in one sitting. Build a subtree, seed, and
resume later — each seed accumulates:

```sh
lake build QOU.BraidKnot          # a subtree, not everything
bash "$CACHE" status --package qou   # own pkg: should now be > 0
```

Then seed (Step 4), and next session `restore` picks up where you left
off. Because `lake build` is incremental once traced, the next chip only
compiles what is new.

## Step 4 — seed safely

**Seed to a `-test` branch first and verify a restore from it.** A bad
force-push to the production branch breaks it for everyone, and the
branch carries no history to recover from.

```sh
SLUG=$(cut -d: -f2 lean-toolchain | tr -d '[:space:]' | tr . -)

# 1. Seed to a test branch
bash "$CACHE" seed --package qou --branch "lake-cache/qou-$SLUG-test" --push

# 2. Verify it restores into a clean tree
cd /tmp && rm -rf verify && git clone --depth 1 <qou-url> verify
cd verify/content/quantum-observable-universe/lean
bash "$CACHE" restore --package qou --branch "lake-cache/qou-$SLUG-test"
bash "$CACHE" status  --package qou
```

The verify run must show **all three** healthy:

```
oleans:     <big>
own pkg:    <non-zero>          <- not the current defect
traces:     <big> (100% coverage)
```

3. Only then cut over to production:

```sh
cd ~/src/qou/content/quantum-observable-universe/lean
bash "$CACHE" seed --package qou --branch "lake-cache/qou-$SLUG" --push
```

`seed` refuses to publish if own-package oleans are zero or trace
coverage is under 90%, so a bad seed fails loudly rather than silently
replacing a good branch with a useless one.

## Step 5 — the other packages

The roster (`.github/lake-packages.json`) lists four:

| Package | Lake root |
|---|---|
| `mathlib` | `.` |
| `qou` | `content/quantum-observable-universe/lean` |
| `ugb` | `content/unital-groebner-bases/lean` |
| `fred2005` | `content/fred2005-formal-groups/lean` |

Repeat Steps 2–4 per package, changing `--package` and the directory.
`mathlib` is exempt from the own-package guard — for that entry the
dependencies *are* the payload.

## Step 6 — the toolchain branch

`lake-cache/toolchain-<slug>` is missing its static libraries. Reseed it
from a real elan install:

```sh
cd ~/.elan/toolchains
tar czf - "leanprover--lean4---$(cat ~/src/qou/lean-toolchain | cut -d: -f2 | tr -d '[:space:]' | sed 's/^/leanprover--lean4---/;s/$//')" \
  | split -d -a 3 -b 90m - /tmp/lean-toolchain.tgz.part
```

Then push those parts to the branch the same way `seed --push` does.
Verify with `restore-toolchain`, which now exits 3 if the `.a` files are
absent.

## Afterwards

Once a good branch exists, CI can keep it fresh: `lake-cache-refresh.yml`
(in the content repo) delegates to this same script, so the format cannot
drift and the guards apply there too.

Then the blocked work becomes possible:

- re-run `content/pipeline/lean-triviality-probe.ts` over the whole
  corpus rather than the 43% that currently elaborate standalone;
- `lake build` in CI stops being a from-scratch Mathlib compile.

## Related beans

`02kc` (missing traces), `ga7e` (toolchain static libs), `5d7z` (own
oleans), `nimj` (blocked on all three).
