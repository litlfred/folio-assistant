---
# folio-assistant-ia3p
$schema: bean/1.0.0
title: 'Memory: who-iris IRIS-style search page (issue #196, draft PR #197); translation round-trip attestations must land in step with new site strings'
status: completed
type: task
priority: low
created_at: 2026-11-08T09:04:45Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `who-iris-search-page-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: who-iris IRIS-style search page (issue #196, draft PR #197); translation round-trip attestations must land in step with new site strings

Thread "Build IRIS-style search page for who-iris" (cmsg_017WNUkNK8kdDziPK58Pv6G9JTtCVtBJCEk3YBwTKzJvQx), 2026-11-08.

- who-iris#196 / draft PR #197, branch claude/iris-search-page. site/search.html in 6 locales, client in scripts/iris-search-client.js. Owner: facet CATEGORIES fixed, VALUES + counts dynamic (computed from current results).
- Home page form now submits to search.html; its hard-coded facet chips/"Complex Search" selects removed.
- GOTCHA: any new SITE_STRINGS entry needs (1) translations in all 5 .po (iris:pages:check), and (2) untainted round-trip rulings on state branch `cat/who-iris/attestations` (test/attestations/translation-qa/site/*.json). scripts/tests/translation-roundtrip-report.test.ts requires rulings == catalogue exactly, so attestations and the PR must land together.
- Rulings for the 42 new strings (indices 116-157, 0 fail) are prepared at /mnt/project-files/iris-search-2026-11-08/attestations/. Card asked owner: A (tolerant test via separate PR first) / B (Merge Manager pushes attestations + merges in one step) / C hold.
- Local run: mount with cat-harness-tools scripts/mount-from-lock.ts --root . (see .github/workflows/checks.yml), then bun install --frozen-lockfile.
- Local preview: user dislikes `python3 -m http.server`; use the harness's `bun run cat-harness-tools/scripts/serve-local.ts --site who-iris=.` → http://127.0.0.1:4007/who-iris/site/search.html
- Owner picked A on both cards (09:11Z): DOM-built client (pushed c453dcc), and PR #198 (rulings may run ahead). Order: #198 merge → push local branch attestations-search-196 (worktree /home/user/wi-att, commit on 55b9b98) to cat/who-iris/attestations → #197.
- 09:16Z owner A (split): this thread did who-iris#199 (oxigraph tests → tmpdir) and cat-harness-tools#1698 (serve-local prints site/ docs/ URLs); Run-locally thread got mount/install/attestations-fetch for who-iris. Handoff to Merge Manager when green: #198 first.
- 09:22Z user "6ok": approved mark-ready + merge of who-iris#198, #197, #199, tools#1698 in order. #198 marked ready + labelled (1202950). CodeQL 61/68 hardened in e9d8177.
- 09:40Z SWARM HOLD (queue 43): no pushes until Merge Manager release. #199 + tools#1698 handed off (ready+labelled). Still waiting: #198 merge -> push rulings -> #197.
- 10:33Z tools#1698 red on reference-direction (comment named who-iris). Fix c965dd5 committed locally in /home/user/cat-harness-tools, NOT pushed (swarm hold); ready label removed. Push + relabel on release.
- 10:48Z #198 MERGED; rulings pushed to cat/who-iris/attestations (98a097b). #197 merge-of-main d101aad local only (87/87 pass); push on swarm release, then relabel + hand off.
- 13:45Z Merge Manager took over pushes: #197 head 90909b7 (main merged, marked ready), tools#1698 head 0e59ebb (layer-name fix). My local d101aad/c965dd5 are superseded — do NOT push them. CI running on both.
- 14:30Z #197 reds on 90909b7: root:lint (fixed d104a81) + content-holds-code test (tools pins who-iris's tolerated code files; new iris-search-client.js not listed). Card: A list+re-pin / B fold into gen-iris-pages.ts (rec, done locally as next commit, 87/87) / C hold. Not pushed until user picks.
- 14:35Z user picked B. Merge Manager had already pushed B as e11c5e3 (client inlined as string array in gen-iris-pages.ts); adopted it, my local 6ca2961 kept only as branch backup-b-local. CI queued on e11c5e3; hand off when green.
- 15:03Z #197 green at e11c5e3; labelled + ready comment; handed to Merge Manager. Last PR in thread.
- 15:03Z #197 MERGED. All 4 PRs done.
