---
# folio-assistant-mapv
$schema: bean/1.0.0
title: 'Memory: CI stability thread''s open speed/cleanup PRs (2026-11-01 late) and the fa main reds they expose; continuation of platform-ci-stability-2026-11-01'
status: completed
type: task
priority: low
created_at: 2026-11-01T23:53:34Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `platform-ci-speed-prs-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: CI stability thread's open speed/cleanup PRs (2026-11-01 late) and the fa main reds they expose; continuation of platform-ci-stability-2026-11-01


Continuation of folio-assistant-xowb (thread cmsg_017WNUkNK8kdDziPK58Pv6G9MRZwakYehKJLvPdaJcTu2m).

Open PRs to merge on green inside the window (to 2026-11-02 14:40Z):
- MERGE ORDER: tools#1358 (lone shard artefact unpacks flat) BEFORE cat-harness#940 / bootstrap-tools#68, then re-run those.
- MERGED 01:43Z: tools#1351, bootstrap-tools#72. MERGED 02:40Z tools#1358; 03:23Z core#581, core#582; 03:25Z bootstrap-tools#68 (one-shard verified green). MERGED 02:35Z: tools#1347 (p7mb: next = pin into fa + 2 clean regen runs, then close p7mb, tell sibling thread). cat-harness#940 merged 00:51Z by litlfred account BEFORE #1358.
- Speed: tools#1351 (fwtz writer record every 6h), cat-harness#940 + bootstrap-tools#68 (gate-shards 1), tools#1350 + fa#2895 (Q-CIS-1 A), tools#1347 (regen classification).
- 7mwa: fhir-harness#267, sci#166, smart-base#275+#276 all MERGED 00:28Z; tools#1350 merged 00:25Z; fa#2895 merged 00:31Z (reds ⊂ train fa#2896 reds).
- Glossary test timeout fix (fa shard 1/4 flake, "extracted KG terms" 5.1s): core#582.
- Reference-direction comment fixes: bootstrap-tools#72, core#581 (tools's 3 files were already fixed on tools main). bootstrap-tools#71 closed (opened on a stale branch).
fa#2895 reds, all from pins (commented on the PR): render:bpmn:check SVG drift (fa main reds thread owns; bootstrap-tools#66), translation:pot:check (passes at fa main 14b6f21), reference-direction (above).
Pipeline thread cmsg_017WNUkNK8kdDziPK58Pv6G9Du4UKr1fKNBQmCQ5adEH4s fronts the queue: send it every new PR number. It is building regen debounce + fa CQG no-new-failures + path filters (Q-PIPE-1 A).
Train fa#2905 stage reds (04:52Z): escaped-markup -> core#588 (code span wrap in review-log-watch.md); dead smart-base links -> tools#1374 (preview-only repoint to published site; pages ARE live on gh-pages, preview just does not carry smart-base). Merge both on green.
Concurrency bug (06:50Z, fhir-harness main-green thread): merged PR closed run joins main group and cancels main push runs; fix tools#1384 MERGED 10:07Z (8c8cca7); report.py half needs fa re-pin of tools.
09:00Z: bootstrap-tools#75 (publish-site shallow+sparse clone; smart-ra disk full run 41411973742), tools#1401 (refdir comments, fhir-harness#269). Merge on green.
Q-CIS-3b A (23:26Z): lazy base waits until every main is green.
Record-pin staleness (follow-up, post-MVP): PR runs pin index/lower layers/state tips to main's last cone record, so content newer than the record breaks them: cat-harness "derived" key (record b79da33 mounts tools 329f553), tools adversarial-checklist (record a8f46f0 has qa-reports tip before main/36b4fe0 23:58Z refresh). Clears when the repo's next main push run records new pins.
