---
# folio-assistant-j0c5
$schema: bean/1.0.0
title: 'Memory: User rule 2026-11-02 - an authored ArchiMate model must never be the source of SKOS glossary content; only an ingested model may be'
status: completed
type: task
priority: low
created_at: 2026-11-02T15:22:32Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `archimate-not-skos-source.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: User rule 2026-11-02 - an authored ArchiMate model must never be the source of SKOS glossary content; only an ingested model may be

User 2026-11-02 15:22Z: "i dont want ArchiMate to be source of SKOS (unless it was ingested)".

**Why:** the glossary (SKOS) is where meaning lives; an authored ArchiMate model depicts concepts, it does not define them. An ArchiMate model ingested from a source document (L1 library) may be read like any other source.
**How to apply:** never write terms, labels, definitions, `focus` or relationships into a glossary from an authored model. The core Tool `archimate-from-glossary --seed` (folio-assistant-core scripts/archimate-from-glossary.ts) goes model -> glossary and conflicts with this; the read-only "depicted by" links (scripts/glossary-archimate.ts) are fine. Glossary -> model direction stays allowed.
State found 2026-11-02: smart-ra 0.3.0-draft.1 has 11 skosConcept tags, all pointing into dth-pc's glossary; no smart-ra term has an ArchiMate focus. Thread "Explain ArchiMate's role among artefacts". Related: folio-assistant-sych, folio-assistant-934v.
Q-ASKOS-1 = B (user tap 15:23Z): --seed only from an ingested model under library/ (--from). Freeze lifted 17:54Z. Issue core#613; draft PRs core#614 (branch claude/seed-ingested-only, tests 6/6) and cat-harness#980 (skill text, claude/archimate-not-skos-source); both watched. smart-ra#224's seed plan must change (noted in #613).
18:03:15Z user in-thread: "finsih that and merge" (cmsg_017WNUkNK8kdDziPK58Pv6G971gzKnUMav2svdGdpwYaSQ): both marked ready 18:04Z, merge each on full-checks green. Auto-merge not allowed on these repos.
18:44Z MERGED: core#614 and cat-harness#980; #613 closed.
