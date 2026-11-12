---
# folio-assistant-0a8c
$schema: bean/1.0.0
title: 'Memory: who-iris only — official WHO translations of a document seed its glossary terms and .po translations (user rule 2026-11-10)'
status: completed
type: task
priority: low
created_at: 2026-11-10T19:45:33Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `who-iris-official-translations-rule.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: who-iris only — official WHO translations of a document seed its glossary terms and .po translations (user rule 2026-11-10)

RULE (user, 2026-11-10 19:45Z, thread "Plan WHO IRIS DSpace ingestion" cmsg_017WNUkNK8kdDziPK58Pv6G9URtoXkkMHFsrXX8CVbmjs6): for WHO-IRIS only (not other KGs), when a document has an official WHO translation into at least one other UN language, glossary terms are matched across the language versions, and the official translation becomes the term's translation (e.g. pre-populates .po files) and part of that source content area's translation.

**Why:** official WHO translations are authoritative; machine/agent translation should not replace them.

**How to apply:** IRIS links language versions by `who.relation.languageVersion` (en/ar/zh/ru PDFs usually on one item, fr/es as separate items). Ingest every language version (derive-referenced.py, slug `<stem>-<lang>`), then align terms. Acronym lists count too (user 19:46Z): align a document's acronym list across its official translations. Also analyse how extracted LSI keywords correspond across translations (user 19:46Z). The user asked for at least 5 digital health documents with official translations in the pilot, ideally 2 with all six UN languages. See folio-assistant-9fo8.

DECISIONS (user card 2026-11-10 20:55Z, "Accept all six", analysis doc https://claude.ai/artifact/T8nrEuEEnHb1KVoWiwGrVY): Q1 a (official terms bind only who-iris catalogues of the same content area; needs per-catalogue scoping), Q2 c (auto-authored only on stated equivalence or list row between anchors, else candidate), Q3 a (notation becomes per-language and extracted by glossary:pot), Q4 a (one scheme per publication, subject per content area), Q5 b (per-language keywords + concept bridge via glossary IRIs; keywords never in .po), Q6 a (conflicting official translations reported, a person picks).
