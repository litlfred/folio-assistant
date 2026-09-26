---
# folio-assistant-blwp
title: 'main is red: the real-corpus join test sits ON bun''s 5000ms default, ~12ms over'
status: completed
type: bug
parent: folio-assistant-1xhc
created_at: 2026-09-20T11:53:22Z
updated_at: 2026-09-20T11:53:22Z
---


Found 2026-09-20 while checking whether a CI failure on my own branch had
survived into `main`. It had not — but a sibling's merge immediately after
mine hit the SAME failure.

## Not a flake, and the two numbers are why

```
main   a38fc2e3a3   (fail) the real join runs ... [5012.69ms]  timed out after 5000ms
branch 4946c142e7   (fail) the real join runs ... [5011.41ms]  timed out after 5000ms
```

Two different commits, two different sessions, both **~12 ms over** a 5000 ms
limit. A test that lands within 0.25 % of its own limit twice in six minutes is
not flaky-by-luck; its runtime has arrived at the limit, and from there it
fails intermittently on everything.

## The limit was never a budget

`cat-harness/src/tools/degradation.test.ts` declares no timeout, so it inherits
**bun's default 5000 ms**. The test asserts SHAPE — one row per skill, each in
one of four states — and says nothing about speed. Nobody chose 5 s for it.

## Why it is invisible to every contributor

`probeAll` spawns **one process per declared capability** — 26 today, and the
count only grows. Locally the whole file runs in ~400 ms. On a shared CI runner
the same work is an order of magnitude slower. So it is fast for everyone who
could notice it and marginal only where it breaks the build.

**Not reproduced locally**, and that is stated rather than papered over: three
runs here, all green, ~382 ms. The diagnosis rests on the two CI measurements
and on reading what `probeAll` does, not on a local repro.

## Fix

An explicit `30_000` timeout on that test, with the measurements in the
comment. Generous against the ~5 s observed, still fast enough to fail if the
probe ever genuinely hangs. **No assertion weakened** — the limit was
incidental, not a claim.

Rejected: re-running it. "Flake" is not a root cause, and a re-run would have
passed and left `main` to break again within the hour.

## Note

Carried in PR #501 rather than its own PR, because `main` was RED and a fix
that waits for its own review is a fix that is not applied. It no-ops the
moment the base carries it.
