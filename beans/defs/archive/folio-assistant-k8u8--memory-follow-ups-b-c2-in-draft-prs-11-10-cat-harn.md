---
# folio-assistant-k8u8
$schema: bean/1.0.0
title: 'Memory: follow-ups B+C2 in draft PRs 11-10 (cat-harness#1197, core#710/#711/#712); orig DONE 11-10 — LSI page → "Indexing evidence" (cat-harness#1144) + keyw...'
status: completed
type: task
priority: low
created_at: 2026-11-08T09:18:11Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `lsi-page-rework-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: follow-ups B+C2 in draft PRs 11-10 (cat-harness#1197, core#710/#711/#712); orig DONE 11-10 — LSI page → "Indexing evidence" (cat-harness#1144) + keywords built at publish in 6 variants; PRs, decisions; thread cmsg_017WNUkNK8kdDziPK58Pv6G95xcPV1zXPt2N1Twnrpakp3


User (11-08): the LSI papers should be evidence for processes, skills and tools that add indexing (glossary extraction, keyword search). Any health report goes into the existing repo health report (option A, 08:23Z). The prior LSI beans (ansc, 9udd, fq5u, ec2a, cp3v, x80s) are all done.

Wave 1, branch claude/indexing-evidence-page (draft PRs): tools#1693 (evidence page from KG edges + `lsi-indexes` health check), cat-harness#1145 (titles), core#679 (`uses-methodology: lsi`).

Keyword decisions (11-08):
- QA watches keywords through the health report (A).
- Keywords are extracted content, so they must not live in the ingest record. They are built at publish into a derived JSON-LD graph, `folio-keywords/v2`, at `docs/assets/keywords/<instance>/<slug>.jsonld`.
- Expose them in a keyword viewer page (B).
- Compare six variants (B): LSI log-entropy and tf-idf, each on surface and on latent terms; a latent re-rank; and correspondence analysis (`ca-latent`).
- Removal PRs for the committed keywords.json files must be shown to the user before merge.

Wave 2: branch claude/keywords-at-publish, stacked on wave 1. Draft PRs:
- tools#1697: the graph, the 6 variants, and the `library-keywords` health check.
- cat-harness#1146: the builtAtPublish route.
- core#680: the skill text.

Keyword viewer pushed on the same branch: the `/cat-harness/lsi/keywords/` page. It has an A–Z index, the variants side by side, and agreement with headings, the authors' "Keywords:" lines and the glossaries. Ingestion records no PDF metadata keywords.

Removal draft PRs for the committed keywords.json files (stacked; they need the user's review before merge):
- cat-harness#1147 removes 65 files.
- core#681 removes 3.

who-iris#201 is a draft removing 24 files; the user chose A at 09:18Z. All three removals wait on user review and merge after tools#1697.

All nine PRs were merged by 2026-11-10: tools#1693/#1697, cat-harness#1145/#1146/#1147, core#679/#680/#681, who-iris#201. The thread is resolved.


Follow-ups (docs-site lsi:viz --detail; glossary term-extraction method; indexing skills for CA + subject-indexing): user said yes 11-10.
- The docs-site.yml patch (/mnt/project-files/indexing-followups/) is for the user to apply, because there is no permission to push workflow files.
- Correspondence-analysis skill backing is in draft PRs cat-harness#1190 and core#707.
- Q-IDX-1 = A (11-10): ingest an open term-extraction paper (e.g. C-value/NC-value), write a method node, attach to glossary skills.
- Q-IDX-2 = A (11-10): build a MeSH subject-indexing skill + authority-lookup Tool per skill-pipeline-subject-indexing.
- 11-10: user approved adding NLM (id/www/nlmpubs), arxiv, export.arxiv, aclanthology to the Default env allowlist.
- B delivered as drafts: cat-harness#1197 (ATE survey arxiv-2301.06767v1 + Frantzi&Ananiadou 1996 C-value, OCR'd; methodologies/automatic-term-extraction.md) and core#710 (glossary-terms, ontologist uses-methodology). No C-value implementation yet.
- C2 delivered as draft core#711: library/nlm-mesh-indexing-policy-2026 (9 NLM pages), skill mesh-subject-indexing, Tool mesh-authority (scripts/mesh-authority.ts, id.nlm.nih.gov). Heading-count/major-topic rules NOT held (MEDLINE training course archive-only).
- C-value Tool = core#712. ALL MERGED 11-11 (by 13:20Z): cat-harness#1197, core#710, #711, #712. Only open item: user applies docs-site.yml patch.
- Ingest gotcha: run ingest-document.ts with FOLIO_FIXTURE_CHECKOUT=/home/user/ws (else content-context prefix error) and --instance . for core; cat-harness promotes to library/corpus/<slug>, move into the group dir (kg/, library/).
