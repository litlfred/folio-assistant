---
# folio-assistant-kto9
title: Guard script_commit_sha drift in QA script sidecars
status: completed
type: task
priority: normal
created_at: 2026-09-18T15:26:22Z
updated_at: 2026-09-18T15:31:01Z
---

**Re-aimed after the investigation.** The title says "drift"; the real defect
is that the sweep *invents* provenance in a shallow clone.

`gitFileCommitSha` ran `git log -1 --format=%H -- <file>` and returned the
answer. In a truncated history that reports the GRAFT BOUNDARY for any file
untouched inside the fetched window — the commit where history stops and
every file looks newly added — which is indistinguishable from a real answer.

**Measured 2026-09-18**, this container: 102 commits, `.git/shallow` present,
boundary `04092f37`. A sweep rewrote **77 of 78** script sidecars to that one
sha, collapsing provenance that legitimately carried **nine** distinct
commits. I read the rewrite as a correction of stale data and pushed it, then
caught it and reverted.

**Fixed:**
- `gitFileCommitSha` returns `GIT_SHA_UNKNOWN` when the repo is shallow and
  the answer is a boundary commit. "Cannot determine" is a third state.
- The sweep's sidecar writer keeps the STORED value on `unknown` rather than
  overwriting. An older true answer beats a fresh false one.
- Test asserts both directions: a file committed inside the window still
  resolves to a real sha (so the guard is not "always unknown"), and a
  boundary-attributed file reports unknown.

Verified: re-running the sweep leaves every `script_commit_sha` byte-identical;
only `last_run_at` / `last_run_sha` / content hashes move.

Same wall `ci-health.yml` avoids with `fetch-depth: 0`, hit from the other
side — there the shallow clone stops an answer, here it supplies a wrong one.
