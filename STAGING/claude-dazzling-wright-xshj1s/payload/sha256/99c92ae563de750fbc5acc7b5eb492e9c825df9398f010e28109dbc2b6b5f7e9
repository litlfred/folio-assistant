---
# folio-assistant-81qz
title: 'STALE FOLIO PATH IN PLATFORM: audit-wiring.ts''s docblock says it walks content/quantum-observable-universe/'
status: completed
type: bug
priority: normal
created_at: 2026-10-04T15:52:13Z
updated_at: 2026-10-04T15:52:33Z
parent: folio-assistant-zzmr
---

Recorded from the qou orphaned-content census, 2026-10-04 (ORPH report; session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91, issue #2106). The census flagged cat-harness/content/pipeline/audit-wiring.ts as walking one folio's tree. Re-measured: the CODE already resolves the paper through requirePaper(--paper) and folioDir. Only the docblock named qou's path (stale since qou moved content/ -> folio/) and a qou docs/audits note. Docblock corrected in PR #2107.


## Summary of Changes
_2026-10-04T15:52:20Z_ — PR #2107. The docblock now describes `<folio>/<paper>/<chapter>/` through folioDir and requirePaper, and says it named qou's path until today. No code change was needed. The other qou mentions in content/pipeline (readme-sections, trivial-skeleton-audit, generate-block-tex, render-latex, qa-criteria-registry) were read: they are history or examples, not paths the platform walks.


_2026-10-04T15:52:33Z_ — correction to the line above: qa-criteria-registry.ts is NOT history. It still ships qou's wall criteria, with qou chapter names in their descriptions. They are fenced by the `qaAxes: ["archimedean-wall"]` opt-in, and the comment there names re-expressing them as folio-supplied data as the remaining repair. Not a path the platform walks, but still folio content in the platform. Out of scope for this bean.
