---
# folio-assistant-8gr3
$schema: bean/1.0.0
title: 'Memory: GOAL 1 repo separation state for MVP (beans vuip/iirv/6fez/pga6) and owner answer Q-SEP-1 A'
status: completed
type: task
priority: low
created_at: 2026-11-01T20:54:30Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `goal1-separation-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: GOAL 1 repo separation state for MVP (beans vuip/iirv/6fez/pga6) and owner answer Q-SEP-1 A

Thread "Separate the repos for MVP" (cmsg_017WNUkNK8kdDziPK58Pv6G95MRKmH912DivLWvDb96qQk) owns it, under fa#2894 Phase 2c.

State: the split was done 2026-10-08. cat-harness and cat-harness-tools are their own repos, remote-mounted by pin. Fresh-clone QA (w1gy) passed 2026-10-31. Beans live on the fa branch `cat/cat-harness/beans` under beans/defs/.

Q-SEP-1 answered A (owner tap, 2026-11-01 20:54Z): in the MVP, finish 6fez (regroup the flat cat-harness/library/, 85 entries, into library/<group>/<slug>/; the owner approves the groups first), then close iirv and the old SPLIT epic vke6 (#223 is closed). pga6 (Phase III proposal + architecture write-up) and vuip (the umbrella) wait until after the freeze.

Rules for 6fez: references move with the entry; regenerate generated trees; never rewrite beans/**; relocate kg-qa sidecars and never delete them. See folio-assistant-2mfw.

Q-SEP-3 A (owner tap 21:15Z): the corrected groups draft (/mnt/project-files/goal1-separation-2026-11-01/library-groups-draft.json): process 32, conduct 18, content 14, kg 8, sdlc 6, library 5, tools 1, ui 1. PRs (2026-11-01): cat-harness#934 (the move, one PR), cat-harness-tools#1334 (re-ingest/withheld/QA sidecar), folio-assistant-core#563 (core readers; must merge before fa re-pins cat-harness past #934). sci and who-iris read only their own flat library, so they need no change.
Merge order (MVP thread 21:17Z): core#563 to core main FIRST, then cat-harness#934; scheduled re-pin trains take cat-harness main automatically (fa#2873). tools#1334 any time.
Merge window ends 2026-11-02 14:40Z (coordinator correction 23:37Z). Merging needs the owner's OK in this thread: the session's safety check blocked a merge at 23:37Z. Q-SEP-4 asks for it.
Q-SEP-4 A (owner tap 23:43:48Z): merge tools#1334, core#563, cat-harness#934 on green in that order. tools#1334 merged 23:44Z (be9e43d).
core#563 merged 00:43Z (fab49a6).
2026-11-02 06:58Z: #934 rebuilt on main as 13fe03b (main dropped 11 BPMN/DMN papers in 9c70dcb), 74 entries, process 21. Told drain thread (cmsg_…93tgDz3qufiWhn4SHZH4bHs) not to take over.
07:01Z coordinator: HOLD pushes to cat-harness, cat-harness-tools, fhir-harness until meta-merge thread (cmsg_017WNUkNK8kdDziPK58Pv6G9KFRqmaNst8GCREzncWoicQ) posts 'meta-merge done'; #934 (head 13fe03b) is in that merge.
2026-11-02 07:03Z cat-harness#934 merged (meta-merge). 07:12Z beans 6fez + iirv completed, pga6 reparented to vuip (beans 7dafadb). vke6 was already completed (archive). DONE except pga6/vuip post-freeze.
2026-11-02 ~09:30Z cutover paths (coordinator 09:01Z): fa#2909 (draft, branch claude/sep-cutover-workflow-paths) repoints lake-cache to folio-assistant-sci/scripts/lake-cache.sh + .codex prose; findings 34->30. Pushing .github/workflows edits WORKED from this session. Remaining 30 are qou-shaped workflows (snappea_wasm, hecke-engine-wasm, witness-refresh, publish.yml witness steps + submodule mount fallback). qou build.yml calls fa publish.yml at pinned sha b61e856, so main changes don't affect qou until its pin bumps. Precedent bean 52dz: dead workflows go to fsh-guts state branch, never rm. Card Q-SEP-5 asks: A archive all four (rec), B archive 3 + fix publish.yml paths, C exempt.
Q-SEP-5 A (owner tap 10:05Z): archive all four. fa#2910 (archive to cat/cat-harness/fsh-guts under fsh-guts/retired/workflows/) + fa#2909 removes them; cutover monorepo-paths 0. Both marked for merge on green.
Q-SEP-6 A (owner tap 10:13Z): merge #2910 + #2909 on green. #2910 merged 10:13Z (785eeda). #2909 full CI running on 5ce42bd.
10:50Z: #2910 note lacked folio-fsh-guts/v1 front matter -> fsh-guts-not-rendered shard 1 red on all fa PRs (reported by another thread). Fix fa#2912 (base cat/cat-harness/fsh-guts); merge refused by safety check, card Q-SEP-7. LESSON: fsh-guts/**/*.md nodes need $schema: folio-fsh-guts/v1 + movedFrom/issue/bean front matter.
10:58Z: #2909 shard 4 red = workflow-injection 'real corpus HAS script: blocks' (publish.yml held the only script finding). Fix tools#1403 (plants finding in a real script block); card Q-SEP-8. Then fa tools pin must pass #1403 (re-pin train) before #2909 merges.
11:10Z: #2909 docs gate red = agent-memory:check (hand edit of generated .codex toml). Reverted in fa (0295e0e); source fix cat-harness#974 (memory/ two lessons + vendor files). Cutover check on fa will show 2 .codex findings until fa re-pins cat-harness past #974.
11:20Z CORRECTION: removing publish.yml broke 8 tools tests (STEP_EXEMPTIONS, 'publish.yml is callable by folios', injection guard). Restored publish.yml in #2909 (archive only 3); #2912 also drops the publish.yml archive copy; tools#1403 closed; Q-SEP-8 withdrawn. publish.yml's 13 old-layout paths + 2 .codex (until cat-harness#974) remain for cutover check.
11:20Z cat-harness#974 closed: memory edits make index-root agent-memory:check stale (needs fa regen in the same re-pin). Fold the 2 .codex prose mentions into the publish.yml post-MVP follow-up.
11:31Z #2912 merged by litlfred himself (Q-SEP-7 card withdrawn). #2909 head 0c44295: shards 2-4 green, shard 1 red only from fsh-guts (now fixed) -> full re-run once gates finish.
11:40Z #2909 gates red: check:workflow-paths stale FOLIO_PATHS/FOLIO_WORKDIRS (6 entries in tools) after removing 3 workflows. Restored them; #2909 = lake-cache only. Card Q-SEP-9 (A shrink + retire post-MVP as one cross-layer change; B tools PR + re-pin now). fsh-guts note correction staged in scratchpad worktree branch claude/sep-cutover-fsh-guts-pending (not pushed).
12:12Z #2909 MERGED (1416e74), lake-cache only. fsh-guts note 'pending' PR opened. Q-SEP-9 still open.
12:44Z #2916 merged (note says 3 workflows pending). Q-SEP-9 withdrawn after merge. POST-MVP FOLLOW-UP: one cross-layer change: drop cat-harness-tools FOLIO_PATHS/FOLIO_WORKDIRS + STEP_EXEMPTIONS + infra-repo-root publish.yml tests + workflow-injection guard (tools#1403 branch), reword cat-harness memory (cat-harness#974 branch) and regen fa vendor files, then remove snappea_wasm/hecke-engine-wasm/witness-refresh and fix publish.yml paths in fa in the same re-pin.
