---
# folio-assistant-cydz
title: IG personas cross-link to BPMN swimlanes, with a lane/persona QA check
status: todo
type: task
priority: normal
created_at: 2026-10-10T16:13:16Z
updated_at: 2026-10-10T16:13:25Z
---

Owner 2026-10-10: personas/roles should cross-link to the swimlanes in the processes, following cat-harness's role=swimlane QA (related: sqtq, u5va).

Measured on smart-immunizations main (86898e6):
- 8 personas live only as rows of an HTML table on personas.md. There are NO ActorDefinitions.
- The lanes exist only inside 10 Visio SVGs, as v:val of visHeadingText.
- Match: HW is inside 'Vaccination location / Health worker' (8 processes), Client (C), System administrator (A,G,H), CHW (F).
- No lane anywhere: EPI Manager, Caregiver, Child, Clerical staff.
- Lane with no persona: PCPOSS (G,H,I), Electronic immunization registry (E, a system lane), and 'Function' (a header lane in every SVG).
So linking needs a DECLARED alias map (CHW, HW, pool/lane split) plus a QA check that reports these gaps, not string matching. Nothing built.
