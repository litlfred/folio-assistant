---
# folio-assistant-9fo8
$schema: bean/1.0.0
title: 'Memory: Plan for referenced (non-materialized) ingestion of IRIS HIV/immunization/vaccine items into who-iris KG; counts, sizes, cards Q-IRIS-1..7, PRs #208/...'
status: completed
type: task
priority: low
created_at: 2026-11-10T17:42:54Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `iris-subject-ingestion-plan-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Plan for referenced (non-materialized) ingestion of IRIS HIV/immunization/vaccine items into who-iris KG; counts, sizes, cards Q-IRIS-1..7, PRs #208/#211

Thread "Plan WHO IRIS DSpace ingestion" (cmsg_017WNUkNK8kdDziPK58Pv6G9URtoXkkMHFsrXX8CVbmjs6), 2026-11-10. Planning only; ask before any PR. DSpace token still coming.

- Plan doc: https://claude.ai/artifact/KbuShxMsb8qDZBQ8MJQ7dA
- iris.who.int added to the Default cloud environment allowlist (user approved 17:37Z). Public DSpace REST works anonymously.
- Counts (2026-11-10): metadata match (dc.title/subject/subject.mesh/description.abstract : HIV OR immuni* OR vaccin*) = 17,248; full-text "HIV OR immunization OR vaccine" = 77,679; user's web search with lowercase "or" = 35,469 (lowercase or is NOT boolean in Solr); all IRIS 274,193.
- Materialize estimate (120-item samples): PDFs 23.6 GiB (meta) / 132 GiB (full text); L1 derived ~1.3x PDF bytes. Referenced KG < 10 MB gz (meta).
- Gaps in who-iris scripts/iris-cdn/run.ts: no --query scope, always fetches bytes, no auth header.
- Q-IRIS-1 = A (user 17:52Z 11-10): metadata match, 17,248 items.
- Q-IRIS-2 = A (user 17:53Z): per-item node + DC record files in who-iris main, as today (~34k files, ~150 MB); watch site size.
- Q-IRIS-3 = A (17:53Z): Stage 0 + anonymous pilot. User 17:54Z: pilot prioritises IRIS items cited by the HIV and immunization DAKs.
- 18:25Z who-iris#207 issue, draft PR #208 (branch claude/iris-subset-ingest, 27c1d37): mode `subset` in scripts/iris-cdn/run.ts (folded into run.ts so tools' content-holds-code list needs no change), subsets in scripts/iris-cdn/subsets/. Pilot 144 referenced nodes (44 DAK citations + 100 sampled seed 207); 12 DAK citations already held; 10665/255705 measles PP 2017 withdrawn upstream. Subscribed to PR.
- #208 merged (pilot); Recent Submissions capped at 10.
- Q-IRIS-5 = A: library entry page per referenced item (tools#1765 merged ee8872f: referencedCatalogueEntries; DC link = published .dc.xml; KG node link). Q-IRIS-6 = B: covers for all pilot items. Q-IRIS-7 = A: 10-08 dev authorization extended to non-CC covers. 138/144 covered, emblem masked (masks.json); excluded 10665-350543, 10665-42458.
- who-iris#211 (branch claude/iris-referenced-library-links, re-pinned tools ee8872f) carries links+covers; #210 merged. Merge card: owner chose B (19:30Z) = hand to Merge Manager; handed over 19:31Z; MERGED 19:34Z. Live site needs republish (owner OK). Card Q-IRIS-9 open: which items to hold+extract (rec C: 44 DAK + non-English test; user asked why no TOC/summary on referenced items).
- Before Stage 2: size review (library index.json +~25 MB, covers ~800 MB at 17k).
- USER PREF (18:02Z): progress update every ~3 minutes during active work.
- 22:30Z who-iris PR #217 (branch claude/iris-derived-kg, draft, subscribed): derived KGs for 186 PDFs (144 pilot + six-language + digital-health translation sets), PDFs not held; 26 new masked covers. Needs tools#1787 (OCR lang/RTL/wrong-script checks, --qa-later) merged + who-iris re-pin. Gotchas: IRIS may serve an HTML sign-in page as a PDF (scripts now refuse); Latin-1-mapped Arabic fonts need the wrong-script check.
- 02:13Z 11-11: tools#1787, #1832 and who-iris#217, #223 (re-pin to tools main bd544b16) all MERGED. Referenced PDFs: owner chose link-out only (IRIS 403s our Origin, X-Frame DENY). Figures+tables now kept by derive-referenced.py; re-extraction in thread cmsg_017WNUkNK8kdDziPK58Pv6G9MgLzYE4CC933YWuugjFYV2. Live site PUBLISHED 03:2xZ 11-11 (Q-PUB-1 = A) from main d9978060 via stage-local, gh-pages 71e7ab00; site 141.7 → 183.5 MB (advisory size warning; 76 MB in dirs named after other layers). litlfred.github.io is blocked by curl here; WebFetch works for checks.
- Local preview recipe: a "modified" mount -> move into repo as .tools-tmp, run `CAT_HARNESS_ROOT=$PWD/cat-harness bun run .tools-tmp/scripts/remote-mount.ts`, then stage-local; `git checkout -- .github/workflows`; tools tests need `bun install --no-save` (dev deps).
