---
# folio-assistant-bzry
$schema: bean/1.0.0
title: 'Memory: 11-10 "Stop failing post-merge QA emails" thread: why layer mains are red, main-qa email fix PR, Pages timeouts'
status: completed
type: task
priority: low
created_at: 2026-11-10T21:45:05Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `qa-email-spam-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 11-10 "Stop failing post-merge QA emails" thread: why layer mains are red, main-qa email fix PR, Pages timeouts


Thread cmsg_017WNUkNK8kdDziPK58Pv6G97hzuBmHhA1AVDQwkGAEKoK (user: "getting spammed", "fix failure").
- Email cause: layer-main-qa.yml report.py exits 1 when main verdict red (even when main moved on) -> "Some jobs were not successful" mail per push in every layer. Fix tools#1812 (issue #1811): continue-on-error + report.py returns 0 with ::warning::. Green; merge refused by classifier -> card asks user (A merge rec). Layers call the workflow @main, so it applies at once.
- Red mains 11-10 21:40Z: cat-harness #1169, fhir-harness #318, who-iris #212, smart-base #337, fa #3043.
- Root cause of most layer reds: fa index.lock.json pins mismatched layer commits (tools 1ccb9f7, smart-base 0653082, cat-harness a930e94...) and fa re-pin trains keep failing; layers judge against fa's pins, so they fail on things fixed upstream. Train fa#3067 stage killed by runner shutdown; job re-run 21:58Z.
- Real bugs fixed: core#721 (bibliography/glossary-page --scope Text -> IdList; graph:check-tools), cat-harness#1216 (merge-to-main.md named cat-harness-tools; reference-direction). Both draft.
- Pages "pages build and deployment" deploy failures (dth-hrh, smart-immunizations, smart-html-jtd): GitHub Pages stuck at syncing_files -> 10 min timeout; large sites (see site size Q-SZ work).
- "Site publish (by hand)" failures in smart-fp/anc/dak-pnc are forks-thread setup runs, not recurring.
Related: folio-assistant-uxx6, folio-assistant-h8jd.
- 21:50Z user picked B on #1812 (don't silence; fix failures). #1812 back to draft.
- 21:56Z user: red-main watching is the merge manager's standing duty ("dispatch an agent to fix them", "Add to process"). All reds + findings handed to MM thread. Skill change cat-harness#1218 (issue #1217, merge-manager-watcher.md "Red mains and failing runs") drafted; MM's own agent was writing the same — offered #1218 to it. Core main also red on glossary:pot:check (5 locale .pot stale).
- 22:51Z new cause: quick merges cancel the pending main run (one pending run per concurrency group). tools#1817 (issue #1816) keys push runs by sha; MERGED 23:27Z.
