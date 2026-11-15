---
# folio-assistant-ap4q
$schema: bean/1.0.0
title: 'Memory: fhir-harness#325 steps 2+3, #329, #335 (2026-11-10): ALL MERGED by 19:20Z (#327 #328 #331 #338, tools#1763, fhir-ig-publisher#13, cat-harness#1195 sk...'
status: completed
type: task
priority: low
created_at: 2026-11-10T18:16:19Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `ig-ast-raw-url-325.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: fhir-harness#325 steps 2+3, #329, #335 (2026-11-10): ALL MERGED by 19:20Z (#327 #328 #331 #338, tools#1763, fhir-ig-publisher#13, cat-harness#1195 skill git-friendly-churn); smart-immunizations 118 -> 71.1 MB


Thread "Load IG resources by pinned raw URL" (cmsg_017WNUkNK8kdDziPK58Pv6G9KXDUbMzSFs2aJCwzYgVRYz). Step 1 = fhir-harness#326 (merged: seeds are children of the cache-branch tip, so pinned commits stay reachable). Size/publish owner: AST refresh thread …XqKVGpzpLAbWKjURUeqy2S.

- #327 (branch claude/ig-ast-raw-url, 6e0ecae, draft): `ig-cache.sh restore --record FILE`; `ig-repo-site` writes `<work>/ig-ast-source.json`, `astRawBase()` gives `https://raw.githubusercontent.com/<repo>/<sha>` to `gen-ig-pages --compiled-data`; publisher-pages copies no root `<Type>-<id>.json`. Fallback to copies: no record, non-github remote, `SITE_AST_BY_URL=0`.
- #328 (claude/ig-artifact-one-page, 4079c97, draft, base = #327's branch): one page `artifact/<Type>-<id>.html`, views via `?view=` (incl. jsonld/schema sidecars); old view filenames = meta-refresh stubs (`thinViewRedirect`); `isRedirectStub` skip in stampIgBar/stampTranslationMeta.
- 18:30Z: first preview build (4079c97) was 119 MB: AST already in checkout so no record (fixed 50ee767: record_present), stubs 8 KB from staging banner (fixed 739aa0c: no <body>, folio-navbar none). #329 history = draft fhir-harness#331 (3cc6d7e, base #328 branch; ig-ast-history.ts, fhir-artifact-index/ast-history.json, releases.json ast.commit). Injection QA gate #330 went to sibling thread …TPzTJG29wRXXEmUMuggBfQ.
- Estimate smart-immunizations 118 MB -> ~80 MB; measured preview build asked of the size thread.
- XSS answer: fetched JSON drawn with textContent; only narrative is HTML, sanitised by ast-resource.js.
- 18:45Z: siteWork fix b392c7d (compose used scratch dir: pages pointed at unserved root JSON). Heads #327 b392c7d, #328 84fe226, #331 0048cf9; #332 (sibling) rebased 22812afe. Form tools + platform-copy cuts belong to the size thread. Thin-page trim (user OK): cat-harness-tools#1763 (issue #1762, a1c475d, draft): staging banner client served once as staging-banner.js, 1.1 KB loader inline (was 7.5 KB/page). Prod thin page ~4.5 KB; 3 KB would need a merged head-chrome loader (not done).
- Local test setup: siblings in /home/user (cat-harness-tools, folio-assistant-core, cat-harness, bootstrap-tools) + node_modules/@litlfred symlinks; `bun test scripts` has 3 failures also on main.
- 19:10Z owner A: stable AST file names. fhir-ig-publisher#13 (branch claude/ast-stable-file-names, 2d249a5, base claude/ast-export; fork has no issues, tracked as fhir-harness#335): <id>.json, hash only on shared type/id (case-insensitive). Name hash was of canonical|version (712/756 paths changed per version bump). After merge: bump ast-export-ref default in fhir-harness ig-ast-refresh.yml (now a7a58da). Skill git-friendly-churn: cat-harness#1195 (issue #1194), SKILLS.md hand-edited.
