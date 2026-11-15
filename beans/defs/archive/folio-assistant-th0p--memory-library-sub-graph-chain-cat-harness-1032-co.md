---
# folio-assistant-th0p
$schema: bean/1.0.0
title: 'Memory: Library sub-graph chain cat-harness#1032 -> core#639 -> fa#3016 (bean f1nc): why layer PRs are red alone, current pins, card Q pending'
status: completed
type: task
priority: low
created_at: 2026-11-08T06:52:55Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `library-chain-f1nc-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Library sub-graph chain cat-harness#1032 -> core#639 -> fa#3016 (bean f1nc): why layer PRs are red alone, current pins, card Q pending


Thread cmsg_017WNUkNK8kdDziPK58Pv6G9PhL8ELHbGN65NRwqfWTLrU took over 2026-11-08 06:45Z (merge window to 19:00Z, [[merge-master-2026-11-08]]).

- Layer CI (layer-pr-checks.yml, layer mode) mounts folio-assistant MAIN's lock and swaps in only the PR's layer, so cat-harness#1032 and core#639 can never be green alone: #1032 alone -> check:tools 11 dangling satisfies (core skills/library lose the `library` topic); core#639 alone -> topic declared twice. Only fa#3016 (both heads pinned) proves the chain.
- 06:50Z: fa#3016 merged main in (158eae3), pins cat-harness 47e15e4 (#1032 after update-branch) + core 9569517; marked ready. check:tools passes locally.
- Card posted 06:52Z (cmsg_017WNUkNK8kdDziPK58Pv6G94tELGFkQYJJGbfbBprJtXf): owner tapped A at 06:52:54Z = merge on combined green. Plan: merge #1032 then core#639 with MERGE commits, re-pin fa#3016 to merge commits, merge.
- subscribe_pr_activity failed on all three (another session holds them); poll with gh api.
- Mounting fa locally: `bash .github/mount-from-lock.sh` (20s), `bun install --no-save`, then `bun run cat-harness-tools/scripts/remote-mount.ts --seed name=repo@sha --consent-by litlfred --evidence ... --whole --no-health` and `remote-mount.ts --no-health` to lock.
- 07:04Z merge manager (session_01Qmmkt6te9q7bF3KBT2Qq11, to 19:00Z) asked: do NOT merge yourself. When ready: send it the six-line merge request (PR URL + full head SHA, session URL, what changed, preview URL or "no preview: reason", what to look for, "full tier green as judged"), mark ready, label ready-to-merge, signed "ready: <sha>" comment. Stacks bottom-up; fa PRs without workflow changes go via merge-train label.
- 07:18Z merge manager: owner chose Q-CIB-1 B "Main green first". cat-harness main 42d4f15 and core main 35c9425 red on Publish JSON-LD context (fix tools#1677, via tools re-pin). #1032/core#639 wait for those mains green; still reach combined green and send requests.
- 07:23Z merge manager: HOLD new pushes/branch updates until train fa#3034 lands (~07:50Z) and it sends "release" (runners saturated). Let fa#3016's queued runs finish.
- 07:45Z fa#3016 full tier found 4 new reds, fixed locally (pushes held): core libraryDirOf ignores opt-in nested corpus -> commit in /home/user/core639 (check:voices + 3 library-ref tests pass); tools tests process-index VIEWED + library-source-links SEG -> branch claude/library-subgraph-test-paths in /home/user/cat-harness-tools (new tools PR needed). glossary:check stale ledger = cat-harness#1131 roles need newer smart-trust-phw pin; train fa#3034 should fix, then merge main into fa#3016.
- 07:43Z pushed core#639 e3f6931 (partial release). Tools PR still held; full release when queue <15. Merge fa main into fa#3016 after train fa#3034 (~07:50Z).
- 07:58Z tools PR #1689 (issue #1688) ready. fa#3016 d4384f0 = main (train 3034) + pins ch 47e15e4, core e3f6931, tools 9e9b891 (stacked). Locally voices/glossary/check-tools/library-ref pass. NOTE remote-mount rewrites .github/workflows tools refs: always `git checkout -- .github/workflows` before commit (no workflow changes in fa PRs). Use --fresh after local generator runs.
- 08:01Z merge manager HOLD again (queue 47): no new pushes until release.
- 08:22Z release (queue 6).
- 08:27Z tools#1689 merged.
- 08:55Z 2nd fa run reds fixed: ch#1032 fc3bf38 (crdm links, READMEs), core#639 5626a39 (sample-import path, bean 2i5f link), NEW tools#1695 (library-links seg; issue 1694), who-iris#195 (catalogue viewer; issue 194), smart-base#326 (link; branch based on fa's pin 5959459; issue 325). fa#3016 463f251 pins all + uploads/README fix. Open: ch#1032 uml:overview exit 2 (qa:refresh fails on head side) — untraced; kg-validate sidecars test timeout (maybe load).
- 09:06Z CodeQL reds on core 5626a39 + smart-base 730428e = CodeQL bundle download HTTP 504 (infra; main green; job re-run refused 403). Treat as infra in merge requests. Still running: fa 463f251, ch fc3bf38, tools 1ce395e (re-queued), who-iris 9e1fdf6 (re-queued), smart-base shards.
- 09:08Z who-iris#195 9e1fdf6 full green; labelled ready-to-merge, ready comment, merge request sent to merge manager thread.
- 09:07Z who-iris#195 MERGED.
- 09:07Z who-iris#195 merge commit 3169962 (re-pin fa#3016 to it at the end). MM: new re-pin train dispatched 09:04Z with JSON-LD fix; ch+core mains green ~10:00Z.
- 09:09Z tools#1695 1ce395e green; ready label+comment; request sent.
- 09:09Z tools#1695 MERGED, merge commit 8473fac9dd4315a286f0fd78e5b04a80eed31a23 (re-pin fa#3016 to it at end).
- 09:18Z smart-base#326 red only on check:subgraphs dangling link to cat-harness/library/... = needs ch#1032 merged first (layer mode). Commented; re-run after #1032 lands.
- 09:34Z fa#3016 463f251 reds: (1) subgraphs-checkout dangling = archived bean q7ey link to old cat-harness/skills/library path -> FIXED on state branch cat/cat-harness/beans commit 0441335 (unlinked, text kept; works both layouts). (2) kg-validate sidecars timeout 178s recurred (shard 1). (3) stage: pdf.js download 504 (infra). ch#1032 fc3bf38 reds: graph:check-tools (expected alone) + uml:overview exit 2 (still untraced; local run triggers full QA rebuild, >8min). 09:40Z MM HOLD (queue 43).
- 09:55Z TRACED: uml:overview PASSES in fa#3016 combined gates (job 128685008613: 'UML overview is current'); #1032-alone red = layer-mode artifact (QA copy build fails w/o combined pins), like check:tools. fa#3016 gates red only = q7ey dangling (fixed 0441335). Need re-run of fa#3016 failed jobs after MM release; watch kg-validate timeout (shard 1).
- 10:05Z fa#3016 7eaf80d = main (train 3037) + pins ch fc3bf38, core 5626a39, sb 730428e, tools 8473fac (merged), who-iris 3169962 (merged). MM OK'd push (queue 18). Next: on green send #1032 + core#639 requests.
- 11:50Z external-schemas:check red on fa 7eaf80d (6 bpmn terms unused: scanner read literal processes/). NEW tools#1709 (issue 1708, branch claude/external-schemas-workflow-files, 210993b) uses workflowFiles; record +parallelGateway +sourceRef pushed to ch#1032 7bbf2d6. fa#3016 7701dce pins both. kg-validate sidecar test 180s on CI vs 43s other PRs, 41s locally: hypothesis = stacked pins lack published QA in layer stores; clears after re-pin to merge commits. Merge order now: ch#1032 + tools#1709 together (tools#1709 alone makes ch main record stale).
- 11:32Z tools#1709 210993b layer CI green. Hold its merge request to pair with ch#1032 once fa#3016 7701dce is green.
- 12:20Z fa 7701dce reds: processes-viz page stale (tools main #1679 task-panel pulled in via 1709 base) -> rebased tools#1709 onto 8473fac = 8872bef; fa#3016 re-pinned (push). who-iris translation-roundtrip 'ar: 120 strings, 162 rulings' red on CI but passes locally (maybe also #1679). kg-validate 178s again.
- 12:10Z MM: send pair (#1032+tools#1709) and core#639 requests when each green on own full tier; MM merges 1709+1032 same batch, core next batch; judges fa#3016 only after re-pin to merge commits (kg-validate timeout NOT waived). core#639 was still DRAFT -> marked ready 12:10Z. Told MM #1032 alone-reds = check-tools + uml:overview layer artifacts.
- 12:06Z MM final plan: ONE request with all three shas (tools#1709 8872bef, ch#1032 7bbf2d6, core#639 5626a39), merged one batch in that order, once tools#1709 + core#639 full tiers green. List #1032's expected reds by name (graph:check-tools, derive:publish uml:overview), no new test failures; any other red = stop.
- 12:27Z tools#1709 8872bef full tier green. Waiting core#639 full tier (started ~12:10Z).
- 12:50Z SENT combined request (tools#1709 8872bef, ch#1032 7bbf2d6, core#639 5626a39), all labelled ready-to-merge + ready comments. core#639 alone reds: library-ref realInstancesResolveOwn, concern-groups x2, check:subgraphs 4 links (all need #1032); plus lock-consistency (new tools#1571 gate) + bootstrap-tools schemas:check stale (not ours). Next: after merges, re-pin fa#3016 to merge commits (ch, core, tools; who-iris 3169962 already) and hand to MM.
- 12:55Z MERGED: tools#1709 3666855, ch#1032 a13adf2, core#639 9d2bc54 (12:50Z). fa#3016 36959fa = main + merge-commit pins (smart-base#326 730428e still stacked). Told MM; sb#326 lands after fa#3016 then re-pin. Watching core main 9d2bc54 for lock-consistency/schemas:check.
- 13:35Z fa#3016 MERGED c00df6b (13:25Z); smart-base#326 MERGED 0653082. Opened fa#3045 (issue 3044, branch claude/repin-smart-base-326-merge, f8c5d4c) re-pinning smart-base to 0653082; subscribed. kg-validate timeout GONE at merge-commit pins. Reported to MM main reds not ours: log-message.checklist stale (bpmn:checklist), translate-kg-viewer/pot, edit-links asset, who-iris roundtrip, e2e figure-export. Chain done after #3045.
- 13:30Z fa#3045 MERGED. MM asks: after fa re-pin trains (dispatched 13:28Z, 13:31Z) land, fix still-red main reds 1-4 (log-message checklist regen in cat-harness — may clear with bootstrap re-pin; translate pot, edit-links asset, who-iris catalogue regen at source of tools#1679), one PR per repo, send ready shas to MM. Item 5 (e2e figure-export): note on issue unless reproduces. MM says owner Q-CIB-4 A: CI no longer gates non-release merges; main must be clean for release gate.
- 14:35Z main reds after train fa#3046: (1) checklist cleared, edit-links + who-iris cleared. NEW PRs: cat-harness#1161 (issue 1160, 407a397) obsolete concepts/skills.po; tools#1724 (11440bc) declared-path-literal marker on c-base fixture. Not fixed: processes-viz currency (QA copy built from older tools?), kg-validate timeout recurs with all-main pins (stacked-pin hypothesis WRONG), e2e figure-export. Requests sent to MM.
- 15:02Z cat-harness#1161 + tools#1724 full tier green, labelled ready, told MM.
- 15:27Z cat-harness#1161 + tools#1724 MERGED. Chain DONE; thread resolved. Open (owned by MM/others): processes-viz currency test, kg-validate timeout (load/shard-dependent), e2e figure-export.
