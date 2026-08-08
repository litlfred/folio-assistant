---
# folio-assistant-5d7z
title: Reseed lake-cache/qou-v4-24-0 — it carries ZERO of the paper's own oleans
status: in-progress
type: bug
priority: high
created_at: 2026-08-07T12:10:50Z
updated_at: 2026-08-08T15:10:00Z
---

The production cache branch has 7268 oleans, all dependencies, none QOU.*. Every restore still rebuilds the paper, and sibling .lean files cannot elaborate standalone. lake-cache.sh status now detects and reports this.

## Root cause found — it was the seeding format, not the build

The refresh workflow committed `.lake/` as a TREE (`git add -f .lake`);
every live branch carries split `lake-oleans.tgz.part*` tarballs. So the
workflow never produced the live branches — they were hand-seeded, and the
hand-seeding captured `.lake/packages/` while dropping `.lake/build/`.
Hence 7268 dependency oleans and zero `QOU.*`.

The tree form would also blow GitHub's 100 MB blob limit on a
Mathlib-sized cache, which is likely why it was done by hand.

Fixed on both sides:
- folio-assistant: `seed --push` (CI path, worktree-based so the caller's
  tree is never switched), plus a guard that REFUSES to publish a cache
  with zero own-package oleans. `mathlib` is exempt — there the
  dependencies are the payload.
- qou PR #4680: the workflow delegates to that service, so format cannot
  drift again.

Also fixed `git ls-remote` hanging with no timeout — it hung an
interactive run and would hang a CI job silently.

## Remaining

- [ ] Merge qou#4680.
- [ ] Run lake-cache-refresh to actually reseed (needs CI — 1582 modules
      is hours, not feasible in an authoring container).
- [ ] Re-run the triviality probe over the full corpus once reseeded (nimj).

## Caught in time: the reseed would have produced an unreadable cache

Writing a test suite for `lake-cache.sh` (13 tests, local git remote, no
network) immediately found a bug in `seed` that qou#4680 had just wired
into CI:

`split` defaults to ALPHABETIC suffixes (`lake-oleans.tgz.partaa`), while
the restore matched `\.tgz\.part[0-9]+$` — numeric. So the very first
`lake-cache-refresh` run would have published parts the restore cannot
see, reporting the fresh branch as carrying neither parts nor a tree.

The live branches ARE numeric (`part00`…), which is further confirmation
they were never produced by this code path.

Fixed: `split -d -a 3` on the write side (`-a 3` for 1000-part headroom;
the default width errors out rather than extending), and the read side now
accepts either scheme so a hand-seeded branch still restores.

No second qou PR needed — the workflow calls
`folio-assistant/scripts/lake-cache.sh`, so this fix reaches CI directly.

## qou#4680 merged

Merged 2026-08-07T13:38:32Z. The refresh workflow now delegates to
`lake-cache.sh seed --push`, so the format cannot drift again and the
own-package guard is in the CI path.

## The "needs CI" premise no longer holds

That item read "needs CI — 1582 modules is hours, not feasible in an
authoring container", which inherited ga7e's conclusion that no linkable
toolchain could be had locally. It can (ga7e, resolved): the toolchain is
a GitHub release asset and that host is reachable, so `lake exe cache get`
— the minutes-not-hours route to a traced Mathlib — runs here.

What remains genuinely expensive is building the paper's OWN modules,
which the upstream Mathlib cache does not supply. That is the real cost,
not the toolchain.

## Dispatch attempted — blocked on token scope, not on anything technical

Tried to run `lake-cache-refresh.yml` (package=qou) from this session:

    POST .../actions/workflows/lake-cache-refresh.yml/dispatches
    403 Resource not accessible by integration

The session's GitHub App can READ Actions but not dispatch them
(`actions: write` not granted). Nothing about the workflow or the reseed
is wrong — it needs a human or a token with that scope:

    gh workflow run lake-cache-refresh.yml -R litlfred/qou -f package=qou

or the Run workflow button at
<https://github.com/litlfred/qou/actions/workflows/lake-cache-refresh.yml>.

### Corroboration, from the same API call

Listing that workflow's runs returns **`total_count: 0`** — it has never
executed, not once.

