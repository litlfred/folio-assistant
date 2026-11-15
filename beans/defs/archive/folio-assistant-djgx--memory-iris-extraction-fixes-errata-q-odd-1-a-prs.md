---
# folio-assistant-djgx
$schema: bean/1.0.0
title: 'Memory: IRIS extraction fixes + errata (Q-ODD-1 = A): PRs, sequencing, and the authored sidecars a re-derive keeps'
status: completed
type: task
priority: low
created_at: 2026-11-11T02:57:44Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `iris-extraction-fixes-2026-11-11.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: IRIS extraction fixes + errata (Q-ODD-1 = A): PRs, sequencing, and the authored sidecars a re-derive keeps


Thread "Fix IRIS extraction and add errata" (Q-ODD-1 = A, 2026-11-11).

- tools#1848 (branch claude/iris-extraction-quality): page text check + per-page OCR, second-script OCR, bookmark outlines set aside, oversized sections split, footnotes.json arm, errata/footnotes in L1 schema, inferred-title tidy (headings_tidied), print-order page re-read, source.languages. Base still claude/ocr-language-aware (merged #1787); retargeting to main was blocked by the permission check, so the user was asked to do it.
- core#732: ingest BPMNs + l1-document-ingestion skill sections for all of this.
- who-iris#230 (draft): 17 errata in 10 entries (errata.json, drafts, model not-disclosed + session). derive-referenced.py now KEEPS summaries.json, errata.json, tabular.csvw.json, tables/ across a re-derive, prunes summaries of renamed blocks, remaps errata blocks by page + quote. Decision card Q on how #230 lands (A merge after #1848+repin recommended).
- 11-11 09:48-11:43Z MERGED: tools#1872 (OCR per-page timeout, OMP_THREAD_LIMIT=1, doc-id = last stdout line), core#732, tools#1878 (pdf-images: DeviceN/Separation images + off-size soft masks were written as EMPTY png; now RGB + scaled mask).
- who-iris#239 (issue #238, branch claude/iris-rederive): 46 entries re-derived, image ids stable, 9 summaries.json fully pruned (sent to summaries thread). Re-pinned all layers to mains (owner rule via merge manager 11:43Z: re-pin = every harness to current main). Sent to merge manager for a card (content).
- Round 2 (12:10Z, faults from summaries round4 oddities.md): tools#1890 (issue #1889) running-head split for oversized sections, caption entries dropped from inferred TOC, Latin rescue in Arabic-script OCR, split-Arabic page check; schema enum 'running heads'. who-iris branch claude/iris-extraction-round2 (on top of #239): 3 errata (331525-rus p96 rifamycin 'inhibitors', p54 footnote e = d; 75211 p158 'Section 9.2'), derive-referenced --slugs, re-derive of 75211, 94830-per, 192500, 353150, 353151, 329296. 94830-per 'Annex 2/4' was OUR OCR (PDF prints ۳), not WHO. 43699, 344249-chi have caption titles too but no fetched PDF.
- Round 3 (13-15Z, summaries round5 oddities): tools#1909 (issue #1908) OCR acronym read-alone, text-layer digits (192500), near-tie script rule (letterhead was Cyrillic); tools#1914 (issue #1913) print-order re-read for inferred TOC + column band gap + banner collision fix, checked main-vs-branch on every fetched entry. Owner tapped A on both. who-iris branch claude/iris-extraction-round3 (on round2/#243): errata 75211 e2 (p216 Annex C -> B), 353150 e1 + 353151 e1 (caption three, matrix four). 75211 back-cover joins = PDF's own layout, left. 11-12 ~01Z: both merged; who-iris#251 (issue #250, stacked on #243) re-pins all to mains + re-derives those 10 entries; sent to merge manager + summaries thread. 192500 p1 letterhead still Cyrillic at ingest 200 dpi -> tools#1924 (issue #1923, script-word confidence >= 60); re-derive 192500 again after it merges.
- 11-11 ~13:50Z+: GitHub runners cannot resolve archive/security.ubuntu.com (Playwright font install) -> all PR CI red before tests. Not code; cleared by ~16:50Z.
- Gotchas: `git fetch origin main` here does not move origin/main (use FETCH_HEAD + update-ref). mount:remote refuses dirty mounts: move them aside, re-run, then `git checkout -- .github/workflows`. 10665-379160 derives page-by-page, so references:extract finds none.
- Sensitive items not touched: 381036 do-not-distribute notice; participant contacts in 350543, 67839, 374940.

Related: [[iris-summaries]]

Round 4 (11-12): tools#1926 (issue #1925), stacked on #1924. Mixed Eastern digits, lone-digit guard, GRADE ⊕/⊖ marks (ring-shape check; only 94830 hits in corpus). Next: after merge, re-pin who-iris stacked on #251, re-derive 192500, 94830, 94830-per. Still open: 94830-per p65 PRISMA numbers, p40 URLs, p46/56 flowcharts.

who-iris red fix (11-12 ~09Z, merge manager ask): main merged into #239/#243 (main's pins kept). Root causes: tools library kind lacked footnotes/errata/run-context/csvw families (tools#1943); gate keys kept commit ids so any re-pin made lock-consistency "new" (tools#1945); #243 needs tools main for 75211 "running heads". After both merge: re-pin #239/#243 to all mains, then #251.
