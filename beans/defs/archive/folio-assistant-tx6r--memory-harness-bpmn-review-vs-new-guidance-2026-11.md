---
# folio-assistant-tx6r
$schema: bean/1.0.0
title: 'Memory: Harness BPMN review vs new guidance (2026-11-01): shared blocks G1-G10, PR status, open cards Q-BR-8'
status: completed
type: task
priority: low
created_at: 2026-11-02T06:02:18Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `bpmn-guidance-review-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Harness BPMN review vs new guidance (2026-11-01): shared blocks G1-G10, PR status, open cards Q-BR-8


Thread "Review harness BPMNs against new guidance" (cmsg_017WNUkNK8kdDziPK58Pv6G9HSerGqa37rtB7vMnhUVDbN).
- Report doc: https://claude.ai/artifact/L88ELVcxhtoQBLUhomXVbN ; raw output in /mnt/project-files/bpmn-guidance-review-2026-11-01/.
- Shared blocks: G1 bean wrapper, G2 tracked watch, G3 generated-file drift, G4 change set, G5 separate a graph (kg-separation+sub-kg-lifecycle+graph-detanglement), G6 folio review/publish (doc+paper), G7 translation global tasks, G8 ask-the-person -> bootstrap human-agent-discussion, G9 release a fixed version (phw candidate), G10 checklists as DMN.
- Answers: Q-BR-1 C (guidance + sibling "Fix harness BPMN diagrams" for mechanical fixes), Q-BR-2 C then all remaining blocks here, Q-BR-3 A (stores are data store refs, not lanes), Q-BR-4 B (Cloudflare OK for who-iris), Q-BR-5 A, Q-BR-6 A (cat-harness needs bootstrap), Q-BR-7 A (share back half of authoring), Q-BR-9 A (user marked core#485 ready).
- Split: sibling does close-bean-once edits, mixed gateways, missing calledElement, store lanes; this thread owns G-block files.
- MERGED by 2026-11-02 06:00Z: guidance cat-harness#893, G3 #899 + sci#162, G8 #901, G7 #905, G10 #909, G6 core#481, tools#1247 (process inputs), core#575 (core re-pin carrying #485's sample-import-run files; #485 closed superseded).
- OPEN: cat-harness#896 (G2) red only because CI mounts tools at the fa/index.lock.json pin f92092e (before #1247); goes green after fa's tools re-pin (asked re-pin cascade thread cmsg_017WNUkNK8kdDziPK58Pv6G9FDPvN5ktTn4HS2iruRVeZj). sci#163 (G6 paper) open, checks running.
- PENDING card Q-BR-8 (cmsg_017WNUkNK8kdDziPK58Pv6G9TGU3r1UZxFBDpLeW4YgvCK): G1 bean steps, A wrapper / B one drawn pattern (rec) / C skip. G5 waits on it; then G4, G9.
- 2026-11-01 18:53Z: new kind "business-processes" (content BPMN such as DAKs) is drawn but never run by the engine; engine-gate advice applies only to harness processes.
- Generators lived in ~/gen (lost with the container).
Related: folio-assistant-o03d, folio-assistant-8pg0, folio-assistant-20kq.
