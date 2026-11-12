---
# folio-assistant-ai6q
$schema: bean/1.0.0
title: 'Memory: fa main red 2026-10-31 after fa#2830: skill:register fails at glossary:page because core pin 00ae0ec''s bpmn-activities glossary page is over budget;...'
status: completed
type: task
priority: low
created_at: 2026-10-31T14:38:57Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `fa-main-red-core-glossary-2026-10-31.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: fa main red 2026-10-31 after fa#2830: skill:register fails at glossary:page because core pin 00ae0ec's bpmn-activities glossary page is over budget; fix = re-pin core


Thread "Fix broken staging previews on main" (cmsg_017WNUkNK8kdDziPK58Pv6G9BHFkMWTsKGEVXWkRrF5h14), 2026-10-31.
Cause: fa pinned folio-assistant-core 00ae0ec. `glossary:page` refuses glossary/bpmn-activities at 1.1 MB (1 MB budget), so `skill:register` stops inside `qa:refresh`, the QA working copy never builds, and uml:overview/glossary:page fail in staging. Core lint also had 2 unused-arg errors. Both are fixed on core main (core#417 split, core#427 lint; tip 093e95b).
Fix route: the "Finish GOAL 1 code-move beans" thread (cmsg_017WNUkNK8kdDziPK58Pv6G93VqD95RaUJa1NZfK4e2LMB) folds the core re-pin into its fa re-pin PR (cat-harness 161b243, tools 5d30589). No competing PR.
Then tell the fa#2847 thread (cmsg_017WNUkNK8kdDziPK58Pv6G9TZ7pyERmUU6G9E7cZ89j3u) to re-run its preview. Note fa#2847 pins core c4a1e8d, which lacks the split too, so it needs core ≥ 5d58034.
Local repro tip: mounts must not be nested git repos (instanceRootsIn skips foreign checkouts), and smart-base's mount is the repo's smart-base/ subdir. Related: folio-assistant-xq9j, folio-assistant-vosx.
Ledger fix: cat-harness#860 (issue #859, branch claude/glossary-ledger-authoring-committee, 7e5852f). Owner card 15:34Z 'A. Ready, merge on full green' = merge #860 when full checks pass, then re-pin fa cat-harness after fa#2855. The relayed window was refused by the safety check; the tap was needed.
Outcome 15:58Z: main pins core 093e95b via fa#2856; main Docs site passes at 26b2d43. cat-harness#860 merged c064b40; GOAL 1 thread moves fa#2855's cat-harness pin to c064b40. fa#2847 thread told to bump core and re-run.
