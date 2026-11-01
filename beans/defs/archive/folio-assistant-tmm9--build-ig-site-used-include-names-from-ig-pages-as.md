---
# folio-assistant-tmm9
$schema: bean/1.0.0
title: 'build-ig-site used include names from IG pages as paths without checking'
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

**What was wrong:** fhir-harness `scripts/build-ig-site.ts` used names from `{% include %}` / `{% lang-fragment %}` tags directly in read and write paths under `_includes`.

**Fix:** fhir-harness#244, merged as ab2d071: names that are not a single safe segment are refused and reported (`refusedIncludes`); a subfolder include name in an IG page is now refused.

Held privately until the fix merged (owner's choice, 2026-10-31).

_2026-10-31T04:22Z_ — Filed after the fix merged, session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b
