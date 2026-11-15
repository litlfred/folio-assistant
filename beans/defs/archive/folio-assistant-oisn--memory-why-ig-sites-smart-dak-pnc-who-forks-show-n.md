---
# folio-assistant-oisn
$schema: bean/1.0.0
title: 'Memory: Why IG sites (smart-dak-pnc + WHO forks) show "no qa.json" on qa.html, and the fhir-harness#355 fix'
status: completed
type: task
priority: low
created_at: 2026-11-10T20:54:09Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `ig-qa-json-carry-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Why IG sites (smart-dak-pnc + WHO forks) show "no qa.json" on qa.html, and the fhir-harness#355 fix

Thread "Restore qa.json on smart-dak-pnc" (cmsg_017WNUkNK8kdDziPK58Pv6G96zELz1Am66C2Vzg5yT1cQV), 2026-11-10.

- Site QA page (fhir-harness scripts/ig-qa-page.ts) reads qa.json from the AST cache branch `cat/fhir-harness/fhir-ast/<pkg>`, never the Publisher's output/.
- Cause: forks' first AST (19:18Z 11-10) was seeded with fhir-harness pin b0150c28 (11-02); ig-cache.sh seed only carries output/qa.json since 7468adf5 (11-06). After re-pin to 5bd8b1e2 the AST stayed valid so it was never rebuilt. Also ig-ast-refresh.yml's full export never copied qa.json into output-ast (only expansions.json).
- Fix: fhir-harness issue #354, draft PR #355 (branch claude/ast-carries-qa-json): copy qa.json after export; on default branch rebuild once a valid full AST lacking qa.json.
- Q-QA-1 = B: all 10 forks adopted the current fhir-harness site-publish template (ig-ast-refresh.yml@main + template-repos + Playwright step), PRs #4 (chud #5, fp #10). #355 + all 10 merged 22:45Z 11-10; publish 22:46Z; smart-dak-pnc qa.html shows Publisher summary (2 errors, 18 warnings, 1 hint); all 10 AST branches carry qa.json. See folio-assistant-lwdn.
- Q-QA-2 = A (load in browser): cat-harness-tools issue #1824, PR #1825 MERGED 23:50Z 11-10 (scripts/qa-live.ts; rows click open to checks+findings). After merge, forks need re-pin to show it on smart-dak-pnc.
- Was open: cat-harness QA viewer empty because IG site builds never fetch layers' `cat/cat-harness/qa-reports` branches (cat-harness-tools qa-site-assets/qa-store). Card asks: load in browser from raw.githubusercontent (rec) vs fetch at build vs separate thread.
- github.io is blocked by the sandbox proxy; read gh-pages via `gh api .../git/trees/gh-pages`.
- 11-11 user: "fhir qa.json needs to look like fhir ig output". Q-QA-3 card (A rec: carry Publisher qa.xml as qa-messages.json, draw Publisher qa.html layout in browser). fhir-harness issue #367, Q-QA-3 = A; PR #368 MERGED 06:36Z 11-11 (scripts/ig-qa-messages.ts; linked to artifact pages, sources, canonicals); forks need re-pin + publish (asked forks thread). Rebuilds a full AST once when it lacks qa-messages.json. Local tests need zod + @litlfred/{bootstrap,bootstrap-tools,cat-harness} clones in /home/user/node_modules.
