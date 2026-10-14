---
# folio-assistant-cydz
$schema: bean/1.0.0
title: IG personas cross-link to BPMN swimlanes, with a lane/persona QA check
status: todo
type: task
priority: normal
created_at: 2026-10-10T16:13:16Z
updated_at: 2026-10-10T16:47:37Z
parent: folio-assistant-uhkv
---

Owner 2026-10-10: personas/roles should cross-link to the swimlanes in the processes, following cat-harness's role=swimlane QA (related: sqtq, u5va).

Measured on smart-immunizations main (86898e6):
- 8 personas live only as rows of an HTML table on personas.md. There are NO ActorDefinitions.
- The lanes exist only inside 10 Visio SVGs, as v:val of visHeadingText.
- Match: HW is inside 'Vaccination location / Health worker' (8 processes), Client (C), System administrator (A,G,H), CHW (F).
- No lane anywhere: EPI Manager, Caregiver, Child, Clerical staff.
- Lane with no persona: PCPOSS (G,H,I), Electronic immunization registry (E, a system lane), and 'Function' (a header lane in every SVG).
So linking needs a DECLARED alias map (CHW, HW, pool/lane split) plus a QA check that reports these gaps, not string matching. Nothing built.


2026-10-10, BUILT (owner chose 1a):
- fhir-harness#34 (3770ff7): .md annexes appended to pages.
- smart-base#37 (77b44cd): dak-swimlanes.ts, declared map plus qa-results/v1.
- smart-immunizations#19 (1d563d6): swimlanes.json, the two cross-ref annexes, test/results/swimlanes.qa-results.json.
7 findings: EPI Manager, Caregiver, Child and Clerical staff have no lane; PCPOSS (G,H,I) is undeclared on purpose and waits on the owner to say what it is. Same deploy dependency as fm9n.
