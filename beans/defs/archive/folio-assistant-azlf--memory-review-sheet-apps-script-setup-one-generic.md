---
# folio-assistant-azlf
$schema: bean/1.0.0
title: 'Memory: Review-sheet Apps Script setup (one generic Code.gs + locked Config tab per sheet), the DTH-HRH Contributor Log and the two templates'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dth-hrh-drafting-sheet.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Review-sheet Apps Script setup (one generic Code.gs + locked Config tab per sheet), the DTH-HRH Contributor Log and the two templates


- 2026-10-30 (user): dth-hrh is in drafting, not public comment. It needs the simpler contributor-feedback sheet now; the public-comment sheet comes later.
- Sheets (all owned by informatics.avengers):
  - DTH-HRH Contributor Log: 136BxUK15IUKEm2u-H6rpUkFac6754aRWTeJFe_UKbdU (tabs Contributor Feedback, Agent, hidden TOC, Config).
  - Folio Assistant - Contributor Template: 1PtcNJgLQIA1BjapU51pAQzqQjGylBHYNKlCPzZkwVag.
  - Folio Assistant - Public Comment Review Template: 14PtLd2U_tBQV5OHoEEVRJK1EKfsbZEBPP_MIqo2E3o4.
- Owner chose option C (2026-10-31): ONE generic Code.gs for every document (core#322); each sheet has a visible Config tab locked to the owner, written by the agent (build-review-sheet-script.ts --config ... --out rows). Templates: everything locked to the owner except blue (human) columns (user, 2026-10-31).
- Files: /mnt/project-files/review-sheet/Code.gs and appsscript.json (generic). Older per-document builds under dth-hrh/drafting-sheet and dpi-h-review-sheet are superseded.
- Contributor Feedback columns: one per contributor, "Contributor Feedback (<initials>)", matched by prefix. Sections is a plain multi-select; green Section links column shows the links.
- Owner still to do: paste the generic Code.gs + appsscript.json and run installTriggers in each sheet and template; tick "Allow multiple selections" on Sections.
- Open: publish the generic Code.gs once (with SHA-256) and each document's config as a KG node; link from review pages.
- Related: folio-assistant-2a0d.
- 2026-10-31: CS-001 agent proposal written (Agent!H2 basis za0c4p). Owner rule: every review log (drafting or PC) gets its own watcher. core#343 (Watch tab + watcher thread) closed 2026-11-01 on the owner's card, superseded by the mechanical review-log watch core#476; the watch-2026-10-31/Code.gs build is obsolete.
- 2026-10-31 (core#374): Contributor Log column K renamed "Feedback (agent)". Agent questions go there as "Decision needed:" blocks with Agentic status Needs human.
- 2026-10-31 13:35Z owner chose: Apps Script LIBRARY at HEAD ("Folio Review Library", standalone; identifier Review). Sheets keep dist/Stub.gs (core#413). Updates = one paste into the library. Library ID 1us7_ApIq_XvDG-V1XtqdcyHucF0hSlST0qracv1Tw9KTb4-lAFvK1bMQ. 2026-10-31 14:04Z: both templates + all 4 logs now run the stub (core#422).
