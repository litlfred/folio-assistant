---
# folio-assistant-kiy1
$schema: bean/1.0.0
title: 'Memory: Review of which smart-ra figures/tables can be generated from ArchiMate/FSH/KG (2026-11-01), cards Q-RAC-1..3'
status: completed
type: task
priority: low
created_at: 2026-11-01T11:12:05Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-ra-computable-figures.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Review of which smart-ra figures/tables can be generated from ArchiMate/FSH/KG (2026-11-01), cards Q-RAC-1..3


2026-11-01 thread "Make smart-ra figures and tables computable" (cmsg_017WNUkNK8kdDziPK58Pv6G9LjtwMVTwtApxpQ2SdWyj3T) reviewed litlfred/smart-ra 7aaec92. Report: /mnt/project-files/smart-ra-computable-2026-11-01/review.md.

- Tier A (data already in model): Table 3.1 (Metamodel view + Definition/Description/Example props), 3.2, 3.3, Figure A.1 (= view "Metadata Registry Governance"), figures already mapped in archimate/cat-archimate.config.json, glossary + acronyms (glossary/dpi-h-ra.glossary.json).
- Key finding: Table 3.3's 16 "standard relationships" disagree with model 0.2.0 (6 unused; Capability influences Goal x21 etc. missing).
- Tier B needs data first: Tables 2.2, 2.4, App A, App B, Appendix C requirements and data elements.
- USER RULE (11:16Z): the RA is technology-neutral, so never propose FHIR (Requirements, logical models) as the source for RA content. Use the ArchiMate model (Q-RAC-3 withdrawn; Q-RAC-4 asks ArchiMate vs neutral YAML vs hand-written).
- Q-RAC-1 answered B (11:13Z): generate Tables 3.1-3.3, Fig A.1, glossary/acronyms + the 5 view-linked figures as SVG, as a draft PR in the litlfred fork.
- Integrated View figures (image19, image26) belong to thread "Generate smart-ra integrated view diagram".
- Content change: needs user OK per PR; fixes go in litlfred fork; generators go to cat-harness-tools (AGENTS.md). Related: folio-assistant-sych.
- PRs (2026-11-01 ~11:30Z, all draft): cat-harness-tools#1268 (Tool archimate-blocks), cat-harness#918 (Tool def + skill), smart-ra#207 (Tables 3.2/3.3 from archimate/relationship-rules.json, Figs 3.7.1/3.7.2 SVG; needs tools re-pin). Issue smart-ra#206. Q-RAC-4 C (Appendix C hand-written). Open: Q-RAC-5 (Figs 3.3-3.5 come from old separate model 0.2.0-draft.3), Q-RAC-6 (Fig A.1 view), Q-RAC-7 (Table 3.1 definition source), Q-RAC-8 (glossary editorial marks).
- Finding: 2 of Table 3.3's rules are not allowed by ArchiMate 3.2 (AppService serves Stakeholder; Capability serves Goal).
- Q-RAC-8 A (11:30Z): folio-assistant-core#490 (Tool glossary-table + skos editorialNote), smart-ra#208 (glossary/acronyms tables; new glossary/dpi-h-ra-acronyms.glossary.json, glossary/glossary-tables.json). smart-ra#207/#208 need tools/core re-pin after #1268/#490 merge.
- USER RULE 2026-11-01 15:39Z: no CONTENT work on smart-ra or any dth-* repo for now (other smart-* content OK). smart-ra#207/#208 and Q-RAC-5/6/7 PAUSED. Functional PRs tools#1268, core#490, cat-harness#918 green; my merge blocked twice by safety check, user must merge.
- 16:18Z: user said "merge all 3"; tools#1268, core#490, cat-harness#918 MERGED (a direct ask in-thread passed the safety check). Re-pin of #207/#208 waits for the content pause.
- Q-RAC-5 A (15:47Z): move Figs 3.3-3.5 views into 0.3.0-draft.1; HELD by the content pause.
- Q-RAC-6 A (15:48Z): fix Fig A.1 names and layout in the model; HELD by the content pause.
- Q-RAC-7 A (15:56Z): Table 3.1 definitions from the glossary wording; HELD by the content pause.
- Committee issue smart-ra#212 (15:59Z): the three Table 3.1 definition versions (Table 3.1, glossary, model Definition), side by side.
- 15:44Z: figure palette waits on Q-IV-4 (Integrated View thread will write a shared theme in cat-harness-tools: poster layout, ArchiMate layer colours). render-view.ts SVGs (Figs 3.7.1/3.7.2) should adopt it once answered.
- 22:37Z: user OK "207 and 208 can merge when complete and ready" (cmsg_017WNUkNK8kdDziPK58Pv6G9MuRNGoYUVonPqKm3RaHbLB). Main merged in (pins already include tools#1268/core#490); #207 SVGs redrawn (d201ed9); both marked ready, merge on green. #218 (other thread) overlaps Figs 3.7.1/3.7.2.
- 2026-11-08: Q-RAC-10 A (figures dropped from #207, now rules+tables only; figs left to #218). #207 red on check:kind-validators (unmapped archimate-relationship-rules/v1) -> fix cat-harness#1168 (issue #1167). Q-RAC-11 A (18:35Z): merge #1168 on green, re-pin cat-harness in #207, merge #207 on green.
- 18:55Z: #1168 merged (577b7b7). Pinning smart-ra to cat-harness main caused skew (282 commits past the 11-05 freeze set). #207 now pins cat-harness 0947909 = f5c9140 + cherry-pick of #1168 on branch pin/smart-ra-freeze-rules-family (keep that branch until the next freeze re-pin).
- 19:22Z 2026-11-08: smart-ra#207 MERGED (4159e0b), pins cat-harness 19871a5 (freeze f5c9140 + rules family + its kind schema, branch pin/smart-ra-freeze-rules-family; keep it until the next freeze re-pin).
