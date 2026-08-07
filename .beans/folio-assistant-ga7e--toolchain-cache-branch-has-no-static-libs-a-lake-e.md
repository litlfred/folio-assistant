---
# folio-assistant-ga7e
title: Toolchain cache branch has no static libs (.a) — lake exe cannot link
status: completed
type: bug
priority: high
created_at: 2026-08-07T14:02:53Z
updated_at: 2026-08-07T15:17:04Z
---

lake-cache/toolchain-v4-24-0 carries .trace and .hash for libLean/libleancpp but zero .a files. lean elaborates; every link fails with 'cannot find -lleancpp', so lake exe (including 'lake exe cache get', the standard route to a traced Mathlib) is impossible. restore-toolchain now detects this and exits 3.

## Cannot be worked around locally

Tried installing a genuine toolchain so `lake exe cache get` could supply a
properly-traced Mathlib. `elan` installs, but the toolchain download is
**403 through the egress proxy**:

    error: error during download
    caused by: [56] Failure when receiving data from the peer
               (CONNECT tunnel failed, response 403)

Also note elan will NOT repair this by itself: the cache extracts into
`$ELAN_HOME/toolchains/leanprover--lean4---v4.24.0`, exactly the name elan
expects, so elan sees a toolchain already installed and skips the download.
The incomplete tree has to be removed first.

So the reseed must happen in CI, where elan's host is reachable.

## Resolved — it CAN be worked around locally

The conclusion above ("must happen in CI") was wrong, and wrong in a
specific way: it treated elan's unreachable host as if it were the
toolchain's only source. elan is just a fetcher. The same toolchain is
published as a GitHub release asset, and that host IS reachable here:

    release.lean-lang.org                          -> no route
    elan.lean-lang.org                             -> no route
    github.com/leanprover/lean4/releases/download/ -> 200

Measured in this container, not inferred:

- downloaded `lean-4.24.0-linux.tar.zst` (439 MB)
- it carries **16 `*.a` files** — `libleancpp.a`, `libLean.a`,
  `libLake.a`, `libleanrt.a` among them
- built a Lake project with an executable target and ran `lake exe`:
  it LINKS and prints its output

So `lake exe cache get` — the fast route to a traced Mathlib, and the
thing 02kc is blocked on — is available locally.

### Landed

`scripts/lake-cache.sh install-toolchain` — direct from GitHub releases.
Verifies in a staging dir and publishes only on success, so a truncated
download can never land at the path everything treats as installed.
Idempotent, `--force` to reinstall, `$LEAN_RELEASE_BASE` for a mirror or
an air-gapped tree, declines nightlies (not published as release assets)
rather than guessing an asset name. 8 tests, offline via a `file://`
mirror.

`restore-toolchain`'s two dead ends now point at it instead of at
`elan toolchain install`, which is the advice that cannot work here.

### Second bug, found on the way

`reseed-lean-cache.sh` computed elan's directory name with
`tr '/:' '--'`, giving `leanprover-lean4-v4.24.0`. elan's real encoding
is `/` -> `--` and `:` -> `---`, i.e. `leanprover--lean4---v4.24.0`.

So the phase-1 guard against a non-linking toolchain — trap (1) in that
script's own header, the whole reason it exists — tested a directory that
never exists and never fired. Fixed, with the encoding shared as
`elan_dir_name()` and pinned by a test asserting the wrong name is NOT
created.

A related one in the same block: the "already installed" probe searched
`~/.elan/toolchains` tree-wide, so a linkable toolchain of any OTHER
version satisfied it and skipped the install. Now scoped to the pin.
