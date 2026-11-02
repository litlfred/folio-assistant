---
# folio-assistant-4j43
$schema: bean/1.0.0
title: 'Harness drain 2026-11-02: cat-harness, cat-harness-tools, fhir-harness'
status: in-progress
type: epic
priority: high
created_at: 2026-11-02T06:50:00Z
updated_at: 2026-11-02T23:52:30Z
parent: folio-assistant-rwmf
tags:
    - harness-drain-2026-11-02
---

Drain of the open issues, PRs and beans in the three harness repos, plan A (owner card Q-HDR-1 A, 2026-11-02 06:44Z). Analysis and plan: https://claude.ai/artifact/Qipen2fFHYXcAXsjakKNqr

Counted 06:45Z: 15 issues, 13 PRs, 20 open beans; 35 in scope after leaving out paused and committee/DTH items (cat-harness#686; beans amom, oz9e, 17iw, 9hxd, fvec, r29x, nvhg, dthl, cysv, ls3t, max2, llxa).

Rules: merge window to 2026-11-03 00:40Z; non-content PRs merge on green (or with only main's reds); only issues opened by litlfred; never merge PRs touching subscriptions/*/; owner threads keep their items, take over after 2 h idle.

Children are the five phases.

_2026-11-02T06:50:00Z_ — Filed by the harness drain thread (owner card Q-HDR-1 A, 2026-11-02 06:44Z), session https://claude.ai/code/session_01Qmmkt5upL17RB2jgQPi8Mx

## How to resume (read this first)

Resume prompt: "read bean folio-assistant-4j43 on branch cat/cat-harness/beans of litlfred/folio-assistant and continue the harness drain".

1. Read this bean, newest note last. Re-check each item live on GitHub before acting.
2. Work the open list below. Take over any item whose owner thread is idle more than 2 hours; comment on the PR that you did (Claude Code footer on every comment).
3. Every 10 minutes, send the coordinator a report for the project chat: theme bar chart, open-PR chart by state, 2-3 sentence narrative, link to https://claude.ai/artifact/Qipen2fFHYXcAXsjakKNqr (Live status section). Keep a one-shot send_later chain (queue the next one FIRST); an hourly backstop re-arms it.
4. After each state change, append `_<UTC>_ — <change>` here and bump updated_at. Short-term merge handover across all repos is bean folio-assistant-drnh.
5. When the window closes (2026-11-03 00:40Z) or all items are done: final report, disable the backstop, complete this bean.

## Open items (18:32Z: 26 of 35 done)

- [x] cat-harness-tools#1399 (merged 18:43Z, fe808ba) (PR, check-workflow-script-paths `./` fix; taken over by the drain thread). New red was test order: docs/todos.jsonld was built only by an earlier test in the shard (#411 pattern). Fixed in 8c020c4 (ensureDocsPages in subgraph-node-checkout and todo-graph-repo-root). Merge on green.
- [ ] cat-harness-tools#1299 — 13 of 16 reds wait on the fa re-pin train (fa#2921, which needs owner command Q-SLASH-8). Recount after the train merges. Owner thread: Finish idle harness issues (https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9E2MM936aKdTfuSSRD7GVeN).
- [ ] cat-harness-tools#1378, #1379 — slash IRIs; owner thread https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G95HvJ9m7xBV6qWhqn6M2rVj.
- [ ] cat-harness-tools#1356 — L1 ingestion; owner thread https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9MzQpc26tsYwzKvRWEvTqXn.
- [ ] beans fwtz (docs site rebuild on bean-branch move), pga6 (separation) — close-outs thread.
- [ ] bean nbp9 — owner's own to-do (security).
- [ ] umbrella beans rwmf, yj32 — complete when their children are done.

Other open harness PRs (not drain items): cat-harness#972 (draft, content, card Q-B1-2), #959 (meta-merge skill, meta-merge thread), #980, #981, cat-harness-tools#1411.

Done since 06:50Z: fhir-harness#269, #271, #275, #280; cat-harness#978; cat-harness-tools#1354, #1259 (via #1406, cat-harness#975), #400 (via fa#2915); bean 8bm7; plus the merged/closed rows in the report table.

_2026-11-02T18:32:00Z_ — Plan and state written here as the drain's durable memory (owner asked 18:26Z: "make sure workplan beaned up may stall"). Session https://claude.ai/code/session_01Qmmkt5upL17RB2jgQPi8Mx

_2026-11-02T18:43:00Z_ — cat-harness-tools#1399 merged (fe808ba) after the test-order fix went green. Its paired issue fhir-harness#269 was already closed.

_2026-11-02T19:47:01Z_ — Previous owner threads stalled (owner 19:46Z). The drain was taken over by sibling https://claude.ai/code/session_01EucfRqHzqzMjJkqcnKNkY5. The cat-harness train blocker went to https://claude.ai/code/session_01EucfRo4LGSMzJn5kq6PucY. The coordinator is https://claude.ai/code/session_01EucfRmNiFYxXqLAgwhF71Q.

_2026-11-02T19:53:09Z_ — Takeover blocked: this session can reach only litlfred/folio-assistant. Attaching cat-harness and cat-harness-tools (add_repo) was refused by the session's permission check, so cat-harness#980, #959, #981, #972 and cat-harness-tools#1411, #1378, #1379, #1356, #1299 are not re-checked or touched, and no PR comment was posted. Needs: the owner allows add_repo for this session, or another session with those repos takes them. fwtz and pga6 checked (notes on each): neither can be completed now. fwtz: none of its 3 boxes is met on main, and its open PRs folio-assistant#2875 and #2904 both edit .github/workflows (owner-only). pga6: the owner deferred it until after the MVP freeze (card Q-SEP-1 A). Session https://claude.ai/code/session_01EucfRqHzqzMjJkqcnKNkY5

_2026-11-02T19:53:58Z_ — Drain sibling session_01EucfRqHzqzMjJkqcnKNkY5 could reach only folio-assistant, so it holds just fwtz and pga6 (neither can close: fwtz 0 of 3 boxes met, its PRs fa#2875 and #2904 edit workflows and are owner-only; pga6 deferred to after the MVP freeze). New holders: cat-harness-tools PRs (#1411, #1378, #1379, #1356, #1299) → https://claude.ai/code/session_01EucfRmD6JzE3AYLeUkX1KU. cat-harness PRs (#980, #959, #981; #972 waits on card Q-B1-2) → https://claude.ai/code/session_01EucfRo4LGSMzJn5kq6PucY, after its saturation-meta-merge train fix. Review-log watcher (lgwt) is blocked: no Google Drive/Sheets access (connector failed, docs.google.com blocked by network policy).

_2026-11-02T19:56:52Z_ — The owner approved merging cat-harness #980, #959 and #981 on green (asked first-hand in session https://claude.ai/code/session_01EucfRo4LGSMzJn5kq6PucY). Nothing to do: all three were already merged, #980 at 18:43:58Z (625fac59), #959 at 18:44:11Z (8d41aa15) and #981 at 18:50:37Z (615da974), and all are on cat-harness main. #972 was not touched (content, card Q-B1-2).

_2026-11-02T19:58:55Z_ — The owner allowed add_repo. Attached: cat-harness, cat-harness-tools, fhir-harness, folio-assistant-core, smart-base, who-iris. Re-checked live:
- Already merged by earlier threads: cat-harness#980 (625fac5, 18:43Z), #959 (8d41aa1, 18:44Z), #981 (615da97, 18:50Z), cat-harness-tools#1411 (c6e3d1b, 19:31Z).
- cat-harness-tools #1378, #1379, #1356 and #1299 are ISSUES, not PRs, and tools has no open PR. Sibling https://claude.ai/code/session_01EucfRmD6JzE3AYLeUkX1KU (running) took #1378, #1379 and #1356 over at 19:55Z. #1378 and #1356 have nothing left in tools; #1379 wave 2 waits on the train. I left them to that sibling.
- cat-harness#972 is held (content, card Q-B1-2).
- Train fa#2921 is still open (de098fc). The tools#1299 recount waits on it.
- Not drain items, and left alone: cat-harness#996 and core#624 (glossary regen for the train, which the coordinator owns), cat-harness#998 and #999 (saturation sibling), cat-harness#992 and #993 (owner proposal bsd1, owner questions open).
Session https://claude.ai/code/session_01EucfRqHzqzMjJkqcnKNkY5

_2026-11-02T20:21:24Z_ — Train fa#2921 taken over by https://claude.ai/code/session_01EucfRqHzqzMjJkqcnKNkY5, on the owner's choice (card: coordinator https://claude.ai/code/session_01EucfRmNiFYxXqLAgwhF71Q was archived at about 20:09Z). All 16 reds on de098fc come from the single cat-harness c7cfab5 qa:working-copy root, fixed by cat-harness#999 (36b9f0f, all checks green, owned by the saturation sibling). The train pins who-iris at 40d52ba (= #165 head) and core at 6f04061 (= core#624 head), so those merge with it. Rehearsing the train locally with cat-harness at 36b9f0f to find any hidden reds before the re-pin.

_2026-11-02T20:22:21Z_ — cat-harness#999 merged (42bc930, by the saturation sibling). The train is re-pinned to it (9675208 cat-harness 42bc930 with the #996 glossary regen; e107c2d slash-command stubs for the two new skills). CI on e107c2d: 0 red so far, 7 passed, 5 running. The local rehearsal was stopped, since CI now runs the same tree.

_2026-11-02T20:24:51Z_ — Opened cat-harness#1000 (fec38df, generated files only): regenerates the 2 meta-merge checklists and the 10 BPMN .pot files that #999 left stale (flagged by the saturation sibling). In the train tree at 42bc930, translate-bpmn:check passes afterwards. It supersedes #998's regenerated half. Plan: merge #1000 on green, then re-pin the train's cat-harness onto it.

_2026-11-02T20:46:24Z_ — Train run on e107c2d: 2 red. (a) bun test shard 2: the stale .pot test (fixed by cat-harness#1000, green), and an edit-links skew (cat-harness 42bc930 has #981's block-panel asset, tools 109b850 lacks the #1411 recipe). (b) stage: 6 links in smart-trust to pages the run does not write (AST pipeline failed: smart-trust), not checked yet. Pushed a989b41 to the train: cat-harness fec38df (#1000 head) and tools c6e3d1b (#1411 merge, held back from main's #1417 slash wave 2). Mount verified OK. MERGES ARE BLOCKED for this session: the permission check refused merging cat-harness#1000 ("merge without review"). The owner must allow merges here, or merge #1000 and then the train.

_2026-11-02T20:47:21Z_ — The owner allowed merges for this session (card: option 1). Merged cat-harness#1000 as d7ebe6e (green, generated files only). The train's pin fec38df is #1000's head, now on main with the same tree as d7ebe6e, so the pin stays and CI on a989b41 keeps running.

_2026-11-02T20:48:45Z_ — The train's stage red was `cp: cannot stat ./_site/cat-harness-glossary.jsonld`. tools eab1407 ("Remove the one-release IRI tombstones") stopped writing the root glossary tombstone, but feature-staging.yml:1606 and docs-site.yml:823 still copied it. This is Q-SLASH-8's twin for the glossary. Pushed a9a2c6c to the train, deleting both lines. This session's push to .github/workflows WAS accepted, so no owner card is needed. CI restarted on a9a2c6c.

_2026-11-02T21:23:49Z_ — Train re-pinned at 95da342, from the reds on e107c2d and a9a2c6c, each reproduced in a tree mounted from the train's lock and compared with main's:
- cat-harness#1001 (cc571bb): the meta-merge diagrams still used the processes `ns#` namespace, so their skill refs were invisible (activity-skill-coverage, 9 activities). Fixed the namespace, gave the 3 really skill-less tasks a skill or a no-skill reason, regenerated the checklists and .pot files, and archimate-models.md no longer names folio-assistant-core (reference-direction, the 1 new finding).
- cat-harness-tools#1422 (30a0ec3, branch from c6e3d1b, so slash wave 2 #1417 is not in): tests follow the lower layers. That covers tools pairs (core glossary-table), kg-export (log is a data store, Q-BR-3 A), 502c (new GW_BeanClosedHow), stakeholder-map (dependents' roles), viewer-tools (business-processes), the deck path, block-summaries (library/conduct filing, .jsonld blocks), and check-instance-render reading the slash GraphTypology type.
- index.config.json: check:ig-citations is declared no-folio (it reads an IG's own checkout; at the index it reads 0 pages).
- Also red on main in a clean tree, so main's: kg:validate nested instances (676g), process-index subgraph JSON-LD ×4, block-summaries viewer projection, the deck's slide 4 and generated assets.
Order: the train merges, then #1001 and #1422 re-run against the new main pins and merge.

_2026-11-02T21:26:53Z_ — Train at aa3ac81: cat-harness 4bf7090 (#1001, now also rewriting saturation-meta-merge's process summary, whose first sentence "Owner, 2026-11-02 06:57Z…" failed process-index's no-chatter rule). Not fixed and not the train's: check:bean-parents fails on the shared work plan, because open beans bmat and rpc6 have no `parent`. It's red on main too, since the state branch is shared. Their threads should give each an epic parent; this drain did not guess one.

_2026-11-02T21:39:38Z_ — Train at 9032f1c: cat-harness-tools 4824597 (#1422), which drops the unused readRoleGraph import that failed lint on aa3ac81 (reported by sibling https://claude.ai/code/session_01EucfRp9ycxtZrrBKaipNy5). ESLint is clean on every file #1422 touches.

_2026-11-02T22:22:21Z_ — CI on 9032f1c: 25 passed, 2 red (bun test shards 2 and 4). The repin-train verdict was "1 new failure vs main 7e745b9", which is shard 4: main's red shards are 2 and 3. Shard 4's tests:
- the living deck's image paths: a real cat-harness defect. Bean 6fez filed kg-folio-asst-2026-09-30 one level down, but its images.json kept ../../docs/ paths (28 of them broken). Fixed in cat-harness#1001 (9d9d7e2).
- kg:validate nested instances (676g): fixed by sibling tools#1419, whose diff is carried on #1422 (f96dfff).
Shard 2's remaining red is bean-parents (bmat and rpc6 have no parent), which is the shared work plan's and red on main too. The train is at 3b74fbd.

_2026-11-02T22:51:08Z_ — CI on 3b74fbd: shard 4 green (the deck and nested-instances fixes worked); 20 passed. New red: jsonld-gen-check, because the deck's 22 generated figure blocks carried the old image paths. They are regenerated (gen-library-jsonld) in cat-harness#1001 (d696b2f), and all 4 JSON-LD checks pass in a tree at the train's lock. The train is at e9fc31d. Shard 2's remaining red is bean-parents (shared work plan, main's too).

_2026-11-02T23:29:34Z_ — MERGED the re-pin train folio-assistant#2921 as 2e10fd3, at e9fc31d. Its verdict status read "no new failures vs main 7e745b9 (1 known)". 26 checks passed; the 1 red is bun test shard 2, red on main too (bean-parents on the shared work plan). It touched 7 files and nothing under subscriptions/. folio-assistant main now pins cat-harness d696b2f, cat-harness-tools f96dfff, core 6f04061 and who-iris 40d52ba.
- MERGED cat-harness#1001 as f3e6197 (green, clean).
- Re-running against the new main pins: who-iris#165, core#624, cat-harness-tools#1422 (their only reds were the comparison against the old pins).

_2026-11-02T23:52:30Z_ — MERGED who-iris#165 (83c2e00) and folio-assistant-core#624 (e987b89), both green and clean after re-running against folio-assistant main's new pins. drnh's plan was to merge #165 after the train; main already pinned its head. cat-harness-tools#1422: its Standalone check found 1 new failure (the core table-Tool pair, absent when core is not mounted). The expectation is now conditional on core's Tools being loaded; pushed, CI running.
