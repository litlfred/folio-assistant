---
# folio-assistant-gdav
$schema: bean/1.0.0
title: 'Memory: The four IRIS DTH handbooks, their repos (WHO upstream + litlfred forks, created 2026-10-31) and the L2-on-smart-ra workplan'
status: completed
type: task
priority: low
created_at: 2026-10-31T00:21:21Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dth-l2-repos.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: The four IRIS DTH handbooks, their repos (WHO upstream + litlfred forks, created 2026-10-31) and the L2-on-smart-ra workplan


Owner created 2026-10-31 00:20Z: WorldHealthOrganization/dth-phc, dth-sc, dth-pc, dth-sfp, each forked to litlfred/. Work only in the litlfred forks; never push or PR to the WHO ones without explicit permission.

- dth-phc = 9789240093362 (primary health care, point of service), IRIS 32a98265
- dth-sc = 9789240101197 (supply chain architecture), IRIS ceaeb260
- dth-pc = 9789240116191 (health product catalogue), IRIS fd2019bb
- dth-sfp = 9789240120747 (substandard and falsified products reporting), IRIS 187cabc7; its PDF is missing from who-iris uploads/

All four are already L1 entries in litlfred/who-iris library/<isbn>-eng. Goal (owner): each becomes an L2 DTH that depends on smart-ra: narrative validated against the glossaries, narrative linked to ArchiMate. dth-hrh is the pilot. Workplans: /mnt/project-files/dth-l2-ingest-2026-10-31/workplans.md. Thread "Prepare DTH ingests as L2 on smart-ra".

SFP workplan draft (2026-10-31): /mnt/project-files/dth-l2-ingest-2026-10-31/sfp-workplan.md, awaiting owner approval; issue is litlfred/dth-sfp#1 (smart-ra#136 closed as moved); glossary conflicts smart-ra#139; term placement left open as smart-ra#146 (owner, 01:30Z).

Dependencies (owner, 2026-10-31 00:45Z): dth-pc and probably dth-sfp depend on dth-sc (mount it). Definition conflicts with smart-ra are raised as issues on litlfred/smart-ra. Issues were off on the dth-* forks; dth-sfp has them on since ~01:25Z (workplan is litlfred/dth-sfp#1, smart-ra#136 closed as moved; SFP glossary conflicts in smart-ra#139). Owner wants each DTH workplan issue on its own repo. Per-DTH workplans: pc-, sc-, phc-, sfp-workplan.md beside workplans.md.

PC (2026-10-31): workplan issue is litlfred/dth-pc#2 (smart-ra#141 closed as moved). Owner approved BPMN/roles/DMN section 2e and Q6 A at 01:43Z: the L2 DTH kind (smart-base#242) should admit the DAK kinds persona, actor-definition, business-process, decision-logic, plus a shared step-table schema. Ids are PC-BP-nn, PC-R-nn and PC-DT-nn. SC and PC ArchiMate views go on smart-ra branch claude/sc-pc-archimate-views (0.3.0-draft folder), opened by the SC thread.

HRH pilot wiring (2026-10-31 08:40Z, thread 'Finish dth-hrh issue 47'): smart-ra#144 and #148 merged (main 6c60711); dth-hrh draft PR #63 mounts smart-ra as instance `dpi-h-ra` (glossary + archimate dirs only), adds glossary broadMatch and meta.archimate links on 22 ch04-08 blocks. Template for the other four DTHs: dth-hrh docs/l2-wiring.md. #47 structured content (BPMN, persona links, DMN) still open, waits on structured authoring.
