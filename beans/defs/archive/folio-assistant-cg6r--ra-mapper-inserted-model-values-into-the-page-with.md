---
# folio-assistant-cg6r
$schema: bean/1.0.0
title: 'RA Mapper inserted model values into the page without escaping'
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

**What was wrong:** smart-ra `tools/ra-mapper/template.html` (and the shipped `tools/SMART-RA-Mapper.html`) put model and imported-file values (folder names, type labels, ids) into `innerHTML` and inline handlers without escaping, and saved imported models to localStorage.

**Fix:** smart-ra#177, merged as ac9e496: `esc()` covers `'`, every rendered value is escaped, and ids and types outside a fixed shape are refused on import, on reload from storage and at build time.

Held privately until the fix merged (owner's choice, 2026-10-31).

_2026-10-31T04:22Z_ — Filed after the fix merged, session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b