That independently confirms this bean's root-cause finding. The live
cache branches carry split `lake-oleans.tgz.part*` tarballs while the
workflow (before qou#4680) committed `.lake/` as a tree; if the workflow
had ever produced them the formats would agree. They were hand-seeded,
and the hand-seeding is what dropped `.lake/build/` and left 7268
dependency oleans with zero `QOU.*`.

So the first run of this workflow will also be its first real test.
Two guards now stand in front of a bad publish — the own-package check
and the trace-coverage check — and both were added since.


---

## Blocker re-tested 2026-08-08 (session `3bada08b`) — still blocked, now measured

Asked to work all open beans, so the claim was re-tested rather than inherited.

**The toolchain half is genuinely resolved** (`ga7e` was right):
`~/.elan/toolchains/leanprover--lean4---v4.24.0` is present and both binaries
run — `lean --version` → 4.24.0, `lake --version` → Lake 5.0.0-src+797c613. So
"no linkable toolchain" is no longer the blocker.

**The network half is not.** Every host a reseed needs is unreachable from an
authoring container:

    https://release.lean-lang.org                  HTTP 000
    https://leanprover-community.github.io         HTTP 000
    https://github.com/leanprover-community/mathlib4   HTTP 403
    https://api.github.com/repos/leanprover/elan/releases/latest   HTTP 403

`lake exe cache get` fetches from the second of those, so the fast route is
out; the from-source route is the hours-long build this bean already measured
(823 targets for ONE module, not finished in 10 minutes at 0% trace coverage).

**And there is no folio here.** `scripts/lake-cache.sh restore-toolchain`
exits `no lean-toolchain` — that file is folio content, and this container has
the platform only. So even with network there is nothing to build.

Conclusion unchanged and now pinned: **this needs CI, or a machine with
unrestricted egress.** The runbook in
`docs/guides/reseeding-the-lean-cache.md` is the artifact to run there. Nothing
further is doable from an authoring container, and the next session should not
spend turns re-confirming it.

---

## 2026-08-08 — CORRECTION: the opening measurement is the *mathlib* family's

Not resolving this bean — a sibling holds it. But its premise needs correcting
before anyone spends a CI run on the stated justification.

`lake-cache.sh status` run **without** `--lake-root`, from a `qou` checkout,
resolves to the roster's first entry and prints:

    lake root:  /workspace/qou
    package:    mathlib
    branch:     lake-cache/mathlib-v4-24-0
    oleans:     7268  (deps + own)
    own pkg:    0
    ! but ZERO belong to this package — only its dependencies are cached.

Those are the numbers this bean opens with. They belong to
`lake-cache/mathlib-v4-24-0`, not `lake-cache/qou-v4-24-0`, and for that family
the alarm is a **false positive**: lake-root is `.`, the "own package" is the
workspace-root shim, and its `.lake/build/lib` is empty by construction. `seed`
has always exempted `mathlib` for exactly this reason; `status` did not. Fixed
in `own_oleans_expected` (bean `folio-assistant-zq4t`), with tests.

Pointed at the paper's own lake-root, the same command reports:

    lake root:  /workspace/qou/content/quantum-observable-universe/lean
    package:    qou
    branch:     lake-cache/qou-v4-24-0
    oleans:     950  (deps + own)
    own pkg:    945

### The oleans were not built here

- 942 of the 945 carry mtimes spread over 2026-06-09 … 2026-08-06 — preserved
  from build time, which a local build cannot produce. The other three are
  modules I rebuilt today.
- `.lake` is gitignored (`.gitignore:64`), so a fresh clone brings none.
- No restore stamp exists at either lake-root, so `lake-cache.sh restore` was
  not the mechanism — this container was provisioned some other way
  (`qou/scripts/lean-cache-restore.sh` extracts the same branch at repo root
  and writes no stamp).
- `lake-cache/qou-v4-24-0` was last seeded 2026-08-07T00:11Z; the newest
  restored olean is 2026-08-06. Consistent.

And operationally: this session elaborated three paper modules standalone
against those oleans — including a new file, `QOU/QBeta/C1ThetaZeroLocus.lean`,
which imports `QOU.QBeta.C1ConnectionPoles` — at roughly two minutes each. So
"Every restore still rebuilds the paper, and sibling .lean files cannot
elaborate standalone" does not hold in a container provisioned today.

### What I did NOT establish

I did not open the tarball on the branch — that is ~1.6 GB of split parts. The
provenance above is inference (mtimes + gitignore + no local build), strong but
indirect.

### The reseed may still be wanted — for different reasons

Two real findings survive, and neither is the one in the title:

1. **The qou cache is partial.** 945 own oleans against the ~1582 modules this
   bean cites. Some of the paper does still rebuild.
2. **Trace coverage is 0%.** `status` reports `traced: 5/950 oleans (0%)` for
   `qou` and `0/7268 (0%)` for `mathlib`. Lake reads `.trace`, not `.olean`, to
   decide staleness — so `lake build` rebuilds regardless of how many oleans
   are present. That is why `scripts/lean-verify.sh` (which bypasses `lake`
   entirely) works here while `lake build` does not, and it is a better
   justification for a reseed than the zero-own-oleans claim.

Whoever holds this bean should re-decide on (1) and (2). Retitling it would be
their call, not mine.
