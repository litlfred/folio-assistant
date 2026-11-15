---
# folio-assistant-n915
$schema: bean/1.0.0
title: 'Memory: Where ITB deployment docs/process/skills live; draft page cat-harness#1175 with owner questions Q-ITB-1..4'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `itb-deployment-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Where ITB deployment docs/process/skills live; draft page cat-harness#1175 with owner questions Q-ITB-1..4

Owner asked 2026-11-10 11:29Z "deployment in context ITB" (thread cmsg_017WNUkNK8kdDziPK58Pv6G9TXhbWGkmYH4DMfsNRTwm6r). Found: design only in cat-harness proposals assured-ai-test-harness-2026-11-03 (§4, §9.4 steps 12/14), bean-store-and-process-driver-2026-11-02 (§4.8 services, §4.11 itb-benchmark sketch), test-interop-itb-fhir-testplan (D3, D4); deployment schema in cat-harness-tools schemas/process/deployment-description.ts; examples cat-harness/scenarios/deployments (no itb-benchmark). No ITB BPMN or skill. ITB README ingested in fhir-harness library/isaitb-2026-….
Owner picked card option A: docs-only draft PR cat-harness#1175 (branch claude/itb-deployment-page) adds docs/proposals/itb-deployment-2026-11-10.md with Q-ITB-1 hosting (rec H1 local compose, then H2 cloud), Q-ITB-2 ITB/agent actors, Q-ITB-3 process+skill timing, Q-ITB-4 compose source (itb-manager). Questions not yet carded. 11-10 16:03Z owner wrote "B" (ambiguous); 11-11 03:04Z owner marked #1175 ready for review, so the PR is kept (card closed as keep-PR). CI green on ba9e895. MERGED 11-11 13:04Z. Q-ITB-1..4 on hold until steps 12/14 start.
**How to apply:** card Q-ITB-1..4 after owner reviews the page; don't build ahead of steps 12/14.
