---
# folio-assistant-g2sv
title: folio-assistant-sci.json declares no skills directory, so its ~70 paper-adapter skills are reachable only through known-skills.ts
status: in-progress
type: bug
priority: high
created_at: 2026-10-04T15:09:14Z
updated_at: 2026-10-04T15:10:22Z
parent: folio-assistant-9umr
---

Evidence: qou work-plan analysis 2026-10-04 (session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91). folio-assistant-sci/skills/ holds the paper adapter, but folio-assistant-sci/folio-assistant-sci.json has no kg entry for it: present but undeclared, the inverse of dh4f.

## Done when
- [ ] the directory is declared as a kg graph per directory-conventions
- [ ] skill_list / LOCAL_PACKAGES serves it; the directory checks are green
