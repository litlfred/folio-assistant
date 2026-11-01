---
# folio-assistant-u8ps
$schema: bean/1.0.0
title: 'build-ig-indexes used unchecked instance names in paths and a shell command'
status: completed
type: bug
priority: high
created_at: 2026-10-31T04:22:00Z
updated_at: 2026-10-31T04:22:00Z
parent: folio-assistant-33iz
tags:
    - security
    - security-review-2026-10-31
---

**Category:** security · **severity:** major

**What was wrong:** fhir-harness `scripts/build-ig-indexes.ts` took an instance declaration's `name` into a working-directory path that is removed, and into a `sh -c` string.

**Fix:** fhir-harness#244, merged as ab2d071: names must be a single safe segment or the instance is skipped, and paths reach the sidecars step as positional parameters.

Held privately until the fix merged (owner's choice, 2026-10-31).

_2026-10-31T04:22Z_ — Filed after the fix merged, session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b
