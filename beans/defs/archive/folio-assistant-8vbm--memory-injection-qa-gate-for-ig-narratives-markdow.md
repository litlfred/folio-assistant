---
# folio-assistant-8vbm
$schema: bean/1.0.0
title: 'Memory: Injection QA gate for IG narratives/markdown (fhir-harness#330, PR #332): agent sidecar qa/ig-content-qa.json keyed to content digest, compose gate,...'
status: completed
type: task
priority: low
created_at: 2026-11-10T18:33:45Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `ig-content-qa-gate-330.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Injection QA gate for IG narratives/markdown (fhir-harness#330, PR #332): agent sidecar qa/ig-content-qa.json keyed to content digest, compose gate, browser re-check

Owner 2026-11-10: scan narratives + markdown for injection before publish and before render; "agent scan QA/sidecar w/ gate". Thread …TPzTJG29wRXXEmUMuggBfQ.

- PR fhir-harness#332 MERGED 2026-11-11 ~13:04Z (owner merged; #327/#328 merged before it).
- scripts/ig-content-qa.ts (scan/record/gate), skill skills/fhir-ig-base/ig-content-qa.md, gate in ig-repo-site.ts compose (contentQaGate), "Injection scan" section in ig-qa-page.ts, browser check in templates/ig-pages/ast-resource.js (rules copied between INJECTION_RULES:BEGIN/END, test holds them equal).
- Pattern hits and open findings always refuse. Missing/stale review refuses every publish incl. previews (owner card Q-INJ-1 = B, 18:35Z); only IG_CONTENT_QA_ACCEPT_UNREVIEWED=1 (local build) accepts.
- Rollout: each IG adds qa/ig-content-qa.json to contentTypes.ig.include and commits its first review in its re-pin PR.
