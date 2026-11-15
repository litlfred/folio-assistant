---
# folio-assistant-2mfw
$schema: bean/1.0.0
title: 'Memory: MVP functional freeze: epic fa#2894 + milestone 1, scope, owners/threads, cascade status, rules learned'
status: completed
type: task
priority: low
created_at: 2026-11-02T17:55:41Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `mvp-freeze-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: MVP functional freeze: epic fa#2894 + milestone 1, scope, owners/threads, cascade status, rules learned


Goal (owner 2026-11-01 20:41Z): all functional work + full harness re-pin, stable; then only content changes. Ingestion-fidelity fixes OK. Scope "MVP = B + C" (all non-content queue items + security review); owner-paused items stay paused. Stable = one green run on every main after the re-pin (Q-MVP-2 B). Render after re-pin = Phase 4b.
- Owner thread cmsg_017WNUkNK8kdDziPK58Pv6G991qa3xg86ZCWdyH2spZ7FS. Epic https://github.com/litlfred/folio-assistant/issues/2894, milestone 1. Queue /mnt/project-files/drain-queue-2026-11-01/queue.md. Briefs /mnt/project-files/mvp-freeze-2026-11-01/sibling-briefs.md.
- WINDOW to 2026-11-03 00:40Z (Q-MVP-6 A 20:40Z, then owner +4h at 17:56Z 11-02).
- CODE FREEZE on lower layers (Q-MVP-5 A, 13:16Z) was LIFTED by owner 17:54Z 11-02 ("unfreeze .... keep going"). Normal window rules apply again.
- Threads (prefix cmsg_017WNUkNK8kdDziPK58Pv6G9): platform/CI …LpArXTbi8RCePgLUzgqwrT; re-pin prep/cascade + 4b render …FDPvN5ktTn4HS2iruRVeZj; fa main reds …BbaFk6c5F5NCsTkzWpJ1eZ; re-pin train …MmDK4fGPz89Zs2mtVYEY36; pipeline …Du4UKr1fKNBQmCQ5adEH4s. Done: deployment, ingestion, S9B BPMN, security.
- DONE: security (fa#2829), train fa#2893, GOAL 5 content model, deployment (uhkv), ksek, PHC Fig. 13, library regroup (cat-harness#934), ingestion, S9B, bootstrap-tools#66, tools#1363/1364/1367.
- Cascade: rounds 1-4 merged at layers (cat-harness#937, core#575, who-iris#168, smart-base#278/#287...). Round 5 (14:00Z) on 11 site PRs: smart-base-clinical#17, smart-hiv#23, smart-immunizations#106, smart-immunizations-uganda#18, smart-ips-pilgrimage#8, smart-trust#131, smart-trust-phw#26, dth-hrh#91, dth-phc#29, dth-sc#18, smart-ra#228. Waiting on who-iris#165, fhir-harness#275, smart-base#295, tools#1409, smart-base#284 (Q-DTH3-4). Then fa final re-pin (train), Phase 4b build+publish, Phase 5 green mains, declare freeze.
- Rules learned: cat-harness pin >= #934 needs core >= fab49a6. Layer re-pin PRs never test their own lock: judge by site/fa PRs (own-lock job post-MVP, Q-MVP-4 A). App has NO Workflows permission (Q-PIN-6 C): workflow-pin bumps in agent PRs. SVG re-render from unchanged .bpmn needs no card; .bpmn layout change = card.
- Post-MVP: own-lock CI job, pvq4, nbp9, vuip/pga6, slash-IRI wave 2 (fragment IRIs), supn/r29x.
- 18:05Z: smart-base-clinical#17 + smart-hiv#23 MERGED. Other 9 on round 7 (fhir-harness c702c34, cat-harness f06cff0, core de60010, smart-base aa4ea3c). Only who-iris#165 left from slash wave (dth-hrh L2 pilot thread), then one more bump. fa final re-pin = train fa#2921.
See folio-assistant-wmmg, folio-assistant-ufn8, folio-assistant-g2bi.
- 2026-11-09 13:20Z close-out check (thread …Wm1DTyZH7m6BHEhgVdDuts): every Phase 0-4 PR/issue listed in fa#2894 is merged/closed. Left: fa main red (CQG 11-08 21:12: core glossary .pot x5 locales, bootstrap graph.schema.json, 2 sdlc BPMN coverage, bun tests, e2e), smart-base main-qa 1 test (kg-validate nested sidecar), bootstrap README stale (bootstrap-tools scheduled check), fa#2881 open. core#461 functional done (only held dth-pc#8, dth-sfp#6). dth-phc#5 fixed by #7 (260/260); closing issues needs owner tap (classifier refused). Card Q-MVPC-1.
