---
# folio-assistant-rcqp
$schema: bean/1.0.0
title: 'Memory: 2026-11-01 survey of glossary/KG linkage (dpi-h-ra example); join keys agreed; Q-GLO answered (1C, 2A, 3C)'
status: completed
type: task
priority: low
created_at: 2026-11-01T16:49:11Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `glossary-kg-linkage-survey.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 2026-11-01 survey of glossary/KG linkage (dpi-h-ra example); join keys agreed; Q-GLO answered (1C, 2A, 3C)


Thread "Link glossary terms to the knowledge graph" (cmsg_017WNUkNK8kdDziPK58Pv6G9N3K9W9aycrcqDwadN5Jy7H). Survey doc: https://claude.ai/artifact/EqNT8cfGkw2BfEHNsrGjM1

Finding: core already has the SKOS schema (notation, broader, related, focus), glossary page, glossary-term-links (opt-in `--link-terms`, smart-ra does NOT pass it), glossary-archimate (element `skosConcept`), glossary-table (generate tables from SKOS), acronyms QA. dpi-h-ra: 33 candidate terms, no notation, no relations, no defining sites, chapters are hand tables.

Join keys (agreed with Integrated view thread; user tapped Q-IV-8 A 16:49Z: short def in glossary, long text in narrative section marked `defines`, model = structure only): SKOS term id/IRI everywhere; element -> `skosConcept`; narrative defining block -> `defines: [id]` / `:defterm`. One shared "in the document" passage matcher in core for element pages and term pages.

Answers 16:57-16:59Z: Q-GLO-1 C (switch on + term page + shared ingest step + warn-only QA); Q-GLO-2 A (term page at its IRI); Q-GLO-3 C (defining site = glossary chapter row, 'gives consistent node kind structure'), BUT the term must link to the narrative passages as PROVENANCE. Adding notation/relations to smart-ra glossary is content (paused). Do not merge without asking.

Related: folio-assistant-z0a0 folio-assistant-8yzr folio-assistant-92m6.

PRs (all draft, watched, 2026-11-01 ~17:40Z): smart-ra#216 (--link-terms); core#499 term pages + scripts/term-passages.ts (shared passage matcher; Integrated view thread uses passagesFor for element pages); core#501 Tool glossary-from-source (shared ingest); core#502 (stacked on #499) glossary-terms skill workflow section, Task_Glossary in ingest-build-l1-kg.bpmn, warn-only glossary:links report. Tracking issue core#498. Follow-up not done: hash IRI (...ns#glossary/s/t) fragment forward to term page in cat-harness-tools ns page. Baseline: 8 glossary test failures on main in a partial checkout (need siblings), not ours.
Told Integrated view thread (smart-ra#215): keep defines/:defterm on Appendix C blocks; keep term source on glossary row; block as source only when no glossary row.
Q-GLO-4 A (user tap 17:21Z, cmsg_017WNUkNK8kdDziPK58Pv6G9NHipdQFCMmxavsorF7jixL): merge smart-ra#216, core#499/#501/#502 when green, then re-pin smart-ra.
MERGED 2026-11-01: smart-ra#216 06ce811, core#499 75910ea, #502 c872492, #501 d437b3e. smart-ra re-pin rides smart-ra#223 (thread cmsg_017WNUkNK8kdDziPK58Pv6G9AiBgGtk6KpnZqLDwrW6TDi; asked to bump core to d437b3e). Then check term pages live. Hash IRI forward still open.
LIVE 2026-11-01 23:08Z via smart-ra#223: term pages at en/folio-assistant-core/glossary/instance/dpi-h-ra/<scheme>/<term>/; term links are in index.hydrated.html (index.html is a shell). smart-ra#225 re-pins core d437b3e (merge on green, Q-GLO-4 A).
smart-ra#225 MERGED da2d90c 2026-11-02 00:16Z. Q-GLO-5 = A (user tap 2026-11-02 06:15Z): add hash IRI redirect, card cmsg_017WNUkNK8kdDziPK58Pv6G9GnQ49mAxd8Fp7Bi3Lb3JKu.
