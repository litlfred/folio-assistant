---
# folio-assistant-oepg
$schema: bean/1.0.0
title: 'Memory: GDHCN BPMN reuse (Q-BPMN-1..5) and smart-trust onboarding BPMN (Q-OB-1..4): decisions and draft PRs smart-trust#113, phw#24'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `gdhcn-bpmn-reuse-onboarding.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: GDHCN BPMN reuse (Q-BPMN-1..5) and smart-trust onboarding BPMN (Q-OB-1..4): decisions and draft PRs smart-trust#113, phw#24


Reuse proposal (2026-11-01): https://claude.ai/artifact/PNDVkhHonPbi36ergxvdVy. smart-trust depends on phw and ph4h, so shared blocks B3-B10 live in phw (or smart-ra after committee approval; committee issue smart-ra#202, no smart-ra change until approved). Q-BPMN-2 A: cross-IG bpmn:import plus callActivity QName. Q-BPMN-3 A: jurisdictions point via TrustDomain.useCase.dakComponent.reference to process canonicals. Q-BPMN-5 A (16:03Z): build P1 (onboarding) and P2 (phw shared blocks).

Onboarding analysis: https://claude.ai/artifact/SrZQyRDeNVvqTRZHaGaXEA (Q-OB-1..4 A; text is authority). User 16:10Z: issues only for big things; small mismatches resolved in chat.

Built ~17Z, both DRAFT and CONTENT (need the user's OK to merge):
- smart-trust#113 (issue #112, branch claude/bpmn-onboarding): 9 BPMNs in input/business-processes/ (added to ig.include), SVGs in input/images, section in concepts_onboarding_process_full.md above the original PNG. Terminate stops at the 30-day timer. Letter channels follow Framework IX.
- smart-trust-phw#24 (branch claude/bpmn-shared-blocks; phw has issues disabled): PHW.J issue (B4), PHW.K verify (B7), plus a shared-block address table on business-processes.md.
- 16:33Z: Q-OB-6 A (merge #113 and phw#24 when green; both marked ready). User: diagrams only reference the documentation (no inline key sizes, formats, bot names). Q-OB-5 withdrawn.
- 17:30Z Q-OB-7 A: GPG rule now in concepts_certificate_governance#gpg-keys (RSA>=3072, EC>=256, RFC 4880, email matches LoA); steps [10],[22] and checklist link to it: draft smart-trust#117 (issue #116), content, needs the user's OK. phw#24 merged 17:28Z. #113 lane gate fixed (one documented lane per pool), re-running; merge when green (Q-OB-6 A).
- ~17:45Z user: hold merges of #113 and #117 until they review the staging previews. Quality redo asked: one lane per actor, linked processes, square tasks, no overlapping arrows. Q-OB-9 A and Q-OB-10 A: 12 actors (11 new ActorDefinitions in input/fsh/actors/actors.fsh, plus TrustNetworkAnchor). The page should put a process overview on top and the old narrative at the bottom.
- 18:45Z pushed 092fb2d to #113. It has 12 diagrams (Apply, GoLive and ConveyLetter are new) checked with bpmn-detangle --di-only. ConveyLetter keeps 2 crossings, which are planar-unavoidable. Call activities link to page anchors (<object> embed). Ids stay GDHCN.* rather than Process_. The subgraph thread cmsg_017WNUkNK8kdDziPK58Pv6G9G2GsguUks3HLTMeL7jA2qH owns the input/business-processes declaration and the re-pin. Generator copies: /mnt/project-files/smart-trust-bpmn/ (gen3.py, onb3_head.py + onb3_body.py = spec, page.py, render2.ts, overlap.py).
- 19:00Z preview live (gh-pages a3bb9d9). Card Q-OB-11 asks: A merge #113+#117, B #117 only, C changes first (rec A). The subgraph thread owns the business-processes kind (cat-harness-tools#1316, cat-harness#932) and will add the smart-trust.json entry plus re-pin on claude/bpmn-onboarding.
- 19:09Z DONE: #117 merged (da2a375), #113 merged (dae98c2, Q-OB-12 A despite unrelated pdf.js upstream-pins red).
- 19:25Z follow-up smart-trust#122 (branch claude/onboarding-phase-groups, content, needs the user's OK): Q-OB-13 A (tables grouped by phase, no "Phase N:" prefixes), Q-OB-14 A (no Steps column; page generated from BPMN), Q-OB-17 A (step text in one .md per process beside the .bpmn; each task links via cat-harness.processes:narrative href="X.md#taskId", term added on cat-harness#932 a6d54eb). No business-tasks kind needed (harness global tasks). Pushed bf32b47; MERGED by the user 20:07Z (49a0446). Page generator /mnt/project-files/smart-trust-bpmn/page2.py.
