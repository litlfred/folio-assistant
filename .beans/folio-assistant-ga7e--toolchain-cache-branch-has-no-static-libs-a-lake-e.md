---
# folio-assistant-ga7e
title: Toolchain cache branch has no static libs (.a) — lake exe cannot link
status: todo
type: bug
priority: high
created_at: 2026-08-07T14:02:53Z
updated_at: 2026-08-07T14:15:41Z
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
