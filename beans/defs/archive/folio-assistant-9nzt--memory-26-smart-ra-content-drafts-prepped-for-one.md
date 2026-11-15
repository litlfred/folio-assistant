---
# folio-assistant-9nzt
$schema: bean/1.0.0
title: 'Memory: 26 smart-ra content drafts prepped for one-by-one review (Q-WRAP-2 C, Q-CRD-1 A); summary file + preview pattern; thread …E6HFb4KEYDjMgq6a8AyeRu'
status: completed
type: task
priority: low
created_at: 2026-11-11T16:50:55Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-ra-content-drafts-review-2026-11-11.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 26 smart-ra content drafts prepped for one-by-one review (Q-WRAP-2 C, Q-CRD-1 A); summary file + preview pattern; thread …E6HFb4KEYDjMgq6a8AyeRu

2026-11-11: all 26 smart-ra content draft PRs had main merged in (no wording change). Owner card Q-CRD-1 A: conflicts with main's footnote->bibliography move (#232) are carried mechanically (footnote -> \cite key; new sources get references/<key>.json + block `cites` + References list). Done on #183 #185 #193 #194 #197 #199 #204; #203 re-applied its ArchiMate rename on main's model; #236 took main's pins.

Summary file for cards: /mnt/project-files/merge-manager/content-review/smart-ra-content-drafts-2026-11-11.md (merge manager thread cards it in batches). Never merge; committee content.

Preview = dispatch `site-publish.yml` on the branch (works from sandbox, ~5 min, run them serially); page https://litlfred.github.io/smart-ra/STAGING/<branch with / as ->/en/review/.
Pushing feat/ and fix/ branches of smart-ra works from the sandbox (not only claude/).
qa-sweep red "qa:publish FAILED ... gave up after 3 attempts" = qa-reports push race when many PRs update at once; re-run failed jobs.
See folio-assistant-yqdf, folio-assistant-8nm4.
