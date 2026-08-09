---
# folio-assistant-zq4t
title: status and seed disagreed about which caches need own-package oleans — the false alarm that misdirected 5d7z
status: done
type: bug
priority: high
created_at: 2026-08-08T15:10:00Z
updated_at: 2026-08-08T15:10:00Z
---

Claimed and finished on `claude/agent-4672-4676-stalled-cldnw5`.

`lake-cache.sh seed` exempts `mathlib` from the own-package guard — for that
roster entry the lake-root is `.`, the "own package" is the workspace-root shim
that exists only to pull Mathlib in, and its `.lake/build/lib` is empty by
construction. `cmd_status` had no such exemption, so pointing it at the
workspace root printed:

    package:    mathlib
    branch:     lake-cache/mathlib-v4-24-0
    oleans:     7268  (deps + own)
    own pkg:    0
    ! but ZERO belong to this package — only its dependencies are cached.

That is the mathlib family behaving correctly, dressed as a gutted
per-package cache.

Fixed by factoring the exemption into one predicate, `own_oleans_expected`,
which both callers now ask. Two tests added: `status` applies the exemption,
and `status` still reports a genuinely gutted per-package cache. Suite: 23
pass, 7 skip, 0 fail.

## Why it mattered

Those seven lines are, verbatim, the evidence bean `folio-assistant-5d7z`
opens with — "7268 oleans, all dependencies, none QOU.*". They are the
**mathlib** family's numbers, attributed to `qou`. See the correction appended
to that bean; it is a sibling's and was not resolved here.

## Method note

The tell was that `status` and `seed` asked the same question in two places
and answered it differently. When a guard has an exemption, the reporter that
shares its predicate needs the same one — otherwise the reporter manufactures
alarms the guard would have waved through.
