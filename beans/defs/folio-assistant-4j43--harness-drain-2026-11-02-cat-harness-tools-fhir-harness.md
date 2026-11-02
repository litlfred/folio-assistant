---
# folio-assistant-4j43
$schema: bean/1.0.0
title: 'Harness drain 2026-11-02: cat-harness, cat-harness-tools, fhir-harness'
status: in-progress
type: epic
priority: high
created_at: 2026-11-02T06:50:00Z
updated_at: 2026-11-02T20:21:24Z
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
