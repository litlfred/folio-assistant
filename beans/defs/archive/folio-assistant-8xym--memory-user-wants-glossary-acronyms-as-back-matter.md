---
# folio-assistant-8xym
$schema: bean/1.0.0
title: 'Memory: User wants glossary+acronyms as back matter in every document; card Q-BM-1 (2026-11-02) on acronyms-as-glossary-subsection; smart-ra#230'
status: completed
type: task
priority: low
created_at: 2026-11-02T18:05:48Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `document-back-matter-order.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: User wants glossary+acronyms as back matter in every document; card Q-BM-1 (2026-11-02) on acronyms-as-glossary-subsection; smart-ra#230


User (2026-11-02 18:02Z): glossary and acronyms go at the END of documents; opening a doc must show title + intro/abstract. Wants consistency across documents. Thread "Move glossary and acronyms to end matter" (cmsg_017WNUkNK8kdDziPK58Pv6G9AcL9aRjjsVCideLLzUF3hc).

State found 2026-11-02:
- Chapter order is per-document in each paper manifest (folio/<doc>/<doc>.ts, chapterRef list). No front/back-matter concept in the cat-harness-tools schema.
- dpi-h-ra: Acronyms, Glossary were first; acronyms are a separate SKOS scheme (glossary/dpi-h-ra-acronyms.glossary.json, 18) beside dpi-h-ra.glossary.json (33), 3 overlap. Merging = content (smart-ra paused).
- dth-sc, dth-phc: one "front-matter" chapter holding abbreviations + glossary. dth-hrh: annexes, glossary, references at end (already close).
- Public comments anchor on sec:acronyms-lead; public-comment.ts finds block files via review-anchors.json chapter dir, so do NOT move block files between chapter dirs in dpi-h-ra.

Proposed structure: front (title, summary, how to use) / numbered chapters / back = Annexes, Glossary (Terms, Acronyms subsection), References. Acronym = SKOS notation of a glossary term (see folio-assistant-z0a0).

Card Q-BM-1 (cmsg_017WNUkNK8kdDziPK58Pv6G9CzNx45yB99HsQJ9dV5S7vV): A all docs + acronyms subsection + warn-only core check (recommended) / B acronyms own chapter / C dpi-h-ra only. Unanswered at 18:20Z.
smart-ra#230 (issue #229): dpi-h-ra chapter reorder only, draft, fast checks green 18:12Z. Marking ready was blocked for me; card Q-BM-2 (cmsg_017WNUkNK8kdDziPK58Pv6G99wCX6ZMq2TW6e51P2n7wWj) tapped B by mistake, corrected to A in words 18:17Z: marked ready 18:18Z, merge when full checks green.
Card Q-BM-3 (cmsg_017WNUkNK8kdDziPK58Pv6G98igzjYcWvZu1rDWuHfoRsT): merge dth-sc#24, dth-phc#33, core#622 when green? A/B, open 19:05Z. Q-BM-1 = A (user tap 18:20Z). Handover bean folio-assistant-bmat (folio-assistant branch cat/cat-harness/beans). PRs: smart-ra#230 (approved, merge on green), dth-sc#24, dth-phc#33, core#622 (warn-only scripts/back-matter-order.ts + document-structure skill rule). dth-hrh needs no change (no notation data; adding = committee content).
Card Q-BM-4 (cmsg_017WNUkNK8kdDziPK58Pv6G9RBRTJeLUvFeVCX3yVwGHTk): corpus gate blocks block moves; A split+gate fix cat-harness-tools#1416+re-pin / B editor sign-off records / C wait.
Q-BM-4 = A (tap 18:59Z): #230 reverted to reorder (216203a); nesting on smart-ra branch claude/glossary-acronyms-nest; cat-harness-tools#1416 ready; then re-pin.
smart-ra#230 MERGED 8257473 19:15Z.
cat-harness-tools#1416 MERGED 8560fbe 19:26Z; re-pin asked of Re-pin train thread.
core#622 MERGED 11-05. 11-07 16:10Z: pins 42cc850 include gate fix. dth-sc#24 new red = corpus-gate, caused by owner commit 6169f64 (declared-path-literal comments on glossary/p-front-page-008/009.ts break R100); card Q-BM-5 (cmsg_017WNUkNK8kdDziPK58Pv6G91cPTk8CMYPAxo1dvo13Q1p) A revert / B sign-off / C leave. dth-phc#33: 0 new failures, digest-mismatch only, run 42201170779 re-run. Nest branch smart-ra claude/glossary-acronyms-nest still to PR.
11-08 06:32Z: Q-BM-5 = A; revert pushed dth-sc#24 a97df08 (R100 restored), PR comment posted. Merge of #24/#33 still awaits Q-BM-3.
11-08 06:35Z: Q-BM-3 = A (tap). dth-phc#33 MERGED 9cb61fb. dth-sc#24 CI running on a97df08, merge on green (subscribed).
11-08 06:42Z: user (other thread, cmsg_017WNUkNK8kdDziPK58Pv6G9HDuSWdDhaZqYpmHAhjPQJh) 'hold content on dth-* and smart-ra': dth-sc#24 HELD, do not merge on green. Nest branch PR also held.
11-08 06:44Z: dth-sc#24 re-run still red: New failures 0, only digest-mismatch (CI pin/prepare mismatch, not the PR). Held anyway; on release, look at digest-mismatch (compare job) before merging.
11-11 16:48Z: another session merged main into dth-sc#24 (195c535); clean, fast tier green. Still HELD (content hold).
