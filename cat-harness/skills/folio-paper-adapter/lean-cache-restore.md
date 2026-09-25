---
name: lean-cache-restore
user_invocable: true
description: >
  The Lean build loop — restore a warm cache before working, and
  contribute your build back when done. One command each. A restore is
  ~2 minutes; a cold Mathlib build is 30-60.
allowed-tools: Bash Read
---

# Lean cache: the authoring loop

## The loop

The cache is not a maintenance chore. It is the **output of every
authoring session**, and every session should leave it warmer than it
found it:

```
restore  ──▶  draft / edit .lean  ──▶  lake build  ──▶  contribute
   ▲                                                        │
   └────────────── next agent starts here ──────────────────┘
```

```sh
scripts/lake-cache.sh status       # what do I have?
scripts/lake-cache.sh restore      # warm up  (~2 min)
# … draft, edit, `lake build` …
scripts/lake-cache.sh contribute   # give the build back
```

**Restore before any Lean work.** The single most common wasted hour is
an agent running `lake build` cold, waiting 40 minutes for Mathlib, and
never learning a prebuilt cache existed.

**Contribute when you finish.** If you compiled anything, the next agent
should not have to compile it again. `contribute` is safe to run
unconditionally — every guard below applies, so a session that built
nothing, or only a subtree, simply gets refused.

## Why contributing is safe

`contribute` publishes only if all four hold:

| Guard | Refuses when |
|---|---|
| Non-empty | no oleans at all |
| Own-package | zero oleans belong to this package — only its dependencies |
| Trace coverage | under 90% traced (see below) |
| **No-shrink** | the result is materially smaller than what is already published |

The last one is what makes an open contribution model work: a session
that compiled one subtree cannot replace a fuller cache. Counts are read
from the incumbent branch's commit message, so the check costs no
bandwidth — `--filter=blob:none` fetches the commit and skips the ~1.6 GB
payload.

`--force` overrides the no-shrink check. That is a deliberate downgrade;
do not reach for it to make a red run go green.

## Traces are the thing that matters

Lake decides staleness from `.trace`, **not** `.olean`. An olean with no
trace is "out of date", so Lake rebuilds it — and rebuilding **evicts**
the untraced neighbours.

This was measured, not theorised: a cache with 7268 oleans and 0 traces
survived a single-module build as 772 oleans, and every survivor had a
trace. Such a cache works for direct `lean` + `LEAN_PATH` and is useless
for a build.

So `status` reports coverage, and anything under 90% is a warning you
should act on rather than route around.

## This cache is a `compiled` materialization

Bean `gpdo`, owner's pick 2026-09-23 ("Third purpose"). The Lean cache is
not a special case: it is one instance of the `compiled` purpose in
`folio-assistant-core/schemas/materialization.ts`. Its policy used to live
only in `lake-cache-refresh.yml`; this section is where it is stated, and the
workflow is **adopted, not superseded**.

| the cache's own terms | the `compiled` record |
|---|---|
| orphan branch `lake-cache/<package>-<toolchain>` | one record per package; the branch name's toolchain is `inputs.toolchain` |
| the Lake root's commit at build time | `inputs.sourceRevision` |
| Lake's per-module `.trace` files | the fine-grained input digests. Lake checks these itself, module by module, which is why an untraced olean is rebuilt (above). A whole-tree `inputs.inputDigest` is optional for that reason. |
| keep ≤2 toolchains per package (the cleanup job) | retention: a copy whose toolchain is no longer one of the two is `stale-inputs` for every current build |
| the ~1.6 GB payload | `bytes`, and the SIZE gate `materialize-remote` asks |

**Before use, not on a schedule.** Call `compiledValidity(record, current)`
with the toolchain from `lean-toolchain` and the current commit:

- `valid`: restore and build; Lake's traces handle the per-module rest.
- `stale-inputs`: it names what changed (toolchain, revision or digest).
  Restore the cache for the *current* toolchain instead, or build cold.
- `cannot-tell`: you could not state an input the record needs. That is
  never a pass. Build cold, or find the missing input first.

A compiled copy can never satisfy the source-loss gate: it is derived, and
the source is what you would rebuild from. It has no expiry date; its
lifetime is its inputs, so `freshness()` reports it `input-bound` and
`cache:index` never lists it just for having no expiry.

**The second instance is FHIR.** sushi turning FSH into FHIR resources (and
an AST) has the same shape: `inputs.toolchain` is the sushi version,
`inputs.sourceRevision` the FSH commit. Two instances is what makes this a
purpose and not a Lean detail. The FHIR pipeline records its builds this way
when it lands; nothing FHIR-side is built here.

## Exit codes — branch on these, don't grep

| Code | Meaning | Next |
|---|---|---|
| `0` | present / restored / published | proceed |
| `1` | miss — no such branch | build, then `contribute` |
| `2` | usage or environment error | read the message |
| `3` | found but **unusable** (corrupt, gutted, or won't link) | see below |

`1` and `3` differ and it matters. `1` means nobody has seeded this
package+toolchain. `3` means someone did and it is broken — repair with
`restore`, or reseed if the branch itself is bad.

## Cold start

If there is no usable branch at all, that is a bootstrap, not a session
task:

```sh
scripts/reseed-lean-cache.sh --repo <content-repo> --dry-run
```

Phased, resumable, and safe by default — seeds to a `-test` branch and
verifies a restore from a clean clone before it will touch production.
See [Reseeding the Lean cache](../../docs/guides/reseeding-the-lean-cache.md).

## Toolchain

```sh
scripts/lake-cache.sh restore-toolchain
```

Exits `3` if the restored toolchain has no static libraries — it will
elaborate but nothing will **link**, so `lake exe …` (including
`lake exe cache get`) cannot run. Install a real one with elan in that
case.

## Interaction with other skills

| Skill | Interaction |
|---|---|
| `lean-environment-setup` | Full environment story; network workarounds when every tier misses |
| `lean-build-fix` | Restore first — a cold build is not a broken build |
| `formalizer`, `lean-generation` | Draft step of the loop; need a warm cache for the LSP to answer in time |
| `lean-formal-graph` | Consumes what a build produces |
| `prepare-merge` | Its `lean_build` gate assumes artifacts are restorable |
