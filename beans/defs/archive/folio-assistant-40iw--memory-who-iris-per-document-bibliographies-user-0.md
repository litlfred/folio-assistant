---
# folio-assistant-40iw
$schema: bean/1.0.0
title: 'Memory: who-iris per-document bibliographies (user 02:21Z 11-11): references:extract tool core#733, who-iris#227 content, ingest step Task_References'
status: completed
type: task
priority: low
created_at: 2026-11-11T02:38:59Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `iris-doc-bibliographies-2026-11-11.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: who-iris per-document bibliographies (user 02:21Z 11-11): references:extract tool core#733, who-iris#227 content, ingest step Task_References

User 2026-11-11 02:21Z (thread "Extract references into per-document bibliographies", cmsg_017WNUkNK8kdDziPK58Pv6G9DmftYbH835oQ24UZgEm79b): "i want all who-iris docs that have references put into their own biblio". User rule 02:25Z: all KG extractions must happen as part of skills and processes.

- core draft PR #733 (issue #731, branch claude/iris-doc-bibliographies): Tool `references-extract` (scripts/references-extract.ts, `bun run cat references:extract --instance . [--entry] [--check]`), step Task_References in processes/library/ingest-build-l1-kg.bpmn (re-laid out to 1340 wide), section in skill l1-document-ingestion, bibliography-page per-document view for catalogue-held copies at bibliography/library/<doc-id>/.
- who-iris draft PR #227 (issue #226): declared dir `who-iris-references` (references/), 7,219 nodes from 82/210 entries, key `<doc-id>.<section>.<n>`, provenance extracted, `printed` verbatim, no title/author parsing. ~90% clean on sample; noise in 10665-381036/97885 evidence annexes; 10665-379160 Arabic garbled until source-fixes re-derive.
- Q-BIB-1 = A (user 02:39Z): merge who-iris#227 once green and after core#733 merges; re-run extract after source fixes.
- DONE 06:36Z: core#733 merged (166c60d), who-iris#227 merged (core re-pinned to 166c60d). Re-run of extract after source fixes handed to the source-fixes thread.
- Order: merge core#733 -> re-pin core in who-iris -> pages show. Re-run extract after source-fixes thread (cmsg_…93WQmGmifCFfexR63a3h4wh) re-derives sections. No L1 schema change here (footnotes/errata are that thread's).
- Gotcha: dev in /home/user/w/core then copy into who-iris/folio-assistant-core mount; render-bpmn needs bpmn-js (npm i in a scratch dir + symlink).
See folio-assistant-e3w5, folio-assistant-q5sw.
- 08:45Z scale analysis: live who-iris gh-pages bib = 3,600 files/57 MB, search-data.json 7.4 MB (bib not search_exclude); with #227 the route is 8,576 files/134 MB, whole page index.md 24 MB. Cards Q-BIBSCALE-1 (A oxigraph partitions + sharded static text index on CDN, rec; B oxigraph only; C Pagefind; D Cloudflare SPARQL) and Q-BIBSCALE-2 (A summaries + panel for extracted refs + drop lunr, rec; B lunr only; C nothing).
