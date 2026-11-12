---
# folio-assistant-wrqs
$schema: bean/1.0.0
title: 'Memory: 2026-10-23 trial-merge results and sync plan between WorldHealthOrganization/smart-* and litlfred/smart-* (thread "WHO migration prep")'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `who-sync-plan.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 2026-10-23 trial-merge results and sync plan between WorldHealthOrganization/smart-* and litlfred/smart-* (thread "WHO migration prep")


Plan doc: https://claude.ai/artifact/87CceNobNTDywszH5kxeQP. User chose scope b (content + harness wiring) on 2026-10-23 "for now"; shared layers stay in litlfred and may move elsewhere later (not necessarily WHO). See [[fhir-beans-and-who-migration]].

- smart-base: the 3 WHO-only commits are our own #98/#100 fixes (WHO#335); merging WHO main gives a tree identical to the fork's.
- smart-trust: 11 behind; 3 already in fork by patch-id. New from WHO: e277cce (GDHCN framework docx/pdf, v1.7.4 changelog), 2588efa (nightly DEV participants Action, keeps adding commits). Trial merge conflicts: changes.md (keep both), qr_code_generation.md (WHO lacks the hcert live demo; keep fork side). sushi-config goes to 1.7.5.
- Forks made workflows manual-only and removed IG Publisher build; recommended not to upstream that.
- 2026-10-23 user: forks should pull in ALL WHO changes now; no upstream PRs yet ("just get all prepared"); never change WHO repos without permission. PRs: smart-trust#66 (issue #65), smart-base#121 (issue #120), merge-commit method; both merged 2026-10-23 (user OK), forks 0 behind WHO. smart-base main SUSHI clean (exact versions via fhir-cache-seed-npm + mirror c344c47). smart-trust main SUSHI clean too (mirror b86d80a, 0 missing, 0 errors). smart-base#125 and smart-trust#68 (merged) tell agents to read fhir-validation before SUSHI.
